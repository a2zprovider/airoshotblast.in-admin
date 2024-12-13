import express from "express";
const routerUser = express.Router();
import checkPermission from "../middleware/checkPermission.js";
const { auth } = require('../middleware/auth.js');
const UserController = require("../controllers/admin/user.controller.js");

// Users
routerUser.post("/", auth, checkPermission('User', 'Create'), UserController.create);
routerUser.get("/", auth, checkPermission('User', 'Read'), UserController.findAll);
routerUser.get("/create", auth, checkPermission('User', 'Add'), UserController.add);
routerUser.get("/:id", auth, checkPermission('User', 'Read'), UserController.findOne);
routerUser.get("/edit/:id", auth, checkPermission('User', 'Edit'), UserController.edit);
routerUser.post("/update/:id", auth, checkPermission('User', 'Update'), UserController.update);
routerUser.get("/delete/:id", auth, checkPermission('User', 'Delete'), UserController.delete);
routerUser.post("/deleteAll", auth, checkPermission('User', 'Delete'), UserController.deleteAll);

export default routerUser;