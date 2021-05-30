//const fs = require('fs');
const multer = require('multer');
const sharp = require('sharp');
const Tour = require('./../models/tourModel')
//const APIFeatures = require('./../utils/apifeatures');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');


const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if(file.mimetype.startsWith('image')){
    cb(null, true);
  }else{
    cb(new AppError('Not an image! PLease upload only image', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  filter: multerFilter
});

//MW//next() is inbuilt in multer MW// put the fields on req.files
exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 }
]);;

exports.resizingTourImages = async (req, res, next) => {
  try{
    //console.log(req.files);

    if (!req.files.imageCover || !req.files.images) return next();

    //deleting pre-existing images before uploading new ones
    /* const tour = await Tour.findById(req.params.id);
    if (tour.images.length > 0 && fs.existsSync(`public/img/tours/${tour.images[0]}`)) {
        tour.images.forEach((image) => {
            fs.unlinkSync(`public/img/tours/${image}`);
        });
    }
    if (tour.imageCover && fs.existsSync(`public/img/tours/${tour.imageCover}`)) {
        fs.unlinkSync(`public/img/tours/${tour.imageCover}`);
    } */


    //Cover image
    req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
    await sharp(req.files.imageCover[0].buffer)
      .resize(2000, 1333)
      .toFormat('jpeg')
      .jpeg({ quality: 90 })
      .toFile(`public/img/tours/${req.body.imageCover}`);


    //Images
    req.body.images = [];

    await Promise.all(
      req.files.images.map(async (file, i) => {
        const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;

        await sharp(file.buffer)
          .resize(2000, 1333)
          .toFormat('jpeg')
          .jpeg({ quality: 90 })
          .toFile(`public/img/tours/${filename}`);

        req.body.images.push(filename);
      })
    ); 

    next();

  }catch(error){
    console.error(error);
  }
}

exports.aliasTop = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage, price';
  req.query.fields = 'name, price, ratingsAverage, summary';
  next();
}

exports.getAllTours = factory.getAll(Tour, {path: 'reviews'});
exports.getTour = factory.getOne(Tour, {path: 'reviews'});
exports.createTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);

exports.getTourStats = async (req, res) => {
  try {
    //its a mongodb feature which mongoose also allows //aggregate returns a promise
    const stats = await Tour.aggregate([
      {
        $match: { ratingsAverage: { $gte: 4.5 } },
      },
      {
        $group: {
          _id: '$difficulty',
          numTours: { $sum: 1 },
          numRatings: { $sum: '$ratingsQuantity' },
          avgRating: { $avg: '$ratingsAverage' },
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
        },
      },
      {
        $sort: {
          avgPrice: 1,
//1=ascending;can only use the field names mentioned in group stage as previous document data has been updated by fields name uunder group stage
        },
      },
      {
        $match: {
          _id: { $ne: 'easy' }, 
        },
      },
    ]);

    res.status(200).json({
      status: 'sucess',
      data: stats,
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error,
    });
  }
};

exports.getMonthlyPlan = async (req, res) => {
  try {
    const year = req.params.year * 1; // 2021

    const plan = await Tour.aggregate([
      {
        $unwind: '$startDates',
      },
      {
        $match: {
          startDates: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: { $month: '$startDates' },
          numTourStarts: { $sum: 1 },
          tours: { $push: '$name' },
        },
      },
      {
        $addFields: { month: '$_id' },
      },
      {
        $project: {//fields we want to show and keep in our db give them value 1
          _id: 0,
        },
      },
      {
        $sort: { numTourStarts: -1 },
      },
      {
        $limit: 12,
      },
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        plan,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};
 
// /tours-within/:distance/center/:latlng/unit/:unit
// /tours-within/233/center/34.111745,-118.113491/unit/mi
exports.getToursWithin = async (req, res, next) => {
  try {
    const { distance, latlng, unit } = req.params;
    const [lat, lng] = latlng.split(',');

    const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

    if (!lat || !lng) {
      next(new AppError('Please provide latitude and longitude in the format lat,lng.',400));
    };

    const tours = await Tour.find({
      startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
    });

    res.status(200).json({
      status: 'success',
      results: tours.length,
      data: {
        data: tours
      },
    });
  } catch (error) {
    res.status(404).json({
      status: 'fail',
      message: console.log(error),
    });
  }
};

exports.getDistances = async (req, res, next) => {
  try {
    const { latlng, unit } = req.params;
    const [lat, lng] = latlng.split(',');

    const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

    if (!lat || !lng) {
      next(new AppError('Please provide latitutr and longitude in the format lat,lng.',400));
    }

    const distances = await Tour.aggregate([
      {//should be first in the in the tour.aggregate pipeline
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [lng * 1, lat * 1],
          },
          distanceField: 'distance',
          distanceMultiplier: multiplier
        },
      },
      {
        $project: {//fields we want to show and keep in our db give them value 1
          distance: 1,
          name: 1
        },
      },
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        data: distances,
      },
    });
  } catch (error) {
    res.status(404).json({
      status: 'fail',
      message: console.log(error),
    });
  }
};

/*const toursRead = JSON.parse(
  fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
);*/

/*exports.checkID = (req, res, next, val) => {
  console.log(`Tour id is: ${val}`);

  if (req.params.id * 1 > toursRead.length) {
    return res.status(404).json({
      status: 'fail',
      message: 'Invalid ID',
    });
  }
  next();
};*/

/*exports.checkBody = (req, res, next) => {
  if (!req.body.name || !req.body.price) {
    return res.status(400).json({
      status: 'fail',
      message: 'Missing name or price',
    });
  }
  next();
};*/

/*exports.getAllTours = async (req, res, next) => {
  try {
    //BUILD QUERY

    //1)filtering

    //excluding few fields as per thre requirement
    /*let { page, sort, limit, fields, ...queryObj } = req.query;
    //console.log(req.query)
    //console.log(queryObj);

    //1.a)more filtering
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|te|lte|lt)\b/g, (match) => `$${match}`);
    ///\b(gte?|lte?)\b/g
    //The ? sign means that the previous character, in this case the 'e' letter could or not exists.
    //console.log(JSON.parse(queryStr));

    let query = Tour.find(JSON.parse(queryStr));*/
    
    //2) Sorting
    /*if(req.query.sort){
      const sortBy = req.query.sort.split(',').join(' ');
      //console.log(sortBy);
      
      query = query.sort(sortBy); 
    }else{
      query = query.sort('-createdAt')
    }*/

    //3)limiting fields
    /*if(req.query.fields){
      const fields = req.query.fields.split(',').join(' ');
      //console.log(fields);
      
      query = query.select(fields); 
    }else{
      query = query.select('-__v')
    }*/
    
    //4)pagination
    /*page = req.query.page * 1 || 1; //setting default value
    limit = req.query.limit*1 || 100;
    console.log(req.query)
    const skip = (page - 1)*limit;
    query = query.skip(skip).limit(limit);

    if(req.query.page){
      const numTours = await Tour.countDocuments();
      if(skip >= numTours ) throw new Error ('page doesnt exist')
    }*/

    /*const features = new APIFeatures(Tour.find(), req.query).filter().sort().limitingFields().paginate();
    //console.log(features);
    
    //EXECUTE query
    const allTours = await features.query//.populate('reviews')//.populate('guides');

    res.status(200).json({
      status: 'sucess',
      results: allTours.length,
      data: {
       tours: allTours,
      },
    });
  } catch (error) {
    res.status(404).json({
      status: 'fail',
      message: `${error} xxxyyXXYYXXyyxxx!!!!`
    })
  }
};*/

/*exports.getTour = async (req, res, next) => {
  try {
    //console.log(req.params);
    //console.log(req.params.id);
    //const id = +req.params.id;
    //if (req.params.id.length < 24) {
      //return next(new AppError('Not Found', 404));
    //}

    const tour = await Tour.findById(req.params.id /*err => {
      if (err) {
        return next(new AppError('No tour found with that ID', 404));
      }
    }).populate('guides')*//*.populate('reviews');
    //virtual populating reviews for the tour pulled without child referencing for reviews
      
    //Tour.findOne({_id: req.params.id})

    if(!tour){
      return next(new AppError(`NO tours were found with that id ${req.params.id}`, 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        tour
      },
    });
  } catch (error) {
    res.status(404).json({
      status: 'fail',
      message: `${error} ?? INVALID ID ?? !!!!`,
    });
  }
};*/