import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./config/db.js";
import { clerkMiddleware } from '@clerk/express'
import { serve } from "inngest/express";
import { inngest, functions } from "./inngest/index.js"


const app=express();
const port=8000;

await connectDB()

app.use(express.json())
app.use(cors())
app.use(clerkMiddleware())

app.get("/",(req,res)=>{
    res.status(201).json("Server is running up!!!")

})
// Set up the "/api/inngest" (recommended) routes with the serve handler
app.use("/api/inngest", serve({ client: inngest, functions }));


app.listen(8000,()=>{
    console.log(`Server listening at http://localhost:${port}`)
})

