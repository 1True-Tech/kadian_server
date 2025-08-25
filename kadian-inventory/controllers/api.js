//API for managing inventory.

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const productManager = require('../controllers/productmanager.js');

app.use(bodyParser.json());

//Retrieve all products.
app.get('/getproducts', (request, response) => {
    try {
        productManager.getProducts(function(result) {
            response.send(result);
            response.end();
        });
    } catch (e) {
        console.error(e);
    }
});
//Find a product by ID.
app.get('/product', (request, response) => {
    let productid = request.query.productid;
    try {
        productManager.getProduct(productid, function(result) {
            response.send(result);
            response.end();
        });
    } catch (e) {
        console.error(e);
    }
});
//Add a new product to the inventory.
app.post('/addproduct', (request, response) => {
    let title = request.body.title;
    let description = request.body.description;
    let price = request.body.price;
    let image = request.body.image;
    let category = request.body.category;
    let quantity = request.body.quantity;

    try {
        productManager.addProduct(title, description, price, image, category, quantity);
        response.send('Product added');
        response.end();
    } catch (e) {
        response.status(500).send('An error occurred while adding the product.');
        console.error(e);
    }
});
//Add or subtract stock.
app.post('/updatestock', (request, response) => {
    let productid = request.body.productid;
    let qtochange = request.body.qtochange;

    productManager.updateStock(productid, qtochange, function(result) {
        response.send(result);
        response.end();
    });
});
//Retrieve the contents of the user's shopping cart.
app.get("/cart", function(request, response) { //View contents of shopping cart

});

app.listen(8080, () => {});