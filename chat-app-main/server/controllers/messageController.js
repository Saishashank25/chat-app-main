import Message from "../models/Message.js";
import User from "../models/User.js"; 
import cloudinary from "../lib/cloudinary.js";
import { io,userSocketMap } from "../server.js";
import multer from "multer";
import path from "path"

//Get all users except the logged in user
export const getUsersForSidebar = async (req,res)=>{
    try{
        const userId = req.user._id;
        const filteredUsers = await User.find({_id:{$ne: userId}}).select("-password");

        //Count no. of messages not seen
        const unseenMessages ={}
        const promises = filteredUsers.map(async (user)=>{
            const messages = await Message.find({senderId:user._id , receiverId:userId,seen:false})
            if(messages.length > 0){
                unseenMessages[user._id] = messages.length;
            }
        })
        await Promise.all(promises);
        res.json({success:true,users:filteredUsers,unseenMessages})
    }
    catch(error){
        console.log(error.message);
        res.json({success:false,message:error.message})
    }
}

//Get all messages for selected user
export const getMessages = async(req,res)=>{
    try{
        const {id:selectedUserId} = req.params;
        const myId = req.user._id;
    
        const messages = await Message.find({
            $or:[
                {senderId:myId,receiverId:selectedUserId},
                {senderId:selectedUserId,receiverId:myId},
            ]
        })
        await Message.updateMany({senderId:selectedUserId,receiverId:myId},{seen:true});
        res.json({success:true,messages})
    }
    catch(error){
        console.log(error.message);
        res.json({success:false,message:error.message})
    }
}

//api to mark message as seen using message id
export const markMessageAsSeen = async(req,res)=>{
    try {
        const {id} = req.params;
        await Message.findByIdAndUpdate(id,{seen:true})
        res.json({success:true})
    } catch (error) {
        console.log(error.message);
        res.json({success:false,message:error.message})
    }
}

//send message to selected user
export const sendMessage = async(req,res)=>{
    try {
        const {text,image} =req.body;
        const receiverId = req.params.id;
        const senderId = req.user._id;

        let imageUrl;
        if(image){
            const uploadResponse = await cloudinary.uploader.upload(image)
            imageUrl =uploadResponse.secure_url;
        }

        const newMessage = await Message.create({
            senderId,
            receiverId,
            text,
            image:imageUrl
        })
        //emit the new message to the receiver's socket
        const receiverSocketId  = userSocketMap[receiverId];
        if(receiverSocketId){
            io.to(receiverSocketId).emit("newMessage",newMessage);
        }

        res.json({success:true,newMessage});
    } catch (error) {
        console.log(error.message);
        res.json({success:false,message:error.message})
    }
}

//doc upload
export const sendDocMessage = async (req, res) => {
  try {
    const { receiverId } = req.body;
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    // Cloudinary: get URL from req.file.path
    const fileUrl = req.file.path;  // This is a Cloudinary URL!
    const originalName = req.file.originalname;

    // Save message in DB
    const newMessage = await Message.create({
      senderId: req.user._id,
      receiverId,
      doc: fileUrl,
      docName: originalName,
      type: "doc"
    });

    res.json({ success: true, message: newMessage });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// Unsend/Delete message for everyone
export const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const message = await Message.findById(id);
    if (!message) return res.status(404).json({ success: false, message: "Message not found" });

    // Optionally, allow only sender to delete:
    if (message.senderId.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: "Not authorized" });

    message.deleted = true;
    message.text = "";   // Remove content (optional)
    message.image = "";
    message.doc = "";
    message.docName = "";
    await message.save();

    res.json({ success: true, message: "Message deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Mark messages as seen
export const markMessagesAsSeen = async (req, res) => {
  try {
    const senderId = req.params.userId; 
    const receiverId = req.user._id; 
    await Message.updateMany(
      { senderId, receiverId, seen: false },
      { $set: { seen: true } }
    );
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

//video upload
export const sendVideoMessage = async (req, res) => {
  try {
    const { receiverId } = req.body;
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No video uploaded" });
    }

    const videoUrl = req.file.path; // Cloudinary URL
    const originalName = req.file.originalname;

    // Save message in DB
    const newMessage = await Message.create({
      senderId: req.user._id,
      receiverId,
      video: videoUrl,
      videoName: originalName,
      type: "video"
    });

    res.json({ success: true, message: newMessage });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
