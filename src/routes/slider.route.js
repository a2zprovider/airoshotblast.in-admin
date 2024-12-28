import express from "express";
const routerSlider = express.Router();
import checkPermission from "../middleware/checkPermission.js";
const { auth } = require('../middleware/auth.js');
const SliderController = require("../controllers/admin/slider.controller.js");

// Sliders
routerSlider.post("/", auth, checkPermission('Slider', 'Create'), SliderController.create);
routerSlider.get("/", auth, checkPermission('Slider', 'Read'), SliderController.findAll);
routerSlider.get("/create", auth, checkPermission('Slider', 'Add'), SliderController.add);
routerSlider.get("/:id", auth, checkPermission('Slider', 'Read'), SliderController.findOne);
routerSlider.get("/edit/:id", auth, checkPermission('Slider', 'Edit'), SliderController.edit);
routerSlider.post("/update/:id", auth, checkPermission('Slider', 'Update'), SliderController.update);
routerSlider.get("/delete/:id", auth, checkPermission('Slider', 'Delete'), SliderController.delete);
routerSlider.post("/deleteAll", auth, checkPermission('Slider', 'Delete'), SliderController.deleteAll);
routerSlider.get("/status/:id", auth, checkPermission('Slider', 'Status'), SliderController.status);

export default routerSlider;