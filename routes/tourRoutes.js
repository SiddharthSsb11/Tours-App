const express = require ('express');
const tourController = require('./../controllers/tourController');
const authController = require('./../controllers/authController');
//const reviewController = require('./../controllers/reviewController');
const reviewRouter = require('./../routes/reviewRoutes');

const router = express.Router();

//// GET/POST -- /tour/234fad4/reviews
//mounting
router.use('/:tourId/reviews', reviewRouter);
//router.param('id', tourController.checkID);

router.route('/top-5-cheap').get(tourController.aliasTop ,tourController.getAllTours );
router.route('/tour-stats').get( tourController.getTourStats );
router.route('/monthly-plan/:year').get(tourController.getMonthlyPlan); 

router.route('/tours-within/:distance/center/:latlng/unit/:unit').get(tourController.getToursWithin);
// /tours-within?distance=233&center=-40,45&unit=mi
// /tours-within/233/center/-40,45/unit/mi
router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);

router.route('/').get( tourController.getAllTours )
.post(authController.protect, authController.restrict('admin', 'lead-guide'), tourController.createTour );

router.route('/:id').get( tourController.getTour )
.patch(authController.protect, authController.restrict('admin', 'lead-guide'), tourController.uploadTourImages, tourController.resizingTourImages, tourController.updateTour )
.delete(authController.protect, authController.restrict('admin', 'lead-guide'), tourController.deleteTour);

//app.use('/api/v1/tours', router);
//tours?price[lt]=1000;

module.exports = router;

