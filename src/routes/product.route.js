import express from "express";
const routerProduct = express.Router();
import checkPermission from "../middleware/checkPermission.js";
const { auth } = require('../middleware/auth.js');
const ProductController = require("../controllers/admin/product.controller.js");

// Products
routerProduct.post("/", auth, checkPermission('Product', 'Create'), ProductController.create);
routerProduct.get("/", auth, checkPermission('Product', 'Read'), ProductController.findAll);
routerProduct.get("/create", auth, checkPermission('Product', 'Add'), ProductController.add);
routerProduct.get("/:id", auth, checkPermission('Product', 'Read'), ProductController.findOne);
routerProduct.get("/edit/:id", auth, checkPermission('Product', 'Edit'), ProductController.edit);
routerProduct.post("/update/:id", auth, checkPermission('Product', 'Update'), ProductController.update);
routerProduct.get("/delete/:id", auth, checkPermission('Product', 'Delete'), ProductController.delete);
routerProduct.post("/deleteAll", auth, checkPermission('Product', 'Delete'), ProductController.deleteAll);
routerProduct.get("/status/:id", auth, checkPermission('Product', 'Status'), ProductController.status);

export default routerProduct;