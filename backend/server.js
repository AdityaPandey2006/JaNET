const mongoose=require('mongoose');
const express=require('express');
const cors=require('cors');
const dotenv = require("dotenv");
dotenv.config();


const app=express();

app.use(cors());

app.use(express.json());
//mongoose.connect promise return karta hai. 
//toh ek async function bana diye aur jab tak connection na ho jaaye tab tak wait kar liye
async function mongooseConnection() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(" MongoDB connection established");
  } catch (err) { // added (err) here
    console.error(" MongoDB connection failed:");
    console.error(err); 
  }
}

/*  
async function mongooseConnection(){
    try{
        await mongoose.connect(process.env.MONGO_URI,{
          useNewUrlParser: true,
          useUnifiedTopology: true,
        });
        console.log("connection established");
    }
    catch(err){
        console.log("failed"+err.message);
    }
}
*/

mongooseConnection();

app.get('/',(req,res)=>{
    res.send('Server running');
});// is line ka matlab hota hai ki jab tum http://localhost:5000/  pe jaoge tab tumko Server running likha hua dikhega
//yeh sabko basically routes bolte hain. http://localhost:5000/ basically building hai aur http://localhost:5000/abcd ek route hain
//yeh abcd wala route us building ka ek office hai jahaan ek particular functionality implement hota hai. 
//similarly aise aur offices hain jahaan aur functionaity implement hoga


//server start kar rahe hain yahaan
const PORT=process.env.PORT||5000;//process.env se PORT mile toh woh use karo warna 500 hi use kar lo
app.listen(PORT,()=>{
    console.log("server started at http://localhost:"+PORT);
});


//for routes/users => add new user, load all users, load a user with a particular id
const userRoutes=require('./routes/users');
app.use('/api/users',userRoutes);
const friendRoutes=require('./routes/friends');
app.use('/api/friends',friendRoutes);
const postRoutes = require('./routes/posts');
app.use('/api/posts',postRoutes);
const chatRoutes = require("./routes/chats");
app.use("/api/chats", chatRoutes);
