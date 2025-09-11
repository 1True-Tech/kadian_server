// lib/utils/cloudinary.js
import { v2 as cloudinary } from "cloudinary";
import env from "../constants/env.js";

cloudinary.config({
  cloudinary_url: env.CLOUDINARY_URL,
  secure: true, // ensures https URLs
});

export default cloudinary;
