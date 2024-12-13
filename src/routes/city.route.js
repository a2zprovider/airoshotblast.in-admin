import express from "express";
const routerCity = express.Router();
import checkPermission from "../middleware/checkPermission.js";
const { auth } = require('../middleware/auth.js');
const CityController = require("../controllers/admin/city.controller.js");

// Citys
routerCity.post("/", auth, checkPermission('City', 'Create'), CityController.create);
routerCity.get("/", auth, checkPermission('City', 'Read'), CityController.findAll);
routerCity.get("/create", auth, checkPermission('City', 'Add'), CityController.add);
routerCity.get("/:id", auth, checkPermission('City', 'Read'), CityController.findOne);
routerCity.get("/edit/:id", auth, checkPermission('City', 'Edit'), CityController.edit);
routerCity.post("/update/:id", auth, checkPermission('City', 'Update'), CityController.update);
routerCity.get("/delete/:id", auth, checkPermission('City', 'Delete'), CityController.delete);
routerCity.post("/deleteAll", auth, checkPermission('City', 'Delete'), CityController.deleteAll);

export default routerCity;