import mongoose from "mongoose";

const { Schema } = mongoose;

// Address subdocument schema (used by User and Order)
const address = new Schema({
  line1:   { type: String, required: true },
  line2:   { type: String },
  city:    { type: String, required: true },
  state:   { type: String, required: true },
  postal:  { type: String, required: true },
  country: { type: String, required: true },
  primary: {type: Boolean, default: false}
}, {_id:true});



export default address
