import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import { Server } from "socket.io";

//create express app and http server
const app = express();
const server = http.createServer(app)

//initialize socket.io server
export const io = new Server(server,{
    cors:{origin:"*"}
})

//Store online users
export const userSocketMap ={}; //{userId:socketId}

//Socket.io connection handler
io.on("connection",(socket)=>{
    const userId = socket.handshake.query.userId;
    console.log("User Connected",userId);
    if(userId){
        userSocketMap[userId] =socket.id;
    }
    //Emit online users to all connected clients
    io.emit("getOnlineUsers",Object.keys(userSocketMap));

    socket.on("markAsSeen", ({ senderId, receiverId }) => {
    const senderSocketId = userSocketMap[senderId];
    if (senderSocketId) {
      io.to(senderSocketId).emit("messagesSeen", { by: receiverId });
    }
    });

    socket.on("disconnect",()=>{
        console.log("User Disconnected",userId);
        delete userSocketMap[userId];
        io.emit("getOnlineUsers",Object.keys(userSocketMap));
    })
})

//Middleware setup
app.use(express.json({limit:"4mb"}));
app.use(cors());


//Routes Setup
app.use("/api/status",(req,res)=>res.send("Server is live"));
app.use("/api/auth",userRouter);
app.use("/api/messages",messageRouter);
app.use("/uploads", express.static("uploads")); // This line serves your uploaded files


//connect to MongoDb
await connectDB();

if(process.env.NODE_ENV !== "production"){
const PORT = process.env.PORT || 5000;
server.listen(PORT,()=>console.log("Server is running on PORT: " + PORT));
}

//export server for vercel
export default server;