const mongoose = require('mongoose');
const productModel=require('../models/product.model');
const imagekitService=require('../service/imagekit.service');
const userModel = require('../../../../shopsphere/auth/src/models/user.model');

async function createProduct(req,res){
    try{
        const {title,description,priceAmount, priceCurrency}=req.body;

        if(!title || !priceAmount){
            return res.status(400).json({
             message:"title and priceAmount are required"
            })
        }

        const seller=req.user.id; //Extract seller from authenticated user

        const price={
            amount:Number(priceAmount),
            currency:priceCurrency
        }

        const images=await Promise.all((req.files || []).map(file=> imagekitService.uploadImage({buffer: file.buffer})));

        const product= await productModel.create({
            title,
            description,
            price,
            seller,
            images
        })
        return res.status(201).json({
            message:"Product Created",
            data: product,
        })
    }
    catch(err){
        console.error("Create product error",err);
        return res.status(500).json({
            message:"Internal server error"
        });
    }

}

async function getProducts(req,res) {
    const {q,minprice, maxprice, skip =0, limit=20} = req.query;

    const filter ={};

    if(q){
        filter.$text={$search : q};
    }

    if(minprice){
        filter['price.amount']={ ...filter['price.amount'], $gte: Number(minprice)};
    }

    if(maxprice){
        filter['price.amount']={ ...filter['price.amount'], $lte: Number(maxprice)};
    }

    const products=await productModel.find(filter).skip(Number(skip)).limit(Math.min(Number(limit), 20));

    return res.status(200).json({
        data:products
    })
}

async function getProductsById(req,res){
    const {id}=req.params;

    if(!mongoose.Types.ObjectId.isValid(id)){
        return res.status(400).json({
            message:"Invalid product id"
        })
    }

    try{
        const product=await productModel.findById(id);

        if(!product){
            return res.status(404).json({
                message:"Product not found"
            })
        }

        return res.status(200).json({
            data:product
        })
    }
    catch(err) {
        return res.status(500).json({
            message:"Internal server error"
        })
    }
}

async function updateProduct(req,res){
    const { id } = req.params;

    if(!mongoose.Types.ObjectId.isValid(id)){
        return res.status(400).json({
            message:"Invalid product id"
        });
    }

    if(!req.user){
        return res.status(401).json({
            message:"Unauthorized: No token provided"
        })
    }

    const userId=req.user?.id || req.user?._id;

    const product = await productModel.findOne({
        _id: id,
        seller: new mongoose.Types.ObjectId(userId),
    });

    if(!product){
        return res.status(404).json({
            message:"Product not found"
        });
    }

    const allowedUpdates=["title","description","price"];

    for(const key of Object.keys(req.body)){
        if(allowedUpdates.includes(key)){
            if(key==="price" && typeof req.body.price==='object'){
                if(req.body.price.amount !==undefined){
                    product.price.amount=Number(req.body.price.amount);
                }
                if(req.body.price.currency !==undefined){
                    product.price.currency=req.body.price.currency;
                }
            }
            else{
                product[key]=req.body[key];
            }
        }
    }

    await product.save();
    return res.status(200).json({
        message:"Product updated successfully",
        data:product
    });
}

async function deleteProduct(req,res){
    const {id}=req.params;

    if(!mongoose.Types.ObjectId.isValid(id)){
        return res.status(400).json({
            message:"Invalid product id"
        })
    }

    const product=await productModel.findOne({
        _id:id
    })

    if(!product){
        return res.status(404).json({
            message:"Product not found"
        })
    }

    if(product.seller.toString()!==req.user.id){
        return res.status(403).json({
            message:"Forbidden: You can only delete your own products only"
        })
    }

    await product.deleteOne();
    return res.status(200).json({
        message:"Product deleted"
    })
}

async function getProductBySeller(req,res){
    const seller=req.user;
    const{ skip=0 ,limit=20}=req.query;

    const products= await productModel.find({
        seller: seller.id
    }).skip(skip).limit(Math.min(limit,20));

    return res.status(200).json({
        data:products
    })
}

module.exports = {
  createProduct,
  getProducts,
  getProductsById,
  updateProduct,
  deleteProduct,
  getProductBySeller
};