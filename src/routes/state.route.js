import express from "express";
const routerState = express.Router();
import checkPermission from "../middleware/checkPermission.js";
const { auth } = require('../middleware/auth.js');
const StateController = require("../controllers/admin/state.controller.js");

// States
routerState.post("/", auth, checkPermission('State', 'Create'), StateController.create);
routerState.get("/", auth, checkPermission('State', 'Read'), StateController.findAll);
routerState.get("/create", auth, checkPermission('State', 'Add'), StateController.add);
routerState.get("/:id", auth, checkPermission('State', 'Read'), StateController.findOne);
routerState.get("/edit/:id", auth, checkPermission('State', 'Edit'), StateController.edit);
routerState.post("/update/:id", auth, checkPermission('State', 'Update'), StateController.update);
routerState.get("/delete/:id", auth, checkPermission('State', 'Delete'), StateController.delete);
routerState.post("/deleteAll", auth, checkPermission('State', 'Delete'), StateController.deleteAll);
routerState.get("/status/:id", auth, checkPermission('State', 'Status'), StateController.status);

export default routerState;