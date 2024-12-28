import express from "express";
const routerBlog = express.Router();
import checkPermission from "../middleware/checkPermission.js";
const { auth } = require('../middleware/auth.js');
const BlogController = require("../controllers/admin/blog.controller.js");

// Blogs
routerBlog.post("/", auth, checkPermission('Blog', 'Create'), BlogController.create);
routerBlog.get("/", auth, checkPermission('Blog', 'Read'), BlogController.findAll);
routerBlog.get("/create", auth, checkPermission('Blog', 'Add'), BlogController.add);
routerBlog.get("/:id", auth, checkPermission('Blog', 'Read'), BlogController.findOne);
routerBlog.get("/edit/:id", auth, checkPermission('Blog', 'Edit'), BlogController.edit);
routerBlog.post("/update/:id", auth, checkPermission('Blog', 'Update'), BlogController.update);
routerBlog.get("/delete/:id", auth, checkPermission('Blog', 'Delete'), BlogController.delete);
routerBlog.post("/deleteAll", auth, checkPermission('Blog', 'Delete'), BlogController.deleteAll);
routerBlog.get("/status/:id", auth, checkPermission('Blog', 'Status'), BlogController.status);

export default routerBlog;