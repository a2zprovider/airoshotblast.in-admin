import express from "express";
const routerEnquiry = express.Router();
import checkPermission from "../middleware/checkPermission.js";
const { auth } = require('../middleware/auth.js');
const EnquiryController = require("../controllers/admin/enquiry.controller.js");

// Enquirys
routerEnquiry.get("/", auth, checkPermission('Enquiry', 'Read'), EnquiryController.findAll);
routerEnquiry.get("/delete/:id", auth, checkPermission('Enquiry', 'Delete'), EnquiryController.delete);
routerEnquiry.post("/deleteAll", auth, checkPermission('Enquiry', 'Delete'), EnquiryController.deleteAll);

export default routerEnquiry;