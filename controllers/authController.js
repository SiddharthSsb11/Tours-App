const crypto = require('crypto'); //inbuuilt node module
const {promisify} = require('util');
const jwt = require('jsonwebtoken'); 
const User = require('./../models/userModel');
const AppError = require('./../utils/appError');
//const bcrypt = require('bcryptjs');
//const sendEmail = require('./../utils/email');
const Email = require('./../utils/email');

const signToken = function(id){
    return jwt.sign({id: id}/*{id}*/, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN 
    } )
}

const createAndSendToken = (user, statusCode, req, res) => {
    const token = signToken(user._id);

    const cookieOptions = {
        expires: new Date(
          Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
        ),
        httpOnly: true,
        secure: req.secure || req.headers['x-forwarded-proto'] === 'https'
        
    };
    //comment this out if error regarding login in production mode..i.e working on localhost no on https//secure =false
    //if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
    // Creating and attaching cookie to response body
    res.cookie('jwt', token, cookieOptions);
     
    // Remove password from output
    user.password = undefined;

    res.status(statusCode).json({
        status: 'success',
        token,
        data:{
            user  // user: user
        }
    });    
}

exports.signup = async (req, res, next) => {
    try {

        const newUser = await User.create({/*req.body to keep things working at end replace with btm one*/ 
            name: req.body.name,
            email: req.body.email,
            password: req.body.password,
            passwordConfirm: req.body.passwordConfirm,
            passwordChangedAt: req.body.passwordChangedAt,
            role: req.body.role
        });

        createAndSendToken(newUser, 201, req, res);

        const url = `${req.protocol}://${req.get('host')}/me`;
        
        await new Email(newUser, url).sendWelcome();

        //const token = signToken(newUser._id);
        /*const token = jwt.sign({id: newUser._id}, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN
        } )*/
        /* res.status(201).json({
            status: 'success',
            data: {
                newUser
            }
        }); */
    }catch(err) {
        /* res.status(404).json({
            status: 'fail',
            message: `${err} ?? YYY XXX YYY ??`
        }); */
        console.error(err, err.message)
    }
}; 

exports.login = async (req,res,next) => {
    try {
      //email and password exists or not
      const { email, password } = req.body;
     
      if (!email || !password) {
        return next(new AppError('Email or Password is missing', 400));
      }

      //if user exists and then password is right or not
      const user = await User.findOne({email}).select('+password');//filter ob ({email: email})

      //user is also a document// result of querying the user model thats why hv acess to instance method
      //const correct = await user.correctPassword(password, user.password);
    
      if (!user || !(await user.correctPassword(password, user.password))){
          return next(new AppError('Incorrect email or password', 401));
      };

      //sending the token via cookie after performing checks
      createAndSendToken(user, 200, req, res);
      
      /* const token = signToken(user._id);
      res.status(200).json({
          status: 'success',
          token
      }); */

    } catch(err) {
        res.status(400).json({
            status:'fail',
            message:`${err} Password or email entered is/are incorrect`
        });
    }  
};

exports.logout = (req, res) => {
    const cookieOptions = {
        expires: new Date(Date.now() + 7 * 1000),
        httpOnly: true,
    };
    res.cookie('jwt', 'loggedout', cookieOptions);
    res.status(200).json({ status: 'success' });
    //replace all by pascal sol'
    //res.cookie('jwt', 'null', {    expires: new Date(Date.now() -10 * 1000),    httpOnly: true});
    //fgc //res.clearCookie('jwt') //location.reload();
}

exports.protect = async(req, res, next) => {
    try {
      let token;

      //Getting token--sending with req.headers or cookie with the https req, and checking if is there or not//
      if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
      }else if (req.cookies.jwt && req.cookies.jwt !== 'loggedout') {
        token = req.cookies.jwt;
      }  
    //    else if (req.cookies.jwt) {
    //     token = req.cookies.jwt;
    //   }
    //   if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    //     token = req.headers.authorization.split(' ')[1];
    //     //console.log(token, req.headers.authorization, req.headers);

      if (!token) {
        return next( new AppError(`You are not logged in, please log in to get access to this`,401) );
      }

      //validation of token--manipulation/invalid--expired or not
      // Upon successful verification, the JWT Verify filter removes the headers and signature of the incoming signed JWT and outputs the original JWT payload
      const decodedPayload = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
      //const decoded = await Jwt.verify(token, process.env.JWT_SECRET_KEY)
      //console.log(decodedPayload);//o/p--id, iat, exp

      //if user still exists
      const currentUser = await User.findById(decodedPayload.id);
      if (!currentUser) { 
          return next(new AppError('The user belonging to this token does no longer exist.', 401) );
      }

      // if user changed password after the token was issued
      if (currentUser.changedPasswordAfter(decodedPayload.iat)) {
        return next( new AppError('User recently changed password! Please log in again.', 401) );
      }
    
      // GRANT ACCESS TO PROTECTED ROUTE
      req.user = currentUser;//logged in user string it on req object to have acess in next middleware in stack
    
      // THERE IS A LOGGED IN USER//passing it to tempelates
      res.locals.user = currentUser;

      next();

    } catch (error) {
        res.status(400).json({
            status:'fail',
            message:`${error} Session expired/ Incorrect password/ Password updated recenntly `
        });
    }
}

// Only for rendered pages, no errors!
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      //verify token
      const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET);

      //if user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }

      //if user changed password after the token was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      // THERE IS A LOGGED IN USER//passing it to tempelates
      res.locals.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};


exports.restrict = function(...roles){////////////////////////////////roles = [admin, lead-guide]
    return (req, res, next) => {
        if(!roles.includes(req.user.role)){
            return next( new AppError('Not authorized',403));
        }
        next();
    }
}

exports.forgotPassword = async (req, res, next) => {
    try {
        //1) get user based on POSTed email
        const user = await User.findOne({ email: req.body.email });
        if (!user) {
          return next(new AppError('There is no user with email address.', 404));
        }
      
        // 2) Generating the random reset token
        const resetToken = user.createPasswordResetToken();
        await user.save({ validateBeforeSave: false });
        //saving the user with the info of passwordTokenExpires,don't want to go through the validations we set up in our model.
        

        //3) sending the uncrypted resetToken to the users email 

        const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
        await new Email(user, resetURL).sendPasswordReset();
        //const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
        //const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}&${user.email}`;
        
        //const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;
        
        /* await sendEmail({
            email: user.email,
            subject: 'Your password reset token (valid for 10 min)',
            message
        }); */
      
        res.status(200).json({
            status: 'success',
            message: 'Token sent to email!'
        });
       
        next();
    } catch (error) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });
    
        return next(new AppError('There was an error sending the email. Try again later!', 500));
              
    }
};

exports.resetPassword = async (req, res, next) => {
    try{
        //1)gettin user by matching token send in the url on email with the crypted one stored in our d/b passwordResetToken 
       const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
       const user = await User.findOne({passwordResetToken: hashedToken, /*email: req.params.email,*/ passwordResetExpires : { $gt: Date.now()}});
       
       if(!user){
           return next(new AppError('The token is invalid or expired', 400));
       }

       //2)setting new password
       user.password = req.body.password; 
       user.passwordConfirm = req.body.passwordConfirm;
       user.passwordResetToken = undefined;
       user.passwordResetExpires = undefined;
       await user.save();//this time we want our validators to work while saving/updating the modification in our db

       //3) Update changedPasswordAt property for the user -pre save hook document middleware
       //4) sending the jwt and login the user
       createAndSendToken(user, 200, req, res);
       /*const token = signToken(user._id);
       res.status(200).json({
         status: 'success',
         token
       });*/

    }catch(err){
        res.status(400).json({
            status:'fail',
            message:`${err} Please send forgot password request again`
        });
    }
}

exports.updatePassword = async (req, res, next) => {
    try{
        //get the current logged in user
        const userLoggedIn = await User.findById(req.user.id).select('+password');
       // console.log(req.user, );
        //console.log(userLoggedIn)

       //checking current pPOSTed password pmatches the original password
       if(!(await userLoggedIn.correctPassword(req.body.currentPassword, userLoggedIn.password))){
           return next(new AppError('Your current password is wrong,', 401));
       }

       //update new password and run validotors if current matches original
       userLoggedIn.password = req.body.password;
       userLoggedIn.passwordConfirm = req.body.passwordConfirm;
       await userLoggedIn.save();

       //Log user in, send JWT
       createAndSendToken(userLoggedIn, 200, req, res);

    }catch(error){
        res.status(400).json({
            status:'fail',
            message:`${error} Please login and try again .`
        });
    }

}