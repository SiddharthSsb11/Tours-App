const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review can not be empty!']
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour.']
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user']
    }
  },
  {//calculated values not included in d/b
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    //to keep id field in res hidden(other than mongoose generated _id having same value)
    id: false
  }
);

//one user one review per tour
reviewSchema.index({tour:1, user: 1}, {unique: true});

///query middleware

reviewSchema.pre(/^find/, function (next){
  this/*.populate({
    path: 'tour',
    select: '-guides name'
//Find() of tourSchema is called when the review populates the tour from query MW of reviewSchema->
//query MW of the tourSchema is processed->review result includes the guides array    
  })*/.populate({
    path: 'user',
    select: 'name photo'
  })
//avoiding populate of the tour data bcoz we are virtually populating the reviews under tours->hence to avoid same tour name/details displayed again under reviews while getting the tours
  next();
});

reviewSchema.statics.calcAvgRatings = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        numOfRatings: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);
  

  //after deleting all reviews or zero review error channeling down
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].numOfRatings,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
  console.log(stats);//[{id:, numofRating:, avgRatings:}]
};

reviewSchema.post('save', function(){
  //static method called on model
  //this->curretn document//curr review
  //not interested in the return value of calcAvgRatings,just care that it does something,so no await/async
  this.constructor.calcAvgRatings(this.tour);
  //console.log(this.constructor)//Review;
});

// findByIdAndUpdate
// findByIdAndDelete
//Doc which is updated is passed into the cb func as d 1st arg for post querry MW
reviewSchema.post(/^findOneAnd/, async function(reviewUpdated){
  if(reviewUpdated) await reviewUpdated.constructor.calcAvgRatings(reviewUpdated.tour)
});

/*reviewSchema.pre(/^findOneAnd/, async function(next) {
  //this->current query obj//storing  awaited query result--current doc on cur querry to pass it on in next post query MW
  this.curReviewDoc = await this.findOne();
  // console.log( this.curReviewDoc );
  next();
});

reviewSchema.post(/^findOneAnd/, async function() {
  // await this.findOne(); does NOT work here, query has already executed
  await this.curReviewDoc.constructor.calcAvgRatings(this.curReviewDoc.tour);
});*/

//all three post,pre,post MW in one
/*
reviewSchema.post(/save|^findOne/, async (doc, next) => {
    await doc.constructor.calcAverageRating(doc.tour);
    next();
});
*/ 

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;