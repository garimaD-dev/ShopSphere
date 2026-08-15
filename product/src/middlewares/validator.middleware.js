const { body, validationResult } = require('express-validator');

const respondWithValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Missing required fields',
      errors: errors.array(),
    });
  }

  next();
};

const createProductValidations = [
  body('title')
    .trim()
    .isString()
    .withMessage('Title must be a string')
    .bail()
    .notEmpty()
    .withMessage('Title is required')
    .bail(),
  body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string')
    .bail(),
  body('priceAmount')
    .exists()
    .withMessage('Price amount is required')
    .bail()
    .isNumeric()
    .withMessage('Price amount must be numeric')
    .bail(),
  body('priceCurrency')
    .optional()
    .isIn(['USD', 'INR'])
    .withMessage('Price currency must be either USD or INR')
    .bail(),
  respondWithValidationErrors,
];

module.exports = {
  createProductValidations,
};
