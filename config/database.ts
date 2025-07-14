import mongoose from "mongoose";

const connectDb = async ()=>{
    try{
        const URI = process.env.MONGODB_URI!
        await mongoose.connect(URI)
        console.log("MongoDb connection successfull");
    } catch(e){
        console.log("MongoDb connection error",e);
        process.exit(1);
    }
}

export default connectDb
