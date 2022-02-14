const mongoose = require("mongoose");
const schema=mongoose.Schema;

const shopSchema = new schema({
    shopName:{
        type:String,
        required:true
        
    },
    carrier:{
        type:Array,  
    },
    FullfillTags:{
        type:Array
    },
    ParticalTags:{
        type:Array
    }

},{timestamps:true})

const Shop = mongoose.model('Shop',shopSchema)
module.exports =Shop;