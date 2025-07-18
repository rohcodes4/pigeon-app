// ... existing code ...
import React, { useState } from 'react';
import { FaDiscord, FaTelegramPlane } from 'react-icons/fa';
import discord from "@/assets/images/discord.png";
import telegram from "@/assets/images/telegram.png";
import { PlusCircleIcon, XCircleIcon } from 'lucide-react';
const users = [
    { 
        id:1,
        name: 'Babayaga',
        platform:'Telegram'
    },
    { 
        id:2,
        name: 'Michael Saylor',
        platform:'Discord'
    },
    { 
        id:3,
        name: 'Michael Saylor',
        platform:'Telegram'
    },
    { 
        id:4,
        name: 'Michael Saylor',
        platform:'Discord'
    },
    { 
        id:5,
        name: 'Michael Saylor',
        platform:'Telegram'
    },
    { 
        id:6,
        name: 'Michael Saylor',
        platform:'Telegram'
    },
    { 
        id:1,
        name: 'Babayaga',
        platform:'Telegram'
    },
    { 
        id:2,
        name: 'Michael Saylor',
        platform:'Discord'
    },
    { 
        id:3,
        name: 'Michael Saylor',
        platform:'Telegram'
    },
    { 
        id:4,
        name: 'Michael Saylor',
        platform:'Discord'
    },
    { 
        id:5,
        name: 'Michael Saylor',
        platform:'Telegram'
    },
    { 
        id:6,
        name: 'Michael Saylor',
        platform:'Telegram'
    },
    { 
        id:1,
        name: 'Babayaga',
        platform:'Telegram'
    },
    { 
        id:2,
        name: 'Michael Saylor',
        platform:'Discord'
    },
    { 
        id:3,
        name: 'Michael Saylor',
        platform:'Telegram'
    },
    { 
        id:4,
        name: 'Michael Saylor',
        platform:'Discord'
    },
    { 
        id:5,
        name: 'Michael Saylor',
        platform:'Telegram'
    },
    { 
        id:6,
        name: 'Michael Saylor',
        platform:'Telegram'
    },
  ];
const ContactsPanel = () => {
  const [selectedUser, setSelectedUser] = useState(null)

  return (
    <div className="p-4 0 text-white bg-[#1a1a1e]">
        <div className={`overflow-y-scroll ${selectedUser?'h-[calc(100vh-280px)]':'h-[calc(100vh-150px)]'}`}>
      {users.map((user, index) => (
        <div
          key={index}
          className={` flex items-center gap-3 p-5 px-3 rounded-[10px]
           hover:bg-[#fafafa10] bg-transparent cursor-pointer
          `}
          onClick={()=>setSelectedUser(user)}
        >
            
            <div className="relative">
            <img
              src={`https://www.gravatar.com/avatar/${Math.random()*100}?d=identicon&s=80`}
              alt={user.name}
              className="w-10 h-10 rounded-full object-cover"
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
            {user.name}
          </span>
        </div>
      ))}
      </div>

{selectedUser && <div className="p-4 text-white rounded-[8px]">
      <div className="flex justify-start gap-2 items-center bg-[#ffffff04] rounded-t-[8px] p-2">
        <h2 className="text-sm text-[#fafafa]">Chat with {selectedUser.name}</h2>
        <XCircleIcon className="w-5 h-5 cursor-pointer text-black fill-[#fafafa]" onClick={()=>setSelectedUser(null)}/>
      </div>
      <div className="flex items-center p-4 bg-[#222327] rounded-b-[8px]">
        <PlusCircleIcon className="w-5 h-5 mr-2" />
        <input
  type="text"
  placeholder={`Send a message to ${selectedUser.name} on ${selectedUser.platform}`}
  className="text-[#fafafa] p-2 rounded w-full bg-transparent"
/>
      </div>
    </div>}
    </div>
  );
};

export default ContactsPanel;
// ... existing code ...