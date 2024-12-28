import express from "express";
const routerApplication = express.Router();
import checkPermission from "../middleware/checkPermission.js";
const { auth } = require('../middleware/auth.js');
const ApplicationController = require("../controllers/admin/application.controller.js");

// Applications
routerApplication.post("/", auth, checkPermission('Application', 'Create'), ApplicationController.create);
routerApplication.get("/", auth, checkPermission('Application', 'Read'), ApplicationController.findAll);
routerApplication.get("/create", auth, checkPermission('Application', 'Add'), ApplicationController.add);
routerApplication.get("/:id", auth, checkPermission('Application', 'Read'), ApplicationController.findOne);
routerApplication.get("/edit/:id", auth, checkPermission('Application', 'Edit'), ApplicationController.edit);
routerApplication.post("/update/:id", auth, checkPermission('Application', 'Update'), ApplicationController.update);
routerApplication.get("/delete/:id", auth, checkPermission('Application', 'Delete'), ApplicationController.delete);
routerApplication.post("/deleteAll", auth, checkPermission('Application', 'Delete'), ApplicationController.deleteAll);
routerApplication.get("/status/:id", auth, checkPermission('Application', 'Status'), ApplicationController.status);

export default routerApplication;