const crypto = require('crypto'); //inbuuilt node module
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name!'],
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  photo:{
    type: String,
    default: 'default.jpg'
  },
  role:{
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user'
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 8,
    select: false //to hide it on get req or on login post req 
  },
  passwordConfirm: {
      type: String,
      required: [true, 'Please confirm your password'],
      validate: {//this validator will only run with save or create. not with /^find/ methods
          validator: function(val){
              return val === this.password;
          },
          message: 'Passwords doesnt match'
      }
  },
  passwordChangedAt: Date,
  passwordResetToken: {
    type: String,
    select: false
  },
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true, // by default new user is active
    select: false
  }
});

//document middleware //pre-save-hook  
/* userSchema.pre('save', async function(next){
    if(!this.isModified('password')) return(next);
    this.password = await bcrypt.hash(this.password, 12);

//after cofirmation we no longer need this field//althought required as an i/p but not necessarily to be persisted in db
    this.passwordConfirm = undefined;
    next();
});

//pre-save hook to update the psswordChangeAt timestamp on password change/reset/modified and updated via save()in db or to look on signup
userSchema.pre('save', function(next) {
  if (!this.isModified('password') || this.isNew) {
    return next();
  }
  this.passwordChangedAt = Date.now() - 1000; //fgc hackk 
  next();
});
 */


//pre-find querry middleware
userSchema.pre(/^find/, function(next){
  //this points to current querry
  this.find({active: {$ne: false}})
  next()
})


//instance method, can be accesed by the document of doc created by user model
//candidatePassword is here this.password as this points to the curretnly processed document
userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
}


//instance method to check whether the password was changed/updated after the token was generated 
//The changedPasswordAfter method is not async like the correctPassword method bcz of the bcrypt.
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  //console.log ( this.passwordChangedAt, JWTTimeStamp ) 

  // False means NOT changed
  return false;
};

userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  //storing this in db for further comparison during resetPssword
 // console.log(resetToken, this.passwordResetToken);

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;