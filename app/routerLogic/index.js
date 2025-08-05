/// <reference path="../../types/index.js" />

import objectErrorBoundary from "../../lib/utils/objectErrorBoundary.js";

/**
 * @returns {Promise<generalResponse>}
 */
export async function healthLogic() {
  const {errorMessage} = objectErrorBoundary({s:{
    name:undefined,
    email:{
      first: undefined,
      last:"s"
    }
  }}, ["s.email.first"], {
    checkers:{
      "s.email.first":{
        action:()=>false,
        message:"{{value}} is missing"
      }
    }
  })
  return {
    status: 'ok',
    message: 'Server is running smoothly!' +  errorMessage,
  };
}
