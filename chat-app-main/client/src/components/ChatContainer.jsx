import React, { useContext, useEffect, useRef, useState } from 'react';
import assets from '../assets/assets';
import { formatMessageTime } from '../lib/utils';
import { ChatContext } from '../../context/ChatContext';
import { AuthContext } from '../../context/AuthContext';
import axios from 'axios';

const ChatContainer = () => {
  const {
    messages,
    selectedUser,
    setSelectedUser,
    sendMessage,
    getMessages,
    setMessages,
  } = useContext(ChatContext);

  const { authUser, onlineUsers } = useContext(AuthContext);
  const scrollEnd = useRef();
  const [input, setInput] = useState('');

  // Send text message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (input.trim() === '') return null;
    await sendMessage({ text: input.trim() });
    setInput('');
  };

  // Send image message
  const handleSendimage = async (e) => {
    if (!selectedUser || !selectedUser._id) {
      alert("Please select a user to send the image.");
      return;
    }
    const file = e.target.files[0];
    if (!file || !file.type.startsWith('image/')) {
      alert('Select an image file');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = async () => {
      await sendMessage({ image: reader.result });
      e.target.value = '';
    };
    reader.readAsDataURL(file);
  };

  // Send video message
  const handleVideoUpload = async (e) => {
    if (!selectedUser || !selectedUser._id) {
      alert("Please select a user to send the video.");
      return;
    }
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('video', file);
    formData.append('receiverId', selectedUser._id);

    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.post('/api/messages/send-video', formData, {
        headers: { 'Content-Type': 'multipart/form-data','token':token },
      });
      if (data.success) {
        setMessages((prev) => [...prev, data.message]);
      }
    } catch (error) {
      alert(error.response?.data?.message || error.message);
    }
  };

  // Send document message
  const handleDocUpload = async (e) => {
    if (!selectedUser || !selectedUser._id) {
      alert("Please select a user to send the document.");
      return;
    }
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('doc', file);
    formData.append('receiverId', selectedUser._id);

    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.post('/api/messages/send-doc', formData, {
        headers: { 'Content-Type': 'multipart/form-data', 'token': token },
      });
      if (data.success) {
        setMessages((prev) => [...prev, data.message]);
      }
    } catch (error) {
      alert(error.response?.data?.message || error.message);
    }
  };

  // --------- UNSEND/DELETE feature ---------
  const handleDeleteMessage = async (msgId) => {
    if (!window.confirm("Delete this message for everyone?")) return;
    try {
      await axios.delete(`/api/messages/${msgId}`);
      setMessages((prev) =>
        prev.map((m) =>
          m._id === msgId ? { ...m, deleted: true, text: "" } : m
        )
      );
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };
  // ------------------------------------------

  useEffect(() => {
    if (selectedUser) {
      getMessages(selectedUser._id);
    }
  }, [selectedUser]);

  useEffect(() => {
    if (scrollEnd.current && messages) {
      scrollEnd.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return selectedUser ? (
    <div className="h-full overflow-scroll relative backdrop-blur-lg">
      {/* ------------header--------------*/}
      <div className="flex items-center gap-3 py-3 mx-4 border-b border-stone-500">
        <img
          src={selectedUser.profilePic || assets.avatar_icon}
          alt=""
          className="w-8 rounded-full"
        />
        <p className="flex-1 text-lg text-white flex items-center gap-2">
          {selectedUser.fullName}
          {onlineUsers.includes(selectedUser._id) && (
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
          )}
        </p>
        <img
          onClick={() => setSelectedUser(null)}
          src={assets.arrow_icon}
          alt=""
          className="md:hidden max-w-7"
        />
        <img src={assets.help_icon} alt="" className="max-md:hidden max-w-5" />
      </div>

      {/* ------------chat area--------------*/}
      <div className="flex flex-col h-[calc(100%-120px)] overflow-y-scroll p-3 pb-6">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex items-end gap-2 justify-end ${
              msg.senderId !== authUser._id && 'flex-row-reverse'
            }`}
          >
            {/* ---------- DELETED MESSAGE UI ----------- */}
            {msg.deleted ? (
              <p className="italic text-gray-400 bg-transparent px-3 py-2 rounded">
                Message deleted
              </p>
            ) : msg.video ? (
              <video
                controls
                src={msg.video}
                className="max-w-[230px] border border-gray-700 rounded-lg overflow-hidden mb-8 bg-black"
                style={{ background: "#222" }}
              >
                Your browser does not support the video tag.
              </video>
            ) : msg.image ? (
              <img
                src={msg.image}
                alt=""
                className="max-w-[230px] border border-gray-700 rounded-lg overflow-hidden mb-8"
              />
            ) : msg.doc ? (
              <a
                href={msg.doc ? msg.doc.replace("/upload/", "/upload/fl_attachment/") : "#"}
                download={msg.docName || true}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 max-w-[280px] md:text-sm font-light rounded-lg mb-8 break-all bg-blue-500/30 text-white underline flex items-center gap-1"
              >
                📄 {msg.docName || 'Document'}
              </a>
            ) : (
              <p
                className={`p-2 max-w-[280px] md:text-sm font-light rounded-lg mb-8 break-all bg-violet-500/30 text-white ${
                  msg.senderId === authUser._id
                    ? 'rounded-br-none'
                    : 'rounded-bl-none'
                }`}
              >
                {msg.text}
              </p>
            )}
            
            <div className="text-center text-xs flex flex-col items-center">
              <img
                src={
                  msg.senderId === authUser._id
                    ? authUser?.profilePic || assets.avatar_icon
                    : selectedUser?.profilePic || assets.avatar_icon
                }
                alt=""
                className="w-7 rounded-full"
              />
              <div className="flex items-center gap-1">
                <p className="text-gray-500">{formatMessageTime(msg.createdAt)}</p>
                {/* SEEN/DELIVERED ICONS: */}
                {msg.senderId === authUser._id && !msg.deleted && (
                  msg.seen ? (
                    <span title="Seen" className="text-blue-400 ml-1">✔✔</span>
                  ) : (
                    <span title="Delivered" className="text-blue-400 ml-1">✔</span>
                  )
                )}
              </div>
            </div>

            {/* ---- SHOW DELETE BUTTON ONLY FOR SENDER AND NOT IF ALREADY DELETED ---- */}
            {msg.senderId === authUser._id && !msg.deleted && (
              <button
                onClick={() => handleDeleteMessage(msg._id)}
                className="ml-2 text-red-500 hover:text-red-700"
                title="Delete (Unsend) Message"
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "15px",
                  cursor: "pointer",
                  padding: 0,
                  lineHeight: 1,
                }}
              >
                🗑️
              </button>
            )}
          </div>
        ))}
        <div ref={scrollEnd}></div>
      </div>

      {/*--------bottom area ------ */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center gap-3 p-3">
        <div className="flex-1 flex items-center bg-gray-100/12 px-3 rounded-full">
          <input
            onChange={(e) => setInput(e.target.value)}
            value={input}
            onKeyDown={(e) => (e.key === 'Enter' ? handleSendMessage(e) : null)}
            type="text"
            placeholder="Send a message"
            className="flex-1 text-sm p-3 border-none rounded-lg outline-none text-white placeholder-gray-400"
          />
          {/* Image Upload */}
          <input
            onChange={handleSendimage}
            type="file"
            id="image"
            accept="image/png,image/jpeg"
            hidden
          />
          <label htmlFor="image" className="flex items-center justify-center mx-1" style={{ lineHeight: 0 }}>
            <img
              src={assets.gallery_icon}
              alt=""
              className="w-6 h-6 cursor-pointer"
            />
          </label>
          {/* Video Upload */}
          <input
            type="file"
            id="video-upload"
            accept="video/mp4,video/webm,video/ogg"
            hidden
            onChange={handleVideoUpload}
          />
          <label htmlFor="video-upload" className="flex items-center justify-center mx-1" style={{ lineHeight: 0 }}>
            <img
              src={assets.play_button || assets.gallery_icon} 
              alt="Upload video"
              className="w-6 h-6 cursor-pointer"
            />
          </label>
          {/* Doc Upload */}
          <input
            type="file"
            id="doc-upload"
            accept=".pdf,.doc,.docx,.xls,.xlsx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            hidden
            onChange={handleDocUpload}
          />
          <label htmlFor="doc-upload" className="flex items-center justify-center mx-1" style={{ lineHeight: 0 }}>
            <img
              src={assets.file_icon}
              alt=""
              className="w-6 h-6 cursor-pointer"
            />
          </label>
        </div>
        <img
          onClick={handleSendMessage}
          src={assets.send_button}
          alt=""
          className="w-7 cursor-pointer"
        />
      </div>
    </div>
  ) : (
    <div className="flex flex-col items-center justify-center gap-2 text-gray-500 bg-white/10 max-md:hidden">
      <img src={assets.logo_icon} className="max-w-16" alt="" />
      <p className="text-lg font-medium text-white">
        Chat anytime, anywhere.!!
      </p>
    </div>
  );
};

export default ChatContainer;
