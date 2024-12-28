import express from "express";
const routerCategory = express.Router();
import checkPermission from "../middleware/checkPermission.js";
const { auth } = require('../middleware/auth.js');
const CategoryController = require("../controllers/admin/category.controller.js");

// Categorys
routerCategory.post("/", auth, checkPermission('Category', 'Create'), CategoryController.create);
routerCategory.get("/", auth, checkPermission('Category', 'Read'), CategoryController.findAll);
routerCategory.get("/create", auth, checkPermission('Category', 'Add'), CategoryController.add);
routerCategory.get("/:id", auth, checkPermission('Category', 'Read'), CategoryController.findOne);
routerCategory.get("/edit/:id", auth, checkPermission('Category', 'Edit'), CategoryController.edit);
routerCategory.post("/update/:id", auth, checkPermission('Category', 'Update'), CategoryController.update);
routerCategory.get("/delete/:id", auth, checkPermission('Category', 'Delete'), CategoryController.delete);
routerCategory.post("/deleteAll", auth, checkPermission('Category', 'Delete'), CategoryController.deleteAll);
routerCategory.get("/status/:id", auth, checkPermission('Category', 'Status'), CategoryController.status);

export default routerCategory;