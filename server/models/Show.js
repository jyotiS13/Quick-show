import mongoose from "mongoose";

const showSchema=new mongoose.Schema(
    {
        movie:{type:String,required:true,ref:"Movie"},
        showDateTime:{type:Date,required:true},
        showPrice:{type:Number,required:true},
        occupiedseats:{type:Object,default:{}}
    },{minimize:false}

)

const showModel=mongoose.model("Show",showSchema);

export default showModel;