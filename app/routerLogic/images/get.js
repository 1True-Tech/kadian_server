import Image from "../../../models/image.js";
import getDbConnection from "../../../lib/utils/mongo/get-db-connection.js";

/**
 * Get all images (without base64 data)
 * @returns {Promise<Object>} Response with list of images
 */
export async function get() {
  try {
    const imageConn = getDbConnection("images");
    const images = await Image.find({}, { data: 0 }); // Exclude base64 data
    
    return { 
      status: "good", 
      statusCode: 200, 
      images,
      message: "Images fetched successfully" 
    };
  } catch (error) {
    return {
      status: "bad",
      statusCode: 500,
      message: `Failed to fetch images: ${error.message}`
    };
  }
}

export default get;
