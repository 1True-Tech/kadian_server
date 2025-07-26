/// <reference path="../../types/index.js" />

/**
 * @returns {Promise<generalResponse>}
 */
export async function healthLogic() {
  return {
    status: 'ok',
    message: 'Server is running smoothly!',
  };
}
