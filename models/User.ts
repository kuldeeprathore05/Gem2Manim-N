import mongoose from 'mongoose'
import { unique } from 'next/dist/build/utils'

const userSchema = new mongoose.Schema({
    email:{
        type:String,
        required:true,
        unique:true
    },
    firstName :{
        type:String,
        default:"Buudy"
    },
    fullName:{
        type:String,
        default:'Buddy'
    }
},{timestamps:true})

// export default mongoose.model('User',userSchema)
export default mongoose.models.User || mongoose.model('User', userSchema);
