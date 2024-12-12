import express from "express";
const routerPermission = express.Router();
import checkPermission from "../middleware/checkPermission.js";
const { auth } = require('../middleware/auth.js');
const PermissionController = require("../controllers/admin/permission.controller.js");

// Permissions
routerPermission.post("/", auth, checkPermission('Permission', 'Create'), PermissionController.create);
routerPermission.get("/", auth, checkPermission('Permission', 'Read'), PermissionController.findAll);
routerPermission.get("/create", auth, checkPermission('Permission', 'Add'), PermissionController.add);
routerPermission.get("/:id", auth, checkPermission('Permission', 'Read'), PermissionController.findOne);
routerPermission.get("/edit/:id", auth, checkPermission('Permission', 'Edit'), PermissionController.edit);
routerPermission.post("/update/:id", auth, checkPermission('Permission', 'Update'), PermissionController.update);
routerPermission.get("/delete/:id", auth, checkPermission('Permission', 'Delete'), PermissionController.delete);
routerPermission.post("/deleteAll", auth, checkPermission('Permission', 'Delete'), PermissionController.deleteAll);

export default routerPermission;