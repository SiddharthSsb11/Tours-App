const express = require ('express');
const viewsController = require('../controllers/viewsController');
const authController = require('../controllers/authController');
const bookingController = require('../controllers/bookingController');

//const {isLoggedIn, protect} = require('../controllers/AuthController');
//router.get('/me', protect, viewsController.getAccount);

const router = express.Router();

//router.use(authController.isLoggedIn);

router.get('/',authController.isLoggedIn, viewsController.getOverview);
router.get('/tour/:slug',authController.isLoggedIn,  authController.protect , viewsController.getTour);
router.get('/login',authController.isLoggedIn, viewsController.getLoginForm);
router.get('/signup', viewsController.getSignupForm);
router.get('/me',authController.protect, viewsController.getMyAccount);
router.get('/my-tours', bookingController.createBookingCheckout, authController.protect, viewsController.getMyTours);

module.exports = router;