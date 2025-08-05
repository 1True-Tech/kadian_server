/// <reference path="../../types/index.js" />


/**
 * @typedef {import('express').Request} Request
 * @typedef {import('express').Response} Response
 * @typedef {import('express').NextFunction} NextFunction
 *
 * @typedef {Object} RouteEvent
 * @property {Request}  req
 * @property {Response} res
 * @property {NextFunction} next
 * @property {Record<string,string>} params
 * @property {Record<string, any>} query
 * @property {*} body
 *
 * @typedef {Object} ErrorHandlingOptions
 * @property {Array<'connectionActivity'>} [skipProcesses]  // e.g. skip ping check
 */

import pingUrl from "./ping.js";

/**
 * Normalize any thrown value into message + statusCode.
 * @param  {unknown} err
 * @returns {{ message: string, statusCode: number }}
 */
function normalizeError(err) {
  let message = "Internal server error";
  let statusCode = 500;

  if (err instanceof Error) {
    message = err.message;
  } else if (typeof err === "string") {
    message = err;
  } else if (err && typeof err === "object") {
    const { message: m, statusCode: sc } = err;
    message = m || message;
    statusCode = sc;
  }

  return { message, statusCode };
}

/**
 * Wraps an Express-style event handler with:
 *  - Internet‑connectivity check (via pingUrl())
 *  - Attaches isOnline to res.locals
 *  - Default JSON success or error envelope
 *
 * @template ReturnT
 * @param {(event: RouteEvent) => Promise<Partial<generalResponse> & ReturnT>} handler
 * @param {ErrorHandlingOptions} [options={}]
 * @returns {(event: RouteEvent) => Promise<Partial<generalResponse> & ReturnT>}
 */
export default function withErrorHandling(handler, options = {}) {
  return async function (event) {
    const { res } = event;

    // 1. Connectivity check
    try {
      const online = await pingUrl();
      const conn = online ? "online" : "offline";
      res.locals.isOnline = conn;

      if (
        conn === "offline" &&
        !options.skipProcesses?.includes("connectionActivity")
      ) {
        return {
          status: "bad",
          connectionActivity: "offline",
          statusCode: 503,
          message: "Service unavailable: cannot reach the internet.",
        };
      }
    } catch {
      res.locals.isOnline = "offline";
    }

    // 2. Execute handler and build envelope
    try {
      const data = await handler(event);
      return {
        message: "Request processed successfully",
        connectionActivity: res.locals.isOnline,
        statusCode: 200,
        success: true,
        status: "good",
        ...data,
      };
    } catch (err) {
      const { message, statusCode } = normalizeError(err);
      return {
        status: "bad",
        connectionActivity: res.locals.isOnline || "online",
        statusCode,
        message,
        success: false,
      };
    }
  };
}
