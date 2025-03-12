const express=require('express')
const mongoose=require('mongoose')

const app=express()
const cors = require('cors');
app.use(cors());
mongoose.connect('mongodb://localhost:27017/mydtb')
app.use(express.json());


app.listen(3001,()=>{
    console.log("Server is running at port 3001")
})


const mapRouters=require("./routes/Map")
app.use("/Map", mapRouters);

const usersRouters=require("./routes/Users")
app.use("/Users",usersRouters)