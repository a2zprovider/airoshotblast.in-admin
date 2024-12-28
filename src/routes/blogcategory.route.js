import express from "express";
const routerBlogcategory = express.Router();
import checkPermission from "../middleware/checkPermission.js";
const { auth } = require('../middleware/auth.js');
const BlogCategoryController = require("../controllers/admin/blogcategory.controller.js");

// Blog Category
routerBlogcategory.post("/", auth, checkPermission('Blogcategory', 'Create'), BlogCategoryController.create);
routerBlogcategory.get("/", auth, checkPermission('Blogcategory', 'Read'), BlogCategoryController.findAll);
routerBlogcategory.get("/create", auth, checkPermission('Blogcategory', 'Add'), BlogCategoryController.add);
routerBlogcategory.get("/:id", auth, checkPermission('Blogcategory', 'Read'), BlogCategoryController.findOne);
routerBlogcategory.get("/edit/:id", auth, checkPermission('Blogcategory', 'Edit'), BlogCategoryController.edit);
routerBlogcategory.post("/update/:id", auth, checkPermission('Blogcategory', 'Update'), BlogCategoryController.update);
routerBlogcategory.get("/delete/:id", auth, checkPermission('Blogcategory', 'Delete'), BlogCategoryController.delete);
routerBlogcategory.post("/deleteAll", auth, checkPermission('Blogcategory', 'Delete'), BlogCategoryController.deleteAll);
routerBlogcategory.get("/status/:id", auth, checkPermission('Blogcategory', 'Status'), BlogCategoryController.status);

export default routerBlogcategory;