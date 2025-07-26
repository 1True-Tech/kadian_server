import env from '../constants/env.js';
import isDev from './isDev.js'; // Ensure this points to your isDev() module

/**
 * Base URL depending on environment.
 * @type {string}
 */
export default isDev() ? `http://localhost:${env.PORT}` : 'https://kadian-server.vercel.app';
