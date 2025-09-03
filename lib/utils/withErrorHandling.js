/// <reference path="../../types/index.js" />
/// <reference path="../../types/user.js" />

/**
 * @typedef {Object} UserAuth
 * @property {string} userId
 * @property {UserRole|"guest"} userRole
 * @property {string} token
 */
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
 * @property {UserAuth} auth
 *
 * @typedef {Object} ErrorHandlingOptions
 * @property {Array<'connectionActivity'>} [skipProcesses]  // e.g. skip ping check
 * @property {boolean|undefined} requireAuth
 * @property {UserRole[]} allowedRoles
 */

import env from "../constants/env.js";
import generateGuestId from "./generate-guest-id.js";
import getAccessTier from "./get-access-tier.js";
import pingUrl from "./ping.js";
import verifyUserTokens from "./verify-user-tokens.js";

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
    const { res, req } = event;

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

    // process authentication
    const authHeader = req.headers.authorization;
    // resolve access tier grading based on roles
    const accessTier = getAccessTier(options.allowedRoles);
    const needMinUserRole = accessTier !== "guest" || options.requireAuth;

    if (needMinUserRole && (!authHeader || !authHeader.startsWith("Bearer "))) {
      throw {
        statusCode: 401,
        message: "Unauthorized: Bearer token required.",
      };
    }

    // Verify token and check role if required

    const { tokenValue, type } = verifyUserTokens(
      (authHeader || "").replace("Bearer ", ""),
      env.JWT_ACCESS_SECRET || ""
    );

    if (needMinUserRole && (type !== "valid token" || !tokenValue)) {
      return {
        statusCode: 401,
        message: type || "Invalid or expired token.",
      };
    }

    // Role-based access control
    if (needMinUserRole && options.allowedRoles?.length) {
      const userRole = tokenValue?.role;
      if (!userRole || !options.allowedRoles.includes(userRole)) {
        return {
          statusCode: 403,
          message: "Forbidden: Insufficient privileges.",
        };
      }
    }

    event.auth = {
      userId: tokenValue?.userId || generateGuestId(),
      userRole: tokenValue?.role || "guest",
      token: authHeader || "",
    };
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
        connectionActivity: res.locals.isOnline || "offline",
        statusCode,
        message,
        success: false,
      };
    }
  };
}
