const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const factory = require('./handlerFactory');

exports.getCheckoutSession = async (req, res, next) => {
    try{
        const tour = await Tour.findById(req.params.tourId);
        console.log(tour);

        //Create checkout session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            success_url: `${req.protocol}://${req.get('host')}/my-tours/?tour=${req.params.tourId}&user=${req.user.id}&price=${tour.price}`,
            cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
            customer_email: req.user.email,
            client_reference_id: req.params.tourId,
            line_items: [
                {
                    name: `${tour.name} Tour`,
                    description: tour.summary,
                    images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
                    amount: tour.price * 100,
                    currency: 'inr',
                    quantity: 1
                }
            ]
        });

        //Create session as response
        res.status(200).json({
            status: 'success',
            session
        });
    }catch(error){
        console.log(error);
    }
}

exports.createBookingCheckout = async (req, res, next) => {
    try{
        const { tour, user, price } = req.query;

        if (!tour || !user || !price) return next();
        await Booking.create({ tour, user, price });
      
        res.redirect(req.originalUrl.split('?')[0]);

    }catch(error){
        console.error(error, error.message);
    }
};

exports.checkIfBooked = async (req, res, next) => {
    try{
        // To check if booked was bought by user who wants to review it
        const booking = await Booking.find({ user: req.user.id, tour: req.body.tour });
        if (booking.length === 0) return next(new AppError('You must buy this tour to review it', 401));
        next();
    }catch(err){
        console.error(err, err.message)
    }
}

exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);