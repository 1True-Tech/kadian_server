import Image from "../../../../models/image.js";
import getDbConnection from "../../../../lib/utils/mongo/get-db-connection.js";

/**
 * Get a single image by ID
 * @param {Object} event The route event
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

    return { 
      status: "good", 
      statusCode: 200, 
      image,
      message: "Image fetched successfully" 
    };
  } catch (error) {
    return {
      status: "bad",
      statusCode: 500,
      message: `Failed to fetch image: ${error.message}`
    };
  }
}

export default get;
