const userModel=require('../models/user.model');
const jwt= require('jsonwebtoken');

async function authMiddleware(req,res,next) {
    const token =req.cookies.tokenOfUser;

    if(!token){
        return res.status(401).json({
            message:"Unauthorised"
        })
    }

    try{
        const decoded=jwt.verify(token,process.env.JWT_SECRET);

        const user= await userModel.findById(decoded.id);

        if(!user){
            return res.status(401).json({
                message:"User not found"
            })
        }

        req.user=user; //attach user info

        next();
    }
    catch(err){
        return res.status(401).json({
            message:"Unauthorised"
        })
    }
}

module.exports={
    authMiddleware
}