import Image from "../../../models/image.js";
import getDbConnection from "../../../lib/utils/mongo/get-db-connection.js";

/**
 * Upload an image as base64 to MongoDB
 * @param {Object} event The route event
 * @returns {Promise<Object>} Response with image ID
 */
export async function post(event) {
  const { filename, data, mimetype } = event.body;
  
  if (!filename || !data || !mimetype) {
    return { 
      status: "bad", 
      statusCode: 400, 
      message: "Missing required image data" 
    };
  }

  try {
    const imageConn = getDbConnection("images");
    const image = new Image({ filename, data, mimetype });
    await image.save();

    return { 
      status: "good", 
      statusCode: 201, 
      imageId: image._id,
      message: "Image uploaded successfully" 
    };
  } catch (error) {
    return {
      status: "bad",
      statusCode: 500,
      message: `Failed to upload image: ${error.message}`
    };
  }
}

export default post;
