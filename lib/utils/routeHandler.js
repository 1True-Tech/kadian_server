/// <reference path="../../types/index.js" />

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
  return (params)=>routeHandler({
    app,
    ...params
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
  if (typeof app[verb] !== 'function') {
    throw new Error(`Invalid HTTP method "${method}" for route ${path}`);
  }

  app[verb](
    path,
    ...middleware,
    async (req, res) => {
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

        if (res.headersSent) return;

        if (result !== undefined) {
          if (Buffer.isBuffer(result) || result?.pipe) {
            return res.status(result.statusCode || 200).send(result);
          } else {
            return res.status(result.statusCode || 200).json(result);
          }
        }
      } catch (error) {
        if (res.headersSent) return;

        const status = error?.status || error?.statusCode || 500;
        const code = error?.code || "INTERNAL_ERROR";
        const message = error?.message || "An unexpected error occurred";

        console.error(`ERROR in ${verb.toUpperCase()} ${path}:`, error);

        return res.status(status).json({
          error: true,
          message,
          code,
          status
        });
      }
    }
  );
}
