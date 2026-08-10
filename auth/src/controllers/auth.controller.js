const userModel=require('../models/user.model');
const bcrypt=require('bcryptjs')
const jwt=require('jsonwebtoken')
const redis=require('../db/redis');

async function registerUser(req,res){
    try{
        const {username, email, password, fullName:{firstName, lastName}, role}=req.body;

        const isUserAlreadyExists=await userModel.findOne({
            $or:[
                {username},
                {email}
            ]
         })

        if(isUserAlreadyExists){
            return res.status(409).json({
                message:"Username or Email already exists"
            })
        }

        const hash=await bcrypt.hash(password,10);

        const user =await userModel.create({
            username,
            email,
            password:hash,
            fullName:{firstName, lastName},
            role: role || 'buyer' //default role is buyer
        })

        const token =jwt.sign({
            id:user._id,
            username:user.username,
            email:user.email,
            role:user.role
        },process.env.JWT_SECRET,{expiresIn:'1d'});

        res.cookie("tokenOfUser", token,{
            httpOnly:true,
            secure:true,
            sameSite:"strict",
            maxAge:24*60*60*1000 //which is 1 day
        })

        res.status(201).json({
            message:"User registered successfully wowww!!!",
            user:{
                id:user._id,
                username:user.username,
                email:user.email,
                fullName:user.fullName,
                role:user.role,
                addresses:user.addresses
            }
        })
    }
    catch(err){
        console.error("error in register user", err);
        res.status(500).json({message:"internal server error"});
    }
}

async function loginUser(req,res){
    try{
        const { username, email, password } = req.body;
        const user = await userModel.findOne({ $or:[{username},{email}] }).select('+password');

        if(!user){
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const passwordMatches = await bcrypt.compare(password, user.password);
        if(!passwordMatches){
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const token = jwt.sign({
            id:user._id,
            username:user.username,
            email:user.email,
            role:user.role
        }, process.env.JWT_SECRET, { expiresIn:'1d' });

        res.cookie("tokenOfUser", token, {
            httpOnly:true,
            secure:true,
            sameSite:"strict",
            maxAge:24*60*60*1000
        });

        res.status(200).json({
            message:'Login successful',
            user:{
                id:user._id,
                username:user.username,
                email:user.email,
                fullName:user.fullName,
                role:user.role,
                addresses:user.addresses
            }
        });
    }
    catch(err){
        console.error("error in login user", err);
        res.status(500).json({message:"internal server error"});
    }
}

async function getCurrentUser(req,res) {
    return res.status(200).json({
        message:"Current user fetched successfully",
        user:req.user
    })
}

async function logoutUser(req,res) {
    const token=req.cookies.tokenOfUser;

    if(token){
        await redis.set(`blacklist:${token}`,'true','EX', 20*60*60);
    }

    res.clearCookie('token',{
        httpOnly:true,
        secure:true,
        sameSite:"strict"
    })

    return res.status(200).json({
        message:"User logged out successfully"
    })
}

async function getUserAddresses(req,res) {
    const id=req.user.id

    const user=await userModel.findById(id).select('addresses');

    if(!user){
        return res.status(401).json({
            message:"User not found"
        })
    }

    res.status(200).json({
        message:"User addresses found successfully",
        addresses: user.addresses
    })
}

async function addUserAddresses(req,res){
    const id=req.user.id;

    const {street,city,state,pincode,country,isDefault}=req.body;

    if(!street || !city || !state || !pincode || !country) {
        return res.status(400).json({
            message: "All address fields are required"
        });
    }

    const user=await userModel.findOneAndUpdate({_id: id},{
        $push:{
            addresses:{
                street,
                city,
                state,
                pincode,
                country,
                isDefault
            }
        }
    },{new : true});

    if(!user){
        return res.status(401).json({
            message:"User not found"
        })
    }

    return res.status(201).json({
        message:"Address added successfully",
        address: user.addresses[user.addresses.length-1]
    })

}

async function deleteUserAddress(req, res) {
    const id = req.user.id;
    const { addressId } = req.params;

    const user=await userModel.findOneAndUpdate({_id:id},{
        $pull:{
            addresses:{
                _id:addressId
            }
        }
    },{new:true})

    if(!user){
        return res.status(404).json({
            message:"User not found"
        })
    }

    const addressExists=user.addresses.some(addr=>addr._id.toString()===addressId);
    if(addressExists){
        return res.status(500).json({
            message:"Failed to delete address"
        })
    }

    return res.status(200).json({
        message:"Address deleted successfully",
        addresses:user.addresses
    })

}

module.exports={
    registerUser,
    loginUser,
    getCurrentUser,
    logoutUser,
    getUserAddresses,
    addUserAddresses,
    deleteUserAddress
}