const mongoose = require('mongoose');
//const validator = require('validator');
const slugify = require('slugify');
//const User = require('./userModel');

const tourSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A tour must have a name'],
    unique: true,
    trim: true,
    maxlength: [40, 'A tour must have less or equal than 40 char'],
    minlength: [10, 'A tour must have less or equal than 10 char'],
    //validate: [validator.isAlpha, 'Your name must only contain Alphabet characters']
  },
  slug: String,
  duration: {
    type: Number,
    required: [true, 'A tour must have a duration'],
  },
  maxGroupSize: {
    type: Number,
    required: [true, 'A tour must have a groupsize'],
  },
  difficulty: {
    type: String,
    required: [true, 'A tour must have a difficulty'],
    enum: {
      //to include an error message, other than above array and value, can always use below way of object
      values: ['easy', 'medium', 'difficult'],
      message: 'Difficulty must be between: easy, medium, difficult',
    },
  },
  ratingsAverage: {
    type: Number,
    default: 4.5,
    min: [1, 'Rating mustbe above 1.0'],
    max: [5, 'Rating must be below 5.0'],
    set: val => Math.round(val * 10)/ 10 //setter function //curr value
  },
  ratingsQuantity: {
    type: Number,
    default: 0
  },
  price: {
    type: Number,
    required: [true, 'A tour must have a price'],
  },
  priceDiscount: Number,

  summary: {
    type: String,
    trim: true,
    required: [true, 'A tour must have a description'],
  },
  description: {
    type: String,
    trim: true,
  },
  imageCover: {
    type: String,
    required: [true, 'A tour must have a cover image'],
  },
  images: [String],
  createdAt: {
    type: Date,
    default: Date.now(),
    select: false,
  },
  startDates: [Date],
  secretTour: {
    type: Boolean,
    default: false,
  },
  startLocation: {
    // GeoJSON -- longtitude, latitude
    type: {
      type: String,
      default: 'Point',
      enum: ['Point'],
    },
    coordinates:[Number], /*{
      type: [Number],
      default: [0, 0]//coordinates array cant be empty
    },*/
    address: String,
    description: String,
  },
  locations: [
    {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
      day: Number
    },
  ],
  guides: [
      {
        type: mongoose.Schema.ObjectId,
//The name of the ref has to match the name of the model you're connecting it to.
//Mongoose then knows to query that model when you populate it.        
        ref: 'User' 
      }
  ]
},
{
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
}
);

//indexes ///tours?price[lt]=600&ratingsAverage[gte]=4.5
tourSchema.index({price: 1, ratingsAverage: -1});
tourSchema.index({ slug: 1 });
//geospatial
tourSchema.index({startLocation: '2dsphere'});

// Virtual populate//to avoid child referencing
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id'
});

// DOCUMENT MIDDLEWARE: runs before .save() and .create()

// tourSchema.pre('save', function(next){
//   console.log('1st pre save hook')
//   next();
// });

tourSchema.pre('save', function(next) {
  this.slug = slugify(this.name, { lower: true });
  //console.log(this.slug);
  next();
}); 



// QUERY MIDDLEWARE
/*tourSchema.post(/^findOneAnd/, async (doc) => {
    if (doc) {
        const slugCheck = slugify(doc.name, { lower: true });
        if (doc.slug !== slugCheck) {
            await doc.save();
        }
    }
});*/
//// tourSchema.pre('find', function(next)
tourSchema.pre(/^find/, function (next) {
    this.find({ secretTour: { $ne: true } });

    this.start = Date.now();
    next();
});

///populating tour guide references
tourSchema.pre(/^find/, function (next) {
  this.populate({//not awaiting here our query returning by populate, because not executing it
    path: 'guides',//should be exact same name as the field in schema which have the ref sub property in it
    select: '-__v -passwordChangedAt'
  });
  next();
}); 

tourSchema.post(/^find/, function (docs, next) {
    console.log(`Query took ${Date.now() - this.start} milliseconds!`);
    next();
});

// AGGREGATION MIDDLEWARE
//conflicts with geospatial pipeline, first satge needs to be of geospatial pipeline not this pre aggregate pipelane's match stage
/*tourSchema.pre('aggregate', function (next) {
    this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });

    console.log(this.pipeline());
    next();
});*/

const Tour = mongoose.model('Tour', tourSchema);
module.exports = Tour;