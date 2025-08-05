import mongoose from "mongoose";
import env from "../constants/env";

const connections= {};

export default function (dbName) {
  if (connections[dbName]) {
    return connections[dbName];
  }
  const uri = env.MONGODB_URI;
  if (!uri) throw new Error("No MONGODB_URI found");
  const conn = mongoose.createConnection(uri, { dbName });
  connections[dbName] = conn;
  return conn;
}