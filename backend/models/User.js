/*contains the code for defining the schema of how the user's data will be stored in the mongodb server
1)for now the schema will not contain the posts, will include it later to in the normalized manner. where i make a 
seperate schema defining folder for the posts and we will later link it to the user
*/
const mongoose=require('mongoose');
//each user will have name, username, numOfPosts(later), an intro 
const userSchema=new mongoose.Schema({
    name:{
        type: String,
        required:true
    },
    username:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    department:{
        type:String
    },
    year:{
        type: Number
    },
    intro:{
        type: String
    },
    //we are storing the entire set of usewrs in a graph. for each user, there is a set of friends. Friends list is an array list
    //if a and b are friends, a will have b stored as a friend. b will have a stored as a friend
    friends:[{
        userId:{
            type: mongoose.Schema.Types.ObjectId,
            ref:"User"
        },
        weight:{
            type:Number,
            default: 1
        }

    }
    ]
});
module.exports=mongoose.model("User",userSchema);//isko export karna padega baaki models mein use karne ke liye