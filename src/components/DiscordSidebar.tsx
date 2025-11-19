import React from 'react'
import discord from "@/assets/images/discord.png";

const DiscordSidebar = ({discordServers, selectedDiscordServer, onSelectDiscordServer}) => {
    if(discordServers.length==0) return<></>;
  return (
    <div className="bg-[#111111] border-r border-[#23272f] discord-servers pt-2 px-2 overflow-y-auto w-full flex flex-col items-center">
  {discordServers.length > 0 &&
    discordServers.map((server) => (
      <button
        key={server.id}
        className={`block w-11 h-11 mb-2 rounded-[12px] flex items-center justify-center focus:outline-none ${
          selectedDiscordServer === server.id
            ? "border-2 border-blue-600"
            : "hover:bg-gray-700"
        }`}
        onClick={() => onSelectDiscordServer(server.id)}
        type="button"
      >
         <div className="relative">
         {server.icon ? (
          <img
            src={`https://cdn.discordapp.com/icons/${server.id}/${server.icon}.png?size=64`}
            alt={server.name}
            className="w-10 h-10 rounded-[12px]"
            draggable={false}
          />
        ) : (
          <div className="w-10 h-10 bg-gray-600 rounded-[12px] flex items-center justify-center text-xs text-white select-none">
            {server.name.charAt(0).toUpperCase()}
          </div>
        )}       
                                <img
                                  src={discord}
                                  className={`absolute -bottom-2 -right-1 bg-[#7b5cfa] rounded-[4px] w-5 h-5 p-0.5 border-2 border-[#111111]`}
                                  alt={"discord"}
                                />
                              </div>
       
      </button>
    ))}
</div>
  )
}

export default DiscordSidebar