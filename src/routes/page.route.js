import express from "express";
const routerPage = express.Router();
import checkPermission from "../middleware/checkPermission.js";
const { auth } = require('../middleware/auth');
const PageController = require("../controllers/admin/page.controller");

// Pages
routerPage.post("/", auth, checkPermission('Page', 'Create'), PageController.create);
routerPage.get("/", auth, checkPermission('Page', 'Read'), PageController.findAll);
routerPage.get("/create", auth, checkPermission('Page', 'Add'), PageController.add);
routerPage.get("/:id", auth, checkPermission('Page', 'Read'), PageController.findOne);
routerPage.get("/edit/:id", auth, checkPermission('Page', 'Edit'), PageController.edit);
routerPage.post("/update/:id", auth, checkPermission('Page', 'Update'), PageController.update);
routerPage.get("/delete/:id", auth, checkPermission('Page', 'Delete'), PageController.delete);
routerPage.post("/deleteAll", auth, checkPermission('Page', 'Delete'), PageController.deleteAll);
routerPage.get("/status/:id", auth, checkPermission('Page', 'Status'), PageController.status);

export default routerPage;