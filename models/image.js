import { Schema } from "mongoose";
import getDbConnection from "../lib/utils/mongo/get-db-connection.js";

const ImageSchema = new Schema({
  filename: { type: String, required: true },
  data: { type: String, required: true }, // base64 string
  mimetype: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now }
});

const imageConn = getDbConnection("images");
const Image = imageConn.models.Image || imageConn.model("Image", ImageSchema);

export default Image;
