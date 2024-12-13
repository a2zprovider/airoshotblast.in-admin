import express from "express";
const routerCareer = express.Router();
import checkPermission from "../middleware/checkPermission.js";
const { auth } = require('../middleware/auth.js');
const CareerController = require("../controllers/admin/career.controller.js");

// Careers
routerCareer.post("/", auth, checkPermission('Career', 'Create'), CareerController.create);
routerCareer.get("/", auth, checkPermission('Career', 'Read'), CareerController.findAll);
routerCareer.get("/create", auth, checkPermission('Career', 'Add'), CareerController.add);
routerCareer.get("/:id", auth, checkPermission('Career', 'Read'), CareerController.findOne);
routerCareer.get("/edit/:id", auth, checkPermission('Career', 'Edit'), CareerController.edit);
routerCareer.post("/update/:id", auth, checkPermission('Career', 'Update'), CareerController.update);
routerCareer.get("/delete/:id", auth, checkPermission('Career', 'Delete'), CareerController.delete);
routerCareer.post("/deleteAll", auth, checkPermission('Career', 'Delete'), CareerController.deleteAll);

export default routerCareer;