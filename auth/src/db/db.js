const mongoose=require('mongoose');

async function connectToDB(){
    try{
        mongoose.connect(process.env.MONGODB_URL)
        console.log("Database connection successful");
    }
    catch(err){
        console.log("Database connection failed", err);
    }
}

module.exports=connectToDB;