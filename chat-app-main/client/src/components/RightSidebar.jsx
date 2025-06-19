import React, { useContext } from 'react';
import assets from '../assets/assets';
import { ChatContext } from '../../context/ChatContext';
import { AuthContext } from '../../context/AuthContext';

const RightSidebar = () => {
  const { selectedUser, messages } = useContext(ChatContext);
  const { logout, onlineUsers } = useContext(AuthContext);

  return (
    selectedUser && (
      <div
        className={`bg-[#8185B2]/10 text-white w-full relative overflow-y-auto ${selectedUser ? 'max-md:hidden' : ''}`}
      >
        <div className="pt-16 flex flex-col items-center gap-2 text-xs font-light mx-auto">
          <img
            src={selectedUser?.profilePic || assets.avatar_icon}
            alt=""
            className="w-20 aspect-[1/1] rounded-full"
          />
          <h1 className="px-10 text-xl font-medium mx-auto flex items-center gap-2">
            {onlineUsers.includes(selectedUser._id) && (
              <p className="w-2 h-2 rounded-full bg-green-500"></p>
            )}
            {selectedUser.fullName}
          </h1>
          <p className="px-10 mx-auto">{selectedUser.bio}</p>
        </div>
        <hr className="border-[#ffffff50] my-4" />

        {/* Unified scrollable container for media & docs */}
        <div className="px-5 text-xs">
          {/* --- Media --- */}
          <div>
            <p className="font-semibold mb-2">Media</p>
            <div className="max-h-[110px] overflow-y-auto grid grid-cols-2 gap-3 opacity-80 border-b border-[#ffffff30] pb-3">
              {messages.filter(msg => msg.image || msg.video).length > 0 ? (
                messages
                  .filter(msg => msg.image || msg.video)
                  .map((msg, idx) =>
                    msg.image ? (
                      <div
                        key={'img-' + idx}
                        onClick={() => window.open(msg.image)}
                        className="cursor-pointer rounded"
                      >
                        <img src={msg.image} alt="" className="h-full rounded-md" />
                      </div>
                    ) : (
                      <div
                        key={'vid-' + idx}
                        onClick={() => window.open(msg.video)}
                        className="cursor-pointer rounded"
                      >
                        <video
                          src={msg.video}
                          className="h-full rounded-md"
                          controls
                          style={{ maxHeight: 72, maxWidth: '100%' }}
                        />
                      </div>
                    )
                  )
              ) : (
                <p className="col-span-2 text-center text-gray-400">No Media</p>
              )}
            </div>
          </div>
          {/* --- Docs --- */}
          <div className="mt-4">
            <p className="font-semibold mb-2">Docs</p>
            <div className="max-h-[110px] overflow-y-auto flex flex-col gap-2 opacity-80">
              {messages.filter(msg => msg.doc).length > 0 ? (
                messages
                  .filter(msg => msg.doc)
                  .map((msg, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <a
                        href={msg.doc ? msg.doc.replace("/upload/", "/upload/fl_attachment/") : "#"}
                        download={msg.docName || true}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline text-blue-300 flex items-center"
                      >
                        📄 {msg.docName || 'Document'}
                      </a>
                    </div>
                  ))
              ) : (
                <p className="text-center text-gray-400">No Documents</p>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={() => logout()}
          className="absolute bottom-5 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-400 to-violet-600 text-white border-white text-sm font-light py-2 px-20 rounded-full cursor-pointer"
        >
          Logout!
        </button>
      </div>
    )
  );
};

export default RightSidebar;
