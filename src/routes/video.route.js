import express from "express";
const routerVideo = express.Router();
import checkPermission from "../middleware/checkPermission.js";
const { auth } = require('../middleware/auth.js');
const VideoController = require("../controllers/admin/video.controller.js");

// Videos
routerVideo.post("/", auth, checkPermission('Video', 'Create'), VideoController.create);
routerVideo.get("/", auth, checkPermission('Video', 'Read'), VideoController.findAll);
routerVideo.get("/create", auth, checkPermission('Video', 'Add'), VideoController.add);
routerVideo.get("/:id", auth, checkPermission('Video', 'Read'), VideoController.findOne);
routerVideo.get("/edit/:id", auth, checkPermission('Video', 'Edit'), VideoController.edit);
routerVideo.post("/update/:id", auth, checkPermission('Video', 'Update'), VideoController.update);
routerVideo.get("/delete/:id", auth, checkPermission('Video', 'Delete'), VideoController.delete);
routerVideo.post("/deleteAll", auth, checkPermission('Video', 'Delete'), VideoController.deleteAll);
routerVideo.get("/status/:id", auth, checkPermission('Video', 'Status'), VideoController.status);

export default routerVideo;