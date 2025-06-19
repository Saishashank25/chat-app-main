import { createContext, useContext, useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";
import toast from "react-hot-toast";

export const ChatContext = createContext();

export const ChatProvider = ({children}) => {
    const [messages, setMessages] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null)
    const [unseenMessages, setUnseenMessages] = useState({})

    // Pull in authUser (needed for markAsSeen payload)
    const {socket, axios, authUser} = useContext(AuthContext);

    // 1. Get users for sidebar (no change)
    const getUsers = async () => {
        try {
            const {data} = await axios.get("/api/messages/users");
            if(data.success){
                setUsers(data.users)
                setUnseenMessages(data.unseenMessages)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    // 2. Get messages for the current selected user (private chat)
    // (Later, add support for groupId if group chat is selected)
    const getMessages = async (userId) => {
        try {
            const {data} = await axios.get(`/api/messages/${userId}`);
            if(data.success){
                setMessages(data.messages)
            }
            // Mark as seen when opening chat (private)
            await axios.put(`/api/messages/mark-seen/${userId}`);
            // Real-time socket notify
            if (socket && authUser) {
                socket.emit("markAsSeen", {
                    senderId: userId,
                    receiverId: authUser._id,
                });
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    // 3. Send a message to the selected user (private chat)
    // (Later, adapt for group chat by including groupId)
    const sendMessage = async (messageData) => {
        try {
            const {data} = await axios.post(`/api/messages/send/${selectedUser._id}`, messageData);
            if(data.success){
                setMessages((prevMessages)=>[...prevMessages,data.newMessage])
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    // 4. Real-time message and seen-status sync (private, later extend for group)
    const subscribeToMessages = async () => {
    if (!socket) return;

    socket.on("newMessage", (newMessage) => {
        // Show new message if current chat is with this user (either sender or receiver)
        if (
            selectedUser &&
            (newMessage.senderId === selectedUser._id || newMessage.receiverId === selectedUser._id)
        ) {
            setMessages(prevMessages => [...prevMessages, newMessage]);
            // Only mark as seen if YOU are the receiver
            if (newMessage.senderId === selectedUser._id) {
                axios.put(`/api/messages/mark/${newMessage._id}`);
            }
        } else {
            // If not in current chat, bump unseen count
            setUnseenMessages(prevUnseenMessages => ({
                ...prevUnseenMessages,
                [newMessage.senderId]: prevUnseenMessages[newMessage.senderId]
                    ? prevUnseenMessages[newMessage.senderId] + 1
                    : 1
            }));
        }
    });

    // On real-time update for seen/read receipts
    socket.on("messagesSeen", ({ by }) => {
        setMessages(prev =>
            prev.map(msg =>
                msg.receiverId === by ? { ...msg, seen: true } : msg
            )
        );
    });
};


    // 5. Unsubscribe from sockets on cleanup
    const unsubscribeFromMessages = () => {
        if(socket) {
            socket.off("newMessage");
            socket.off("messagesSeen");
        }
    }

    useEffect(()=>{
        subscribeToMessages();
        return ()=> unsubscribeFromMessages();
    },[socket,selectedUser])

    // 6. Value for context
    const value = {
        messages, users, selectedUser, getUsers, setMessages, getMessages, sendMessage, setSelectedUser, unseenMessages, setUnseenMessages
    }

    return (
        <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
    )
}
