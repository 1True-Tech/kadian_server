const mongoose = require("mongoose");

mongoose.connect("mongodb://localhost/storefront");

const dbase = mongoose.connection;

dbase.on("error", console.error.bind(console, "connection error:"));
dbase.once("open", () => {
    console.log("Connected to MongoDB database.");
});

const articleSchema = new mongoose.Schema({ // These can be press releases or announcements of new product launches. They are great for SEO because they increase the text-to-html ratio.
    Title: String,
    MetaDescription: String, //Used for both the meta description and excerpt if any.
    Body: String,
    FeaturedImage: String, //URL
    DatePublished: Date
});

const productSchema = new mongoose.Schema({
    ProductID: String, //Will be randomly generated.
    ProductTitle: String,
    ProductDescription: String,
    ProductPrice: Number,
    SalePrice: Number,
    OnSale: Boolean,
    ProductImage: String,
    ProductCategory: String,
    DateAdded: Date
});

const article = mongoose.model("Article", articleSchema);
const product = mongoose.model("Product", productSchema);

module.exports.article = article;
module.exports.product = product;