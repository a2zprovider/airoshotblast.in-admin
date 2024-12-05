import express from "express";
import checkPermission from "../middleware/checkPermission.js";
const router = express.Router();

const { auth, guest } = require('../middleware/auth');

// Admin Routes
const UserController = require('../controllers/admin/user.controller.js');
const EnquiryController = require("../controllers/admin/enquiry.controller");
const PageController = require("../controllers/admin/page.controller");
const ProductController = require("../controllers/admin/product.controller");
const BlogController = require("../controllers/admin/blog.controller");
const TagController = require("../controllers/admin/tag.controller");
const SliderController = require("../controllers/admin/slider.controller");
const SettingController = require("../controllers/admin/setting.controller");
const FaqController = require("../controllers/admin/faq.controller");
const CategoryController = require("../controllers/admin/category.controller");
const BlogCategoryController = require("../controllers/admin/blogcategory.controller");
const ApplicationController = require("../controllers/admin/application.controller");
const CareerController = require("../controllers/admin/career.controller");
const VideoController = require("../controllers/admin/video.controller");
const CountryController = require("../controllers/admin/country.controller");
const CityController = require("../controllers/admin/city.controller");
const StateController = require("../controllers/admin/state.controller");
const RoleController = require("../controllers/admin/role.controller");
const PermissionController = require("../controllers/admin/permission.controller");

router.get("/login", guest, UserController.login);
router.get("/register", guest, UserController.register);
router.post("/login", guest, UserController.user_login);

router.get("/logout", auth, UserController.logout);

router.get("/admin", auth, UserController.dashboard);
router.get("/profile", auth, UserController.user);
router.post("/user/update-password", auth, UserController.passwordUpdate);

router.get("/enquiry", auth, checkPermission('Enquiry', 'Read'), EnquiryController.findAll);
router.get("/enquiry/delete/:id", auth, checkPermission('Enquiry', 'Delete'), EnquiryController.delete);
router.post("/enquiry/deleteAll", auth, checkPermission('Enquiry', 'Delete'), EnquiryController.deleteAll);

// Product
router.post("/product", auth, checkPermission('Product', 'Create'), ProductController.create);
router.get("/product", auth, checkPermission('Product', 'Read'), ProductController.findAll);
router.get("/product/create", auth, checkPermission('Product', 'Add'), ProductController.add);
router.get("/product/:id", auth, checkPermission('Product', 'Read'), ProductController.findOne);
router.get("/product/edit/:id", auth, checkPermission('Product', 'Edit'), ProductController.edit);
router.post("/product/update/:id", auth, checkPermission('Product', 'Update'), ProductController.update);
router.get("/product/delete/:id", auth, checkPermission('Product', 'Delete'), ProductController.delete);
router.post("/product/deleteAll", auth, checkPermission('Product', 'Delete'), ProductController.deleteAll);
router.get("/product/imgs/:id/:index", auth, checkPermission('Product', 'Update'), ProductController.imgDelete);

// Blog
router.post("/blog", auth, checkPermission('Blog', 'Create'), BlogController.create);
router.get("/blog", auth, checkPermission('Blog', 'Read'), BlogController.findAll);
router.get("/blog/create", auth, checkPermission('Blog', 'Add'), BlogController.add);
router.get("/blog/:id", auth, checkPermission('Blog', 'Read'), BlogController.findOne);
router.get("/blog/edit/:id", auth, checkPermission('Blog', 'Edit'), BlogController.edit);
router.post("/blog/update/:id", auth, checkPermission('Blog', 'Update'), BlogController.update);
router.get("/blog/delete/:id", auth, checkPermission('Blog', 'Delete'), BlogController.delete);
router.post("/blog/deleteAll", auth, checkPermission('Blog', 'Delete'), BlogController.deleteAll);

// Pages
router.post("/page", auth, checkPermission('Page', 'Create'), PageController.create);
router.get("/page", auth, checkPermission('Page', 'Read'), PageController.findAll);
router.get("/page/create", auth, checkPermission('Page', 'Add'), PageController.add);
router.get("/page/:id", auth, checkPermission('Page', 'Read'), PageController.findOne);
router.get("/page/edit/:id", auth, checkPermission('Page', 'Edit'), PageController.edit);
router.post("/page/update/:id", auth, checkPermission('Page', 'Update'), PageController.update);
router.get("/page/delete/:id", auth, checkPermission('Page', 'Delete'), PageController.delete);
router.post("/page/deleteAll", auth, checkPermission('Page', 'Delete'), PageController.deleteAll);

// Tag
router.post("/tag", auth, checkPermission('Tag', 'Create'), TagController.create);
router.get("/tag", auth, checkPermission('Tag', 'Read'), TagController.findAll);
router.get("/tag/create", auth, checkPermission('Tag', 'Add'), TagController.add);
router.get("/tag/:id", auth, checkPermission('Tag', 'Read'), TagController.findOne);
router.get("/tag/edit/:id", auth, checkPermission('Tag', 'Edit'), TagController.edit);
router.post("/tag/update/:id", auth, checkPermission('Tag', 'Update'), TagController.update);
router.get("/tag/delete/:id", auth, checkPermission('Tag', 'Delete'), TagController.delete);
router.post("/tag/deleteAll", auth, checkPermission('Tag', 'Delete'), TagController.deleteAll);

// Slider
router.post("/slider", auth, checkPermission('Slider', 'Create'), SliderController.create);
router.get("/slider", auth, checkPermission('Slider', 'Read'), SliderController.findAll);
router.get("/slider/create", auth, checkPermission('Slider', 'Add'), SliderController.add);
router.get("/slider/:id", auth, checkPermission('Slider', 'Read'), SliderController.findOne);
router.get("/slider/edit/:id", auth, checkPermission('Slider', 'Edit'), SliderController.edit);
router.post("/slider/update/:id", auth, checkPermission('Slider', 'Update'), SliderController.update);
router.get("/slider/delete/:id", auth, checkPermission('Slider', 'Delete'), SliderController.delete);
router.post("/slider/deleteAll", auth, checkPermission('Slider', 'Delete'), SliderController.deleteAll);

// Settings
router.get("/setting", auth, checkPermission('Setting', 'Read'), SettingController.edit);
router.post("/setting/update/:id", auth, checkPermission('Setting', 'Update'), SettingController.update);

// Faqs
router.post("/faq", auth, checkPermission('Faq', 'Create'), FaqController.create);
router.get("/faq", auth, checkPermission('Faq', 'Read'), FaqController.findAll);
router.get("/faq/create", auth, checkPermission('Faq', 'Add'), FaqController.add);
router.get("/faq/:id", auth, checkPermission('Faq', 'Read'), FaqController.findOne);
router.get("/faq/edit/:id", auth, checkPermission('Faq', 'Edit'), FaqController.edit);
router.post("/faq/update/:id", auth, checkPermission('Faq', 'Update'), FaqController.update);
router.get("/faq/delete/:id", auth, checkPermission('Faq', 'Delete'), FaqController.delete);
router.post("/faq/deleteAll", auth, checkPermission('Faq', 'Delete'), FaqController.deleteAll);

// Category
router.post("/category", auth, checkPermission('Category', 'Create'), CategoryController.create);
router.get("/category", auth, checkPermission('Category', 'Read'), CategoryController.findAll);
router.get("/category/create", auth, checkPermission('Category', 'Add'), CategoryController.add);
router.get("/category/:id", auth, checkPermission('Category', 'Read'), CategoryController.findOne);
router.get("/category/edit/:id", auth, checkPermission('Category', 'Edit'), CategoryController.edit);
router.post("/category/update/:id", auth, checkPermission('Category', 'Update'), CategoryController.update);
router.get("/category/delete/:id", auth, checkPermission('Category', 'Delete'), CategoryController.delete);
router.post("/category/deleteAll", auth, checkPermission('Category', 'Delete'), CategoryController.deleteAll);

// Blog Category
router.post("/blogcategory/", auth, checkPermission('Blogcategory', 'Create'), BlogCategoryController.create);
router.get("/blogcategory/", auth, checkPermission('Blogcategory', 'Read'), BlogCategoryController.findAll);
router.get("/blogcategory/create", auth, checkPermission('Blogcategory', 'Add'), BlogCategoryController.add);
router.get("/blogcategory/:id", auth, checkPermission('Blogcategory', 'Read'), BlogCategoryController.findOne);
router.get("/blogcategory/edit/:id", auth, checkPermission('Blogcategory', 'Edit'), BlogCategoryController.edit);
router.post("/blogcategory/update/:id", auth, checkPermission('Blogcategory', 'Update'), BlogCategoryController.update);
router.get("/blogcategory/delete/:id", auth, checkPermission('Blogcategory', 'Delete'), BlogCategoryController.delete);
router.post("/blogcategory/deleteAll", auth, checkPermission('Blogcategory', 'Delete'), BlogCategoryController.deleteAll);

// Application
router.post("/application", auth, checkPermission('Application', 'Create'), ApplicationController.create);
router.get("/application", auth, checkPermission('Application', 'Read'), ApplicationController.findAll);
router.get("/application/create", auth, checkPermission('Application', 'Add'), ApplicationController.add);
router.get("/application/:id", auth, checkPermission('Application', 'Read'), ApplicationController.findOne);
router.get("/application/edit/:id", auth, checkPermission('Application', 'Edit'), ApplicationController.edit);
router.post("/application/update/:id", auth, checkPermission('Application', 'Update'), ApplicationController.update);
router.get("/application/delete/:id", auth, checkPermission('Application', 'Delete'), ApplicationController.delete);
router.post("/application/deleteAll", auth, checkPermission('Application', 'Delete'), ApplicationController.deleteAll);

// Country
router.post("/country", auth, checkPermission('Country', 'Create'), CountryController.create);
router.get("/country", auth, checkPermission('Country', 'Read'), CountryController.findAll);
router.get("/country/create", auth, checkPermission('Country', 'Add'), CountryController.add);
router.get("/country/:id", auth, checkPermission('Country', 'Read'), CountryController.findOne);
router.get("/country/edit/:id", auth, checkPermission('Country', 'Edit'), CountryController.edit);
router.post("/country/update/:id", auth, checkPermission('Country', 'Update'), CountryController.update);
router.get("/country/delete/:id", auth, checkPermission('Country', 'Delete'), CountryController.delete);
router.post("/country/deleteAll", auth, checkPermission('Country', 'Delete'), CountryController.deleteAll);

// State
router.post("/state", auth, checkPermission('State', 'Create'), StateController.create);
router.get("/state", auth, checkPermission('State', 'Read'), StateController.findAll);
router.get("/state/create", auth, checkPermission('State', 'Add'), StateController.add);
router.get("/state/:id", auth, checkPermission('State', 'Read'), StateController.findOne);
router.get("/state/edit/:id", auth, checkPermission('State', 'Edit'), StateController.edit);
router.post("/state/update/:id", auth, checkPermission('State', 'Update'), StateController.update);
router.get("/state/delete/:id", auth, checkPermission('State', 'Delete'), StateController.delete);
router.post("/state/deleteAll", auth, checkPermission('State', 'Delete'), StateController.deleteAll);

// City
router.post("/city", auth, checkPermission('City', 'Create'), CityController.create);
router.get("/city", auth, checkPermission('City', 'Read'), CityController.findAll);
router.get("/city/create", auth, checkPermission('City', 'Add'), CityController.add);
router.get("/city/:id", auth, checkPermission('City', 'Read'), CityController.findOne);
router.get("/city/edit/:id", auth, checkPermission('City', 'Edit'), CityController.edit);
router.post("/city/update/:id", auth, checkPermission('City', 'Update'), CityController.update);
router.get("/city/delete/:id", auth, checkPermission('City', 'Delete'), CityController.delete);
router.post("/city/deleteAll", auth, checkPermission('City', 'Delete'), CityController.deleteAll);

// User
router.post("/user", auth, checkPermission('User', 'Create'), UserController.create);
router.get("/user", auth, checkPermission('User', 'Read'), UserController.findAll);
router.get("/user/create", auth, checkPermission('User', 'Add'), UserController.add);
router.get("/user/:id", auth, checkPermission('User', 'Read'), UserController.findOne);
router.get("/user/edit/:id", auth, checkPermission('User', 'Edit'), UserController.edit);
router.post("/user/update/:id", auth, checkPermission('User', 'Update'), UserController.update);
router.get("/user/delete/:id", auth, checkPermission('User', 'Delete'), UserController.delete);
router.post("/user/deleteAll", auth, checkPermission('User', 'Delete'), UserController.deleteAll);

// Role
router.post("/role", auth, checkPermission('Role', 'Create'), RoleController.create);
router.get("/role", auth, checkPermission('Role', 'Read'), RoleController.findAll);
router.get("/role/create", auth, checkPermission('Role', 'Add'), RoleController.add);
router.get("/role/:id", auth, checkPermission('Role', 'Read'), RoleController.findOne);
router.get("/role/edit/:id", auth, checkPermission('Role', 'Edit'), RoleController.edit);
router.post("/role/update/:id", auth, checkPermission('Role', 'Update'), RoleController.update);
router.get("/role/delete/:id", auth, checkPermission('Role', 'Delete'), RoleController.delete);
router.post("/role/deleteAll", auth, checkPermission('Role', 'Delete'), RoleController.deleteAll);

// Permission
router.post("/permission", auth, checkPermission('Permission', 'Create'), PermissionController.create);
router.get("/permission", auth, checkPermission('Permission', 'Read'), PermissionController.findAll);
router.get("/permission/create", auth, checkPermission('Permission', 'Add'), PermissionController.add);
router.get("/permission/:id", auth, checkPermission('Permission', 'Read'), PermissionController.findOne);
router.get("/permission/edit/:id", auth, checkPermission('Permission', 'Edit'), PermissionController.edit);
router.post("/permission/update/:id", auth, checkPermission('Permission', 'Update'), PermissionController.update);
router.get("/permission/delete/:id", auth, checkPermission('Permission', 'Delete'), PermissionController.delete);
router.post("/permission/deleteAll", auth, checkPermission('Permission', 'Delete'), PermissionController.deleteAll);

// Career
router.post("/career", auth, checkPermission('Career', 'Create'), CareerController.create);
router.get("/career", auth, checkPermission('Career', 'Read'), CareerController.findAll);
router.get("/career/create", auth, checkPermission('Career', 'Add'), CareerController.add);
router.get("/career/:id", auth, checkPermission('Career', 'Read'), CareerController.findOne);
router.get("/career/edit/:id", auth, checkPermission('Career', 'Edit'), CareerController.edit);
router.post("/career/update/:id", auth, checkPermission('Career', 'Update'), CareerController.update);
router.get("/career/delete/:id", auth, checkPermission('Career', 'Delete'), CareerController.delete);
router.post("/career/deleteAll", auth, checkPermission('Career', 'Delete'), CareerController.deleteAll);

// Video
router.post("/video", auth, checkPermission('Video', 'Create'), VideoController.create);
router.get("/video", auth, checkPermission('Video', 'Read'), VideoController.findAll);
router.get("/video/create", auth, checkPermission('Video', 'Add'), VideoController.add);
router.get("/video/:id", auth, checkPermission('Video', 'Read'), VideoController.findOne);
router.get("/video/edit/:id", auth, checkPermission('Video', 'Edit'), VideoController.edit);
router.post("/video/update/:id", auth, checkPermission('Video', 'Update'), VideoController.update);
router.get("/video/delete/:id", auth, checkPermission('Video', 'Delete'), VideoController.delete);
router.post("/video/deleteAll", auth, checkPermission('Video', 'Delete'), VideoController.deleteAll);


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
router.get("/api/products", ProductApiController.findAll);
router.get("/api/product/:slug", ProductApiController.findOne);

// Blog
router.get("/api/blogs", BlogApiController.findAll);
router.get("/api/blog/:slug", BlogApiController.findOne);

// Page
router.get("/api/pages", PageApiController.findAll);
router.get("/api/page/:slug", PageApiController.findOne);

// Category
router.get("/api/category", CategoryApiController.findAll);
router.get("/api/category/:slug", CategoryApiController.findOne);

// BlogCategory
router.get("/api/blogcategory", BlogCategoryApiController.findAll);
router.get("/api/blogcategory/:slug", BlogCategoryApiController.findOne);

// Enquiry
router.post("/api/enquiry", EnquiryApiController.create);

// Faq
router.get("/api/faqs", FaqApiController.findAll);

// Setting
router.get("/api/setting", SettingApiController.findOne);

// Slider
router.get("/api/sliders", SliderApiController.findAll);

// Tag
router.get("/api/tags", TagApiController.findAll);
router.get("/api/tag/:slug", TagApiController.findOne);

// Application
router.get("/api/applications", ApplicationApiController.findAll);
router.get("/api/application/:slug", ApplicationApiController.findOne);

// Career
router.get("/api/careers", CareerApiController.findAll);
router.get("/api/career/:slug", CareerApiController.findOne);

// Video
router.get("/api/video", VideoApiController.findAll);

export default router;