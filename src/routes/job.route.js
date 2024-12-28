import express from "express";
const routerJob = express.Router();
import checkPermission from "../middleware/checkPermission.js";
const { auth } = require('../middleware/auth.js');
const JobController = require("../controllers/admin/job.controller.js");

// Jobs
routerJob.post("/", auth, checkPermission('Job', 'Create'), JobController.create);
routerJob.get("/", auth, checkPermission('Job', 'Read'), JobController.findAll);
routerJob.get("/create", auth, checkPermission('Job', 'Add'), JobController.add);
routerJob.get("/:id", auth, checkPermission('Job', 'Read'), JobController.findOne);
routerJob.get("/edit/:id", auth, checkPermission('Job', 'Edit'), JobController.edit);
routerJob.post("/update/:id", auth, checkPermission('Job', 'Update'), JobController.update);
routerJob.get("/delete/:id", auth, checkPermission('Job', 'Delete'), JobController.delete);
routerJob.post("/deleteAll", auth, checkPermission('Job', 'Delete'), JobController.deleteAll);
routerJob.get("/status/:id", auth, checkPermission('Job', 'Status'), JobController.status);

export default routerJob;