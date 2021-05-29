const express = require ('express');
const reviewController = require('./../controllers/reviewController');
const bookingController = require('./../controllers/bookingController');


//const tourController = require('./../controllers/tourController');
const authController = require('./../controllers/authController');

//const router = express.Router();
//to acces the params mentioned in the nested route :tourId ->which we mounted to avoid same post structure
const router = express.Router({ mergeParams: true });

router.use(authController.protect); 

router.route('/')
.get( reviewController.getAllReviews)
.post( authController.restrict('user'), reviewController.setTourUserIds, authController.isLoggedIn, bookingController.checkIfBooked, reviewController.postReview);

router.route('/:id').get(reviewController.getReview)
.patch( authController.restrict('user', 'admin'),/* reviewController.matchId, */ reviewController.updateReviews )
.delete( authController.restrict('user', 'admin'), reviewController.matchId, reviewController.deleteReviews);

module.exports = router;