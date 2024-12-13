import express from "express";
const routerCountry = express.Router();
import checkPermission from "../middleware/checkPermission.js";
const { auth } = require('../middleware/auth.js');
const CountryController = require("../controllers/admin/country.controller.js");

// Countrys
routerCountry.post("/", auth, checkPermission('Country', 'Create'), CountryController.create);
routerCountry.get("/", auth, checkPermission('Country', 'Read'), CountryController.findAll);
routerCountry.get("/create", auth, checkPermission('Country', 'Add'), CountryController.add);
routerCountry.get("/:id", auth, checkPermission('Country', 'Read'), CountryController.findOne);
routerCountry.get("/edit/:id", auth, checkPermission('Country', 'Edit'), CountryController.edit);
routerCountry.post("/update/:id", auth, checkPermission('Country', 'Update'), CountryController.update);
routerCountry.get("/delete/:id", auth, checkPermission('Country', 'Delete'), CountryController.delete);
routerCountry.post("/deleteAll", auth, checkPermission('Country', 'Delete'), CountryController.deleteAll);

export default routerCountry;