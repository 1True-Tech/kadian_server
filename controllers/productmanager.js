const productDB = require("../models/product");

function addProduct(title, description, price, imgurl, category) {
    let productid = crypto.randomBytes(16).toString('hex');
    productDB.product.insertOne({
        ProductID: productid,
        ProductName: title,
        ProductDescription: description,
        ProductPrice: price,
        ProductImage: imgurl,
        ProductCategory: category
    }).then(function(result) {
        console.log(result);
    });
}

module.exports.addProduct = addProduct;