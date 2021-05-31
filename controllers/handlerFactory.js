const AppError = require('./../utils/appError');
const APIFeatures = require('./../utils/apiFeatures');

exports.deleteOne = (Model) => {//without braces--no return works-- as only one thing for outer func to run
  return async (req, res, next) => {
    try {
      const doc = await Model.findByIdAndDelete(req.params.id);
      //console.log('deleted successfully');
      if (!doc) {
        return next(
          new AppError(`NO document were found with that id ${req.params.id}`, 404)
        );
      }
      res.status(204).json({
        status: 'success',
        data: null,
      });
    } catch (error) {
      res.status(404).json({
        status: 'fail',
        message: ` ${error} ${console.error(error)} !!!!`,
      });
    }
  };
};

exports.updateOne = (Model) => async (req, res, next) => {
  try {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!doc) {
      return next(
        new AppError(`NO document were found with that id ${req.params.id}`, 404)
      );
      //throw next (new AppError) works too//using next and pssing it to error handling middleware preffered
    }
    //console.log('updated');
    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  } catch (error) {
    res.status(404).json({
      status: 'fail',
      message: ` ${error} --- ${console.error(error)} --- Inavalid data update requested !!!!`,
    });
  }
};

exports.createOne = (Model) => {
  return async (req, res, next) => {
    try {
      const doc = await Model.create(req.body);
      res.status(201).json({
        status: 'success',
        data: {
          data: doc
        }
      });
    } catch (error) {
      res.status(400).json({
        status: 'fail',
        message: `${error} --- ${console.error(error)} --- Invalid data send!!!!`,
      });
    } 
  };
};

exports.getOne = (Model, populateOptionsObj) => {
  return async (req, res, next) => {
    try {
      let query = Model.findById(req.params.id);
      if(populateOptionsObj) query = query.populate(populateOptionsObj);
      //console.log(populateOptionsObj)
      //virtual populating reviews for the tour pulled--without child referencing for review
      
      const doc = await query;
      
      if(!doc){
        return next(new AppError(`NO document were found with that id ${req.params.id}`, 404));
      }
      res.status(200).json({
        status: 'success',
        data: {
          data: doc
        },
      });
    } catch (error) {
      res.status(404).json({
        status: 'fail',
        message: `${error}  ---- ${console.error(error)} ---- In valid ID !!!!`,
      });
    }
  };
}

exports.getAll = (Model, populateOptionsObj) => {
  return async (req, res, next) => {
    try {
      //fgc//nesting get end point
      let filterObj = {};
      //getting all reviews for a particular tourId//nested get endpoint 
      if(req.params.tourId) filterObj = {tour: req.params.tourId};

      const features = new APIFeatures(Model.find(filterObj), req.query).filter().sort().limitingFields().paginate();
      //console.log(features);
      
      let query = features.query;
      if(populateOptionsObj) query = query.populate(populateOptionsObj);

      //EXECUTE query
      const doc = await query;

      res.status(200).json({
        status: 'sucess',
        results: doc.length,
        data: {
          data: doc,
        },
      });

    } catch (error) {
      res.status(404).json({
        status: 'fail',
        message: `${error} ---- ${console.error(error)} ----!!!!`
      })
      
    }
  }
}