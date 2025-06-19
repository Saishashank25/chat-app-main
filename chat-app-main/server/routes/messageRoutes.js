import express from "express"
import { protectRoute } from "../middleware/auth.js";
import { getMessages, getUsersForSidebar, markMessageAsSeen, sendMessage, deleteMessage, markMessagesAsSeen } from "../controllers/messageController.js";
import { sendDocMessage,sendVideoMessage } from "../controllers/messageController.js"; // Create this controller
import Message from "../models/Message.js";
import upload from "../lib/multerCloudinary.js";

const messageRouter = express.Router();

//private chat
messageRouter.get("/users",protectRoute,getUsersForSidebar);
messageRouter.get("/:id",protectRoute,getMessages);
messageRouter.put("/mark/:id",protectRoute,markMessageAsSeen);
messageRouter.post("/send/:id",protectRoute,sendMessage);
messageRouter.post('/send-doc', protectRoute, upload.single('doc'), sendDocMessage);
messageRouter.delete("/:id", protectRoute, deleteMessage);
messageRouter.put("/mark-seen/:userId", protectRoute, markMessagesAsSeen);
messageRouter.post("/send-video",protectRoute,upload.single("video"),sendVideoMessage);

export default messageRouter;