import express from "express";
import checkPermission from "../middleware/checkPermission.js";
import routerPage from "./page.route.js";
import routerProduct from "./product.route.js";
import routerBlog from "./blog.route.js";
import routerTag from "./tag.route.js";
import routerSlider from "./slider.route.js";
import routerFaq from "./faq.route.js";
import routerCategory from "./category.route.js";
import routerBlogcategory from "./blogcategory.route.js";
import routerApplication from "./application.route.js";
import routerCareer from "./career.route.js";
import routerJob from "./job.route.js";
import routerVideo from "./video.route.js";
import routerCountry from "./country.route.js";
import routerCity from "./city.route.js";
import routerState from "./state.route.js";
import routerRole from "./role.route.js";
import routerPermission from "./permission.route.js";
import routerEnquiry from "./enquiry.route.js";
import routerUser from "./user.route.js";
import routerApi from "./api.route.js";
const router = express.Router();

const { auth, guest } = require('../middleware/auth');

// Admin Routes
const UserController = require('../controllers/admin/user.controller.js');
const SettingController = require("../controllers/admin/setting.controller");

router.get("/login", guest, UserController.login);
router.get("/register", guest, UserController.register);
router.post("/login", guest, UserController.user_login);

router.get("/logout", auth, UserController.logout);

router.get("/admin", auth, UserController.dashboard);
router.get("/profile", auth, UserController.user);
router.post("/user/update-password", auth, UserController.passwordUpdate);


// Enquiry
router.use('/enquiry', routerEnquiry);

// Product
router.use('/product', routerProduct);

// Blog
router.use('/blog', routerBlog);

// Page
router.use('/page', routerPage);

// Tag
router.use('/tag', routerTag);

// Slider
router.use('/slider', routerSlider);

// Settings
router.get("/setting", auth, checkPermission('Setting', 'Read'), SettingController.edit);
router.post("/setting/update/:id", auth, checkPermission('Setting', 'Update'), SettingController.update);

// Faqs
router.use('/faq', routerFaq);

// Category
router.use('/category', routerCategory);

// Blog Category
router.use('/blogcategory', routerBlogcategory);

// Application
router.use('/application', routerApplication);

// Country
router.use('/country', routerCountry);

// State
router.use('/state', routerState);

// City
router.use('/city', routerCity);

// User
router.use('/user', routerUser);

// Role
router.use('/role', routerRole);

// Permission
router.use('/permission', routerPermission);

// Career
router.use('/career', routerCareer);

// Video
router.use('/video', routerVideo);

// Job
router.use('/job', routerJob);

// All Api
router.use('/api', routerApi);

export default router;