import express from "express";
const routerRole = express.Router();
import checkPermission from "../middleware/checkPermission.js";
const { auth } = require('../middleware/auth.js');
const RoleController = require("../controllers/admin/role.controller.js");

// Roles
routerRole.post("/", auth, checkPermission('Role', 'Create'), RoleController.create);
routerRole.get("/", auth, checkPermission('Role', 'Read'), RoleController.findAll);
routerRole.get("/create", auth, checkPermission('Role', 'Add'), RoleController.add);
routerRole.get("/:id", auth, checkPermission('Role', 'Read'), RoleController.findOne);
routerRole.get("/edit/:id", auth, checkPermission('Role', 'Edit'), RoleController.edit);
routerRole.post("/update/:id", auth, checkPermission('Role', 'Update'), RoleController.update);
routerRole.get("/delete/:id", auth, checkPermission('Role', 'Delete'), RoleController.delete);
routerRole.post("/deleteAll", auth, checkPermission('Role', 'Delete'), RoleController.deleteAll);

export default routerRole;