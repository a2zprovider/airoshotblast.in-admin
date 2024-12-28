import express from "express";
const routerTag = express.Router();
import checkPermission from "../middleware/checkPermission.js";
const { auth } = require('../middleware/auth.js');
const TagController = require("../controllers/admin/tag.controller.js");

// Tags
routerTag.post("/", auth, checkPermission('Tag', 'Create'), TagController.create);
routerTag.get("/", auth, checkPermission('Tag', 'Read'), TagController.findAll);
routerTag.get("/create", auth, checkPermission('Tag', 'Add'), TagController.add);
routerTag.get("/:id", auth, checkPermission('Tag', 'Read'), TagController.findOne);
routerTag.get("/edit/:id", auth, checkPermission('Tag', 'Edit'), TagController.edit);
routerTag.post("/update/:id", auth, checkPermission('Tag', 'Update'), TagController.update);
routerTag.get("/delete/:id", auth, checkPermission('Tag', 'Delete'), TagController.delete);
routerTag.post("/deleteAll", auth, checkPermission('Tag', 'Delete'), TagController.deleteAll);
routerTag.get("/status/:id", auth, checkPermission('Tag', 'Status'), TagController.status);

export default routerTag;