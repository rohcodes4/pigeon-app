import React, { useEffect, useRef, useState } from "react";
import { FaDiscord, FaTelegramPlane } from "react-icons/fa";
import discord from "@/assets/images/discord.png";
import telegram from "@/assets/images/telegram.png";
import {
  Plus,
  PlusCircleIcon,
  SendHorizonal,
  X,
  XCircleIcon,
} from "lucide-react";
import ChatAvatar from "./ChatAvatar";
import { useNavigate } from "react-router-dom";
import UnifiedChatPanel from "./UnifiedChatPanel";
import { mapToFullChat } from "@/lib/utils";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// const users = [
//     {
//         id:1,
//         name: 'Babayaga',
//         platform:'Telegram'
//     },
//     {
//         id:2,
//         name: 'Michael Saylor',
//         platform:'Discord'
//     },
//     {
//         id:3,
//         name: 'Michael Saylor',
//         platform:'Telegram'
//     },
//     {
//         id:4,
//         name: 'Michael Saylor',
//         platform:'Discord'
//     },
//     {
//         id:5,
//         name: 'Michael Saylor',
//         platform:'Telegram'
//     },
//     {
//         id:6,
//         name: 'Michael Saylor',
//         platform:'Telegram'
//     },
//     {
//         id:1,
//         name: 'Babayaga',
//         platform:'Telegram'
//     },
//     {
//         id:2,
//         name: 'Michael Saylor',
//         platform:'Discord'
//     },
//     {
//         id:3,
//         name: 'Michael Saylor',
//         platform:'Telegram'
//     },
//     {
//         id:4,
//         name: 'Michael Saylor',
//         platform:'Discord'
//     },
//     {
//         id:5,
//         name: 'Michael Saylor',
//         platform:'Telegram'
//     },
//     {
//         id:6,
//         name: 'Michael Saylor',
//         platform:'Telegram'
//     },
//     {
//         id:1,
//         name: 'Babayaga',
//         platform:'Telegram'
//     },
//     {
//         id:2,
//         name: 'Michael Saylor',
//         platform:'Discord'
//     },
//     {
//         id:3,
//         name: 'Michael Saylor',
//         platform:'Telegram'
//     },
//     {
//         id:4,
//         name: 'Michael Saylor',
//         platform:'Discord'
//     },
//     {
//         id:5,
//         name: 'Michael Saylor',
//         platform:'Telegram'
//     },
//     {
//         id:6,
//         name: 'Michael Saylor',
//         platform:'Telegram'
//     },
//   ];
const ContactsPanel = () => {
  const chatPanelRef = useRef(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [users, setUsers] = useState([]);
  const fileInputRef = React.useRef(null);
  const [showAttachMenu, setShowAttachMenu] = React.useState(false);
  const attachRef = React.useRef(null);
  const [uploadedFiles, setUploadedFiles] = React.useState([]);
  const infoDivRef = useRef<HTMLDivElement>(null);
  const [infoDivHeight, setInfoDivHeight] = useState(0);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  useEffect(() => {
    if (infoDivRef.current) {
      setInfoDivHeight(infoDivRef.current.offsetHeight);
    }
    if (!selectedUser) {
      setInfoDivHeight(0);
    }
  }, [uploadedFiles, selectedUser]);

  useEffect(() => {
    // Fetch users from backend
    const token = localStorage.getItem("access_token");
    fetch(`${BACKEND_URL}/contacts`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => res.json())
      .then((data) => {
        const uniqueUsers = Array.from(
          new Map(data.map((user) => [user.id, user])).values()
        );
        setUsers(uniqueUsers);
      })
      .catch((err) => {
        console.error("Failed to fetch contacts:", err);
        setUsers([]); // fallback to empty array on error
      });
  }, []);

  const getFileType = (file) => {
    if (file.type.startsWith("image/")) return "image";
    if (file.type.startsWith("video/")) return "video";
    return "doc";
  };
  const handleSend = (message, targetChat) => {
    console.log("Sending message:", message, "to chat:", targetChat);

    if (chatPanelRef.current) {
      console.log("chatPanelRef.current:", chatPanelRef.current);
      chatPanelRef.current.handleSend(message, mapToFullChat(selectedUser));
      setMessage("");
      navigate("/", { state: { selectedChat: mapToFullChat(selectedUser) } });
    }
  };
  return (
    <div className="p-4 0 text-white bg-[#1a1a1e]">
      <div
        className={`overflow-y-scroll ${
          selectedUser && uploadedFiles.length == 0
            ? "h-[calc(100vh-280px)]"
            : uploadedFiles.length >= 1
            ? `h-[calc(100vh-${infoDivHeight + 150}px)]`
            : "h-[calc(100vh-150px)]"
        }`}
        style={{ height: `calc(100vh - ${infoDivHeight + 150}px)` }}
      >
        {users.length > 0 &&
          users.map((user, index) => (
            <div
              key={index}
              className={` flex items-center gap-3 p-5 px-3 rounded-[10px]
           hover:bg-[#fafafa10] bg-transparent cursor-pointer
          `}
              onClick={() => setSelectedUser(user)}
            >
              <div className="relative">
                {/* <img
              src={`https://www.gravatar.com/avatar/${Math.random()*100}?d=identicon&s=80`}
              alt={user.name}
              className="w-10 h-10 rounded-full object-cover"
            /> */}
                <ChatAvatar
                  name={user.name}
                  avatar={`${BACKEND_URL}/chat_photo/${user.chat_id}`}
                  backupAvatar={`${BACKEND_URL}/contact_photo/${user.id}`}
                />
                <img
                  src={user.platform === "Discord" ? discord : telegram}
                  className={`
                absolute -bottom-2 -right-1
                ${user.platform === "Discord" ? "bg-[#7b5cfa]" : "bg-[#3474ff]"}
                rounded-[4px] w-5 h-5 p-0.5 border-2 border-[#111111]
              `}
                  alt={user.platform}
                />
              </div>
              <span className="hover:text-[#ffffff] text-[#ffffff60]">
                {user.chatTitle
                  ? user.chat_title
                  : user.first_name || user.last_name
                  ? `${user.first_name ? user.first_name : ""} ${
                      user.last_name ? user.last_name : ""
                    }`
                  : user.username
                  ? user.username
                  : "No name"}
                {/* {user.chat_title || `${user.first_name} ${user.last_name}` || user.username} */}
              </span>
            </div>
          ))}
      </div>

      {selectedUser && (
        <div ref={infoDivRef} className="p-4 text-white rounded-[8px]">
          {uploadedFiles.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {uploadedFiles.map((uf, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 bg-[#2d2d2d] px-3 py-2 rounded-[10px] text-white relative"
                >
                  {/* Icon / Preview */}
                  {uf.type === "image" ? (
                    <img
                      src={uf.preview}
                      alt={uf?.file?.name}
                      className="w-8 h-8 rounded object-cover"
                    />
                  ) : uf.type === "video" ? (
                    <span className="w-8 h-8 flex items-center justify-center bg-[#444] rounded">
                      🎥
                    </span>
                  ) : (
                    <span className="w-8 h-8 flex items-center justify-center bg-[#444] rounded">
                      📄
                    </span>
                  )}

                  {/* Name */}
                  <span className="text-xs max-w-[150px] truncate">
                    {uf?.file?.name}
                  </span>

                  {/* Loader */}
                  {uf.status === "uploading" && (
                    <div className="w-4 h-4 border-2 border-[#84afff] border-t-transparent rounded-full animate-spin"></div>
                  )}

                  {/* Remove */}
                  <X
                    className="w-4 h-4 text-gray-400 hover:text-red-400 cursor-pointer"
                    onClick={() =>
                      setUploadedFiles((prev) =>
                        prev.filter((_, i) => i !== idx)
                      )
                    }
                  />
                </div>
              ))}
            </div>
          )}
          <div className="flex justify-start gap-2 items-center bg-[#ffffff04] rounded-t-[8px] p-2">
            <h2 className="text-sm text-[#fafafa]">
              Chat with{" "}
              {selectedUser.chatTitle
                ? selectedUser.chat_title
                : selectedUser.first_name || selectedUser.last_name
                ? `${selectedUser.first_name ? selectedUser.first_name : ""} ${
                    selectedUser.last_name ? selectedUser.last_name : ""
                  }`
                : selectedUser.username
                ? selectedUser.username
                : "No name"}
            </h2>
            <XCircleIcon
              className="w-5 h-5 cursor-pointer text-black fill-[#fafafa]"
              onClick={() => setSelectedUser(null)}
            />
          </div>
          <div className="relative flex items-center p-4 bg-[#222327] rounded-b-[8px]">
            {showAttachMenu && (
              <div className="absolute bottom-[130%] left-0 mb-2 mx-2 px-3 py-2 bg-[#2d2d2d] text-white text-sm rounded-[10px] shadow-lg border border-[#ffffff14] z-50">
                {/* Actual file input, hidden */}
                <input
                  ref={fileInputRef}
                  type="file"
                  style={{ display: "none" }}
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []).map(
                      (file) => ({
                        file,
                        type: getFileType(file),
                        preview: file.type.startsWith("image/")
                          ? URL.createObjectURL(file)
                          : null,
                        status: "uploading",
                      })
                    );

                    setUploadedFiles((prev) => [...prev, ...files]);
                    setShowAttachMenu(false);

                    // Simulate upload completion after 2s for demo
                    setTimeout(() => {
                      setUploadedFiles((prev) =>
                        prev.map((f) =>
                          files.includes(f) ? { ...f, status: "done" } : f
                        )
                      );
                    }, 2000);
                  }}
                />
                {/* Triggers file picker */}
                <p
                  className="mb-1 py-2 cursor-pointer hover:text-[#84afff] w-max"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Attach File
                </p>
                <p
                  className="mb-1 py-2 cursor-pointer hover:text-[#84afff] w-max"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Send Image
                </p>
                <p
                  className="mb-1 py-2 cursor-pointer hover:text-[#84afff] w-max"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Send Video
                </p>
              </div>
            )}
            <PlusCircleIcon
              className="w-5 h-5 mr-2 cursor-pointer"
              onClick={() => setShowAttachMenu((prev) => !prev)}
            />
            <input
              type="text"
              placeholder={`Send a message to ${
                selectedUser.chatTitle
                  ? selectedUser.chat_title
                  : selectedUser.first_name || selectedUser.last_name
                  ? `${
                      selectedUser.first_name ? selectedUser.first_name : ""
                    } ${selectedUser.last_name ? selectedUser.last_name : ""}`
                  : selectedUser.username
                  ? selectedUser.username
                  : "No name"
              } on ${selectedUser.platform || "Telegram"}`}
              className="text-[#fafafa] p-2 rounded w-full bg-transparent"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <button
              onClick={handleSend.bind(this, message, selectedUser)}
              className="ml-3 p-2 rounded-[10px] bg-[#5389ff] hover:bg-[#5389ff] transition"
            >
              <SendHorizonal className="w-5 h-5 text-black fill-black" />
            </button>
          </div>
        </div>
      )}
      <UnifiedChatPanel ref={chatPanelRef} />
    </div>
  );
};

export default ContactsPanel;
