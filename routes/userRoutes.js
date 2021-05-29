const express = require ('express');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token'/*'/resetPassword/:token&:email'*/ , authController.resetPassword );

//Below routes protected by this MW//using it on the router mini-app
router.use(authController.protect); 

router.patch('/updatePassword', authController.updatePassword);
router.patch('/updateMyData',userController.uploadUserPhoto, userController.resizeUserPhoto, userController.updateMyData);
router.delete('/deleteMe', userController.deleteMe);
router.get('/getMe',userController.getMe, userController.getUser ) ;

//only admin access//common mw for below routes
router.use(authController.restrict('admin'))

router.route('/').get( userController.getAllUsers ).post( userController.createUser); 
router.route('/:id').get( userController.getUser ).patch( userController.updateUser ).delete( userController.deleteUser );

//app.use('/api/v1/users', router);

module.exports = router;