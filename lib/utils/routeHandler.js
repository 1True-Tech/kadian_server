
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
 * If the handler returns a value (and hasn’t already responded),
 * we send it: JSON by default, or raw for Buffer/streams.
 *
 * @param {RouteConfig} config
 */
export default function routeHandler({ app, method, path, middleware = [], handler }) {
  const verb = method.toLowerCase();
  if (typeof app[verb] !== 'function') {
    throw new Error(`Invalid HTTP method "${method}" for route ${path}`);
  }

  app[verb](
    path,
    ...middleware,
    async (req, res, next) => {
      const event = {
        req,
        res,
        next,
        params: /** @type {Record<string,string>} */ (req.params),
        query: /** @type {Record<string, any>} */ (req.query),
        body: req.body,
      };

      try {
        const result = await handler(event);

        if (res.headersSent) {
          // handler already wrote or streamed
          return;
        }

        if (result !== undefined) {
          // JSON by default
          if (Buffer.isBuffer(result) || result.pipe) {
            // streaming or buffer
            return res.send(result);
          } else {
            return res.json(result);
          }
        }
      } catch (err) {
        next(err);
      }
    }
  );
}
