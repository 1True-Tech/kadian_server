import Image from "../../../../models/image.js";
import getDbConnection from "../../../../lib/utils/mongo/get-db-connection.js";

/**
 * Get a single image by ID
 * @param {import("../../../../lib/utils/withErrorHandling.js").RouteEvent} event The route event
 * @returns {Promise<Object>} Response with image data
 */
export async function get(event) {
  try {
    const { id } = event.params;
    const imageConn = getDbConnection("images");
    const image = await Image.findById(id);
    
    if (!image) {
      return { 
        status: "bad", 
        statusCode: 404, 
        message: "Image not found" 
      };
    }
    const buffer = Buffer.from(image.data, 'base64');
    event.res.setHeader('Content-Type', image.mimetype);
    event.res.send(buffer)
  } catch (error) {
    return {
      status: "bad",
      statusCode: 500,
      message: `Failed to fetch image: ${error.message}`
    };
  }
}

export default get;
