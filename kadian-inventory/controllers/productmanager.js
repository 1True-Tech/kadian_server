const productDB = require("../models/product");
const crypto = require('crypto');

function addProduct(title, description, price, imgurl, category, quantity) {
    let productid = crypto.randomBytes(8).toString('hex');
    try {
        productDB.product.insertOne({
            ProductID: productid,
            ProductName: title,
            ProductDescription: description,
            ProductPrice: price,
            ProductImage: imgurl,
            ProductCategory: category,
            Stock: quantity
        }).then(function(result) {
            console.log(result);
        });
    } catch (e) {
        console.error(e);
    }
}

function getProduct(prodid, fn) {
    try {
        productDB.product.findOne({ProductID: { $eq: prodid } }).then(function(result) {
            fn(result);
        });
    } catch (e) {
        console.error(e);
    }
}

function getProducts(fn) {
    try {
        productDB.product.find().then(function(result) {
            fn(result);
        });
    } catch (e) {
        console.error(e);
    }
}

function updateStock(prodid, qtochange, fn) {
    try {
        productDB.product.findOneAndUpdate({ ProductID: { $eq: prodid } }, { $inc: {Stock: qtochange} }, {upsert: false, new: true}).then(function(result) {
            fn(result);
        });
    } catch (e) {
        console.error(e);
    }
}

module.exports.addProduct = addProduct;
module.exports.getProduct = getProduct;
module.exports.getProducts = getProducts;
module.exports.updateStock = updateStock;