const Review = require('./../models/reviewModel');
const factory = require('./handlerFactory');
const AppError = require('./../utils/appError');

exports.getAllReviews = factory.getAll(Review)/*async (req, res, next) => {
  try {

    let filter = {};
    //getting all reviews for a particular tourId//nested get endpoint 
    if(req.params.tourId) filter = {tour: req.params.tourId};
    
    const allReviews = await Review.find(filter);

    res.status(200).json({
      status: 'sucess',
      results: allReviews.length,
      data: {
        review: allReviews
      }
    });
  } catch (error) {
    res.status(404).json({
      status: 'fail',
      message: `${error} No reviews found for this tour!`,
    });
  }
};*/

//MW to support the factory createOne func
exports.setTourUserIds = (req, res, next) => {
    // Nested routes
    if (!req.body.tour) req.body.tour = req.params.tourId;
//if we not use the nested route->wantto use the currentUser and don't allow to cretae a review with an arbritary user.id      
    req.body.user = req.user.id; 
    next();   
}

exports.getReview = factory.getOne(Review);
exports.postReview = factory.createOne(Review);

//logged in user can only delete or update their own reviews
// const review = await Review.findOneAndUpdate(
//   {
//       _id: req.params.reviewId,
//       user: req.user.id.toString(),
//   },
exports.matchId = async (req, res, next) => {
  const review = await Review.findById(req.params.id);
  if (review.user._id.toString() !== req.user._id.toString()) {
    return next(new AppError('You may only delete or update your own review', 400));
  }
  //console.log(req.user._id.toString(), req.user._id, req.user.id);
  next();
};

exports.deleteReviews = factory.deleteOne(Review);
exports.updateReviews = factory.updateOne(Review);