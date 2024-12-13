import express from "express";
const routerApi = express.Router();

// Api Routes
const ProductApiController = require("../controllers/api/product.controller");
const BlogApiController = require("../controllers/api/blog.controller");
const PageApiController = require("../controllers/api/page.controller");
const CategoryApiController = require("../controllers/api/category.controller");
const BlogCategoryApiController = require("../controllers/api/blogcategory.controller");
const EnquiryApiController = require("../controllers/api/enquiry.controller");
const FaqApiController = require("../controllers/api/faq.controller");
const SettingApiController = require("../controllers/api/setting.controller");
const SliderApiController = require("../controllers/api/slider.controller");
const TagApiController = require("../controllers/api/tag.controller");
const ApplicationApiController = require("../controllers/api/application.controller");
const CareerApiController = require("../controllers/api/career.controller");
const VideoApiController = require("../controllers/api/video.controller");

// Product
routerApi.get("/products", ProductApiController.findAll);
routerApi.get("/product/:slug", ProductApiController.findOne);

// Blog
routerApi.get("/blogs", BlogApiController.findAll);
routerApi.get("/blog/:slug", BlogApiController.findOne);

// Page
routerApi.get("/pages", PageApiController.findAll);
routerApi.get("/page/:slug", PageApiController.findOne);

// Category
routerApi.get("/category", CategoryApiController.findAll);
routerApi.get("/category/:slug", CategoryApiController.findOne);

// BlogCategory
routerApi.get("/blogcategory", BlogCategoryApiController.findAll);
routerApi.get("/blogcategory/:slug", BlogCategoryApiController.findOne);

// Enquiry
routerApi.post("/enquiry", EnquiryApiController.create);

// Faq
routerApi.get("/faqs", FaqApiController.findAll);

// Setting
routerApi.get("/setting", SettingApiController.findOne);

// Slider
routerApi.get("/sliders", SliderApiController.findAll);

// Tag
routerApi.get("/tags", TagApiController.findAll);
routerApi.get("/tag/:slug", TagApiController.findOne);

// Application
routerApi.get("/applications", ApplicationApiController.findAll);
routerApi.get("/application/:slug", ApplicationApiController.findOne);

// Career
routerApi.get("/careers", CareerApiController.findAll);
routerApi.get("/career/:slug", CareerApiController.findOne);
routerApi.post("/job", CareerApiController.job);

// Video
routerApi.get("/video", VideoApiController.findAll);

export default routerApi;