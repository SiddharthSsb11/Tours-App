const User = require('./../models/userModel');
const multer = require('multer');
const sharp = require('sharp');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');
const fs = require('fs');

//writing the photo file in our disk//not preffered
/* const multerStorage = multer.diskStorage({
   destination: (req, file, cb) => {
     cb(null, 'public/img/users');
   },
   filename: (req, file, cb) => {
     const ext = file.mimetype.split('/')[1];//'image/jpg'
     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
   }//user-userid-timestamp-extension
}); */

//storing in memory as a buffer//after reading later written on server disk
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

//MW//next() is inbuilt in multer MW
exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = async (req, res, next) => {
  try{

    if(!req.file) return next();
    //console.log(req.file);

    req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

    await sharp(req.file.buffer)
      .resize(500, 500)
      .toFormat('jpeg')
      .jpeg({ quality: 90 })
      .toFile(`public/img/users/${req.file.filename}`);

    next();

  }catch(error){
    console.error(error);
  }
};

const filterObject = function(obj, ...allowedFields){
  let newObj = {};
  Object.keys(obj).forEach( key =>{
    if(allowedFields.includes(key)){
      newObj[key] = obj[key]
    }
  });
  
  
  /* return Object.keys(obj)
    .filter((el) => allowedFields.includes(el))
    .reduce((acc, el) => {
      acc[el] = obj[el];
      return acc;
    }, {});
 */
  //console.log(newObj);
  return newObj;
}

//to delete the older picture before uplaoding/updating a new one
const deletePhotoFromServer = async (photo) => {
    if (photo.startsWith('default')) return; // not to remove the default faceless older pic
    
    const path = `${__dirname}/../public/img/users/${photo}`;
    //removing/deleting
    await fs.unlink(path, err => {
        if (err) return console.log(err);
        //console.log('Previous photo has been deleted');
    });
};

exports.getAllUsers = factory.getAll(User);
/*async(req, res, next) => {
  try{
    const allUsers = await User.find();

    res.status(200).json({
      status: 'sucess',
      results: allUsers.length,
      data: {
       users: allUsers
      },
    });

  }catch (error) {
    res.status(404).json({
      status: 'fail',
      message: `XVXVXVX ${error} XVXVXVX!!!!`
    })
  }
};*/

exports.updateMyData = async(req, res, next) =>{
  try {
    
    //1)error if posted data updation for password details
    if(req.body.password || req.body.passwordConfirm){
      return next(new AppError('PLease use other available means to update/reset your password', 400));
    }

    // { name: req.body.name, email: req.body.email }
    const filteredBody = filterObject(req.body, 'name', 'email');
    //if uploading pic, adding photo to the filterbody to update it along the name and email too
    if(req.file) filteredBody.photo = req.file.filename;

    // If uploading new photo, delete the old one from the server.
    if (req.file) await deletePhotoFromServer(req.user.photo);
    
    //updating the current user with data
    const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      status: 'success',
      data: {
        user: updatedUser
      }
    });
    
  } catch (error) {
    res.status(404).json({
      status: 'fail',
      message: `${error} Please login again and try again :( `
    }) 
  }
};

//current user deleting himself
exports.deleteMe = async(req, res, next)=>{
  try{
    await User.findByIdAndUpdate(req.user.id, { active: false });

    res.status(204).json({
      status: 'success',
      data: null
    });

  }catch(err) {
    res.status(404).json({
      status: 'fail',
      message: `${err} Please login again and try again :( `
    });
  }
}

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
}

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not usable or accesable',
  });
};
//admin updating user
//dont update password with this //bcoz of save() and update() pre-hooks&validators conflict
exports.updateUser = factory.updateOne(User);
exports.getUser = factory.getOne(User);
//admin deleting user
exports.deleteUser = factory.deleteOne(User);