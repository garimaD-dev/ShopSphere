const {body, validationResult}=require('express-validator');

const respondWithValidationErrors=(req,res,next)=>{
    const errors=validationResult(req);

    if(!errors.isEmpty()){
        return res.status(400).json({
            message:"Missing required fields",
            errors:errors.array(),
        });
    }
    next();
}

const registerUserValidations=[
    body("username")
        .isString()
        .withMessage("Username must be a string")
        .bail()
        .isLength({min:3})
        .withMessage("Username must be of atleast 3 characters")
        .bail(),
    body("email")
        .isEmail()
        .withMessage("Invalid email format")
        .bail(),
    body("password")
        .isString()
        .withMessage("Password must be a string")
        .bail()
        .isLength({min:6})
        .withMessage("Password must be of atleast 6 characters")
        .bail(),
    body("fullName.firstName")
        .isString()
        .withMessage("First name must be a string")
        .bail()
        .notEmpty()
        .withMessage("First name is required")
        .bail(),
    body("fullName.lastName")
        .isString()
        .withMessage("Last name must be a string")
        .bail()
        .notEmpty()
        .withMessage("Last name is required")
        .bail(),
    body("role")
        .optional()
        .isIn(['buyer','seller'])
        .withMessage("Role must be either a 'buyer' or a 'seller' ")
        .bail(),
    respondWithValidationErrors
]

const loginUserValidations=[
    body("email")
        .optional()
        .isEmail()
        .withMessage("Invalid email format")
        .bail(),
    body("username")
        .optional()
        .isString()
        .withMessage("Username must be a string")
        .bail()
        .isLength({min:3})
        .withMessage("Username must be of atleast 3 characters")
        .bail(),
    body("password")
        .isString()
        .withMessage("Password must be a string")
        .bail()
        .isLength({min:6})
        .withMessage("Password must be of atleast 6 characters")
        .bail()
        .notEmpty()
        .withMessage("Password is required")
        .bail(),
    (req,res,next)=>{
        if(!req.body.email && !req.body.username){
            return res.status(400).json({ errors:[{message:"Either email or username is required"}] });
        }
        respondWithValidationErrors(req,res,next);
    },
    
]

const addUserAddressValidations=[
    body("street")
        .isString()
        .withMessage("Street must be a string")
        .bail()
        .notEmpty()
        .withMessage("Street is required")
        .bail(),
    body("city")
        .isString()
        .withMessage("City must be a string")
        .bail()
        .notEmpty()
        .withMessage("City is required")
        .bail(),
    body("state")
        .isString()
        .withMessage("State must be a string")
        .bail()
        .notEmpty()
        .withMessage("State is required")
        .bail(),
    body("pincode")
        .isString()
        .withMessage("Pincode must be a string")
        .bail()
        .notEmpty()
        .withMessage("Pincode is required")
        .bail(),
    body("country")
        .isString()
        .withMessage("Country must be a string")
        .bail()
        .notEmpty()
        .withMessage("Country is required")
        .bail(),
    body("isDefault")
        .optional()
        .isBoolean()
        .withMessage("isDeafault must be boolean")
        .bail(),
    respondWithValidationErrors
]

module.exports={
    registerUserValidations,
    loginUserValidations,
    addUserAddressValidations
}