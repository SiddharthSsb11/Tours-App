const Tour = require('../models/tourModel');
const AppError = require('../utils/appError');
const Booking = require('../models/bookingModel');

exports.getOverview = async (req, res, next) => {
  try {
    //Get tour data from collection
    const tours = await Tour.find();

    // Build template in pug
    // Render template using tour data
    res.status(200).render('overview', {
      title: 'All Tours',
      tours
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: `${error} ${console.log(error)} Please try again`,
    });
  }
};

exports.getTour = async (req, res, next) => {
  try {
    const tour = await Tour.findOne({ slug: req.params.slug }).populate({
      path: 'reviews',
      fields: 'review rating user', //select: ---
    });

    //isBooked to see if the user is already booked for the tour
    const isBooked = await Booking.find({ user: req.user._id, tour: tour._id });
    const tourDate = isBooked.date;

    //for not having bug's in the production env use this in viewController - getTour:
    /*   if (req.user) {
      const isBooked = await Booking.find({ user: req.user.id, tour: tour.id });
      const tourDate = isBooked.date;
    } else {
      isBooked = 0;
      tourDate = Date.now();
    } */

    if (!tour) {
      return next(new AppError('There is no tour with that name.', 404));
    }

    // Build template
    // Render template
    res.status(200).render('tour', {
      //tour.pug
      status: 'success',
      title: `${tour.name} Tour`,
      isBooked,
      tourDate,
      tour,
      user: req.user
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: `${error} ${console.log(error)} Please try again`,
    });
  }
};

exports.getLoginForm = (req, res) => {
  res.status(200).render('login', {
    title: 'Log into your account'
  });
};

exports.getSignupForm = (req, res) => {
  res.status(200).render('signup', {
      status: 'success',
      title: 'Signup'
  });
};

exports.getMyAccount = (req, res) => {
  res.status(200).render('account', {
    title: 'My Account'
    //user: req.user//same as using res.locals.user = currentUser//accesing user in pug//frontend
  });
};

exports.getMyTours = async(req, res, next) => {
  try{
    // Find all bookings for current login user
    const bookings = await Booking.find({ user: req.user.id });
    console.log(bookings);//[]

    // finnd tours with the returned IDs
    //const tourIDs = bookings.map(el => el.tour);
    const tourIDs = bookings.map(el => el.tour._id)
    //console.log(tourIDs);
    const tours = await Tour.find({ _id: { $in: tourIDs } });
    //console.log(tours);
    
    res.status(200).render('overview', {
      title: 'My Tours',
      tours
    });

  }catch(err){
    console.error(err, err.message);
  }
};