/// <reference path="../../types/index.js" />

import chalk from "chalk";
/**
 * @typedef {import('express').Application | import('express').Router} AppOrRouter
 * @typedef {'get'|'post'|'put'|'patch'|'delete'|'all'} HttpMethod
 * @typedef {import('express').Request} Request
 * @typedef {import('express').Response} Response
 * @typedef {import('express').NextFunction} NextFunction
 * @typedef {import('express').RequestHandler} RequestHandler
 *
 * @typedef {Object} RouteEvent
 * @property {Request}  req
 * @property {Response} res
 * @property {NextFunction} next
 * @property {Record<string,string>} params
 * @property {Record<string, any>} query
 * @property {*} body
 *
 * @typedef {Object} RouteConfig
 * @property {AppOrRouter}      app
 * @property {HttpMethod}       method
 * @property {string}           path
 * @property {RequestHandler[]} [middleware]
 * @property {(event: RouteEvent) => any} handler
 */

/**
 * Registers a route on an Express app or Router.
 *
 * @param {AppOrRouter} app - An Express app or router instance.
 * @returns {(config: Omit<RouteConfig, 'app'>) => void} - A function that accepts a route config (without the app).
 */
export default function useRouter(app) {
  return (params) =>
    routeHandler({
      app,
      ...params,
    });
}

/**
 * If the handler returns a value (and hasn’t already responded),
 * we send it: JSON by default, or raw for Buffer/streams.
 *
 * If the handler throws, a structured JSON error is returned.
 *
 * @param {RouteConfig} config
 */
export function routeHandler({ app, method, path, middleware = [], handler }) {
  const verb = method.toLowerCase();
  if (typeof app[verb] !== "function") {
    throw new Error(`Invalid HTTP method "${method}" for route ${path}`);
  }

  app[verb](path, ...middleware, async (req, res) => {
    const event = {
      req,
      res,
      next: () => {},
      params: /** @type {Record<string, string>} */ (req.params),
      query: /** @type {Record<string, any>} */ (req.query),
      body: req.body,
    };

    try {
      /** @type {generalResponse} */
      const result = await handler(event);
      const action_path = chalk.gray.bold(`${path}`);
      const action_verb = chalk.white.bold(verb.toUpperCase());
      if (res.headersSent) return;

      if (result !== undefined && result.statusCode <= 299) {
        const status = chalk.green.bold(result?.statusCode || 200);

        if (Buffer.isBuffer(result) || result?.pipe) {
          const message = chalk.gray.bold("Sending raw response for");
          console.log(`
${message} ${action_verb} ${action_path}: ${status}
`);
          return res.status(result.statusCode || 200).send(result);
        } else {
          const message = chalk.gray.bold("Sending JSON response for");

          console.log(`${message} ${action_verb} ${action_path}: ${status}`);
          return res.status(result.statusCode || 200).json(result);
        }
      } else {
        const status = chalk.red.bold(result?.statusCode || 500);
        const message = chalk.gray.bold("Sending response for");
        console.log(`${message} ${action_verb} ${action_path}: ${status}`);
        return res.status(result?.statusCode || 500).json({
          message: result?.message || "An unexpected error occurred",
          status: "bad",
          connectionActivity: res.locals.isOnline || "offline",
          statusCode: result?.statusCode || 500,
          success: false,
        });
      }
    } catch (error) {
      if (res.headersSent) return;

      const statusCode = error?.status || error?.statusCode || 500;
      const message = error?.message || "An unexpected error occurred";
      console.error(`ERROR in ${verb.toUpperCase()} ${path}:`, error);

      return res.status(statusCode).json({
        status: "bad",
        connectionActivity: res.locals.isOnline || "offline",
        statusCode,
        message,
        success: false,
      });
    }
  });
}
