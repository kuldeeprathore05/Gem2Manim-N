import mongoose from "mongoose";

const videoSchema = new mongoose.Schema({
    userId :{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    prompt:{
        type:String
    },
    videoUrl:{
        type:String
    },
    status:{
        type:String,
        enum:["processing","success","failed"],
        default:"processing"
    }
},{timestamps:true})

// export default mongoose.model('Video',videoSchema)
export default mongoose.models.Video || mongoose.model('Video', videoSchema);
