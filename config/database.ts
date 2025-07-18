import mongoose from "mongoose";
let isConnected = false;
const connectDb = async ()=>{
    if(isConnected) return;
    try{
        if (mongoose.connection.readyState >= 1) {
            console.log("MongoDB already connected.");
            isConnected = true;
            return;
        }

        const URI = process.env.MONGODB_URI!
        await mongoose.connect(URI)
        console.log("MongoDb connection successfull");
    } catch(e){
        console.log("MongoDb connection error",e);
        process.exit(1);
    }
}

export default connectDb
