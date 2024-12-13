import express from "express";
const routerFaq = express.Router();
import checkPermission from "../middleware/checkPermission.js";
const { auth } = require('../middleware/auth.js');
const FaqController = require("../controllers/admin/faq.controller.js");

// Faqs
routerFaq.post("/", auth, checkPermission('Faq', 'Create'), FaqController.create);
routerFaq.get("/", auth, checkPermission('Faq', 'Read'), FaqController.findAll);
routerFaq.get("/create", auth, checkPermission('Faq', 'Add'), FaqController.add);
routerFaq.get("/:id", auth, checkPermission('Faq', 'Read'), FaqController.findOne);
routerFaq.get("/edit/:id", auth, checkPermission('Faq', 'Edit'), FaqController.edit);
routerFaq.post("/update/:id", auth, checkPermission('Faq', 'Update'), FaqController.update);
routerFaq.get("/delete/:id", auth, checkPermission('Faq', 'Delete'), FaqController.delete);
routerFaq.post("/deleteAll", auth, checkPermission('Faq', 'Delete'), FaqController.deleteAll);

export default routerFaq;