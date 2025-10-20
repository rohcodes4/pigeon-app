import React, { useEffect, useState } from "react";
import Lottie from "lottie-react";
import DiscordSticker from "./DiscordSticker";

export default function StickerMenu({ onStickerSelect,stickerPacks }) {
  const [openPack, setOpenPack] = useState(null);  

  return (
    <div className="absolute bottom-14 right-20 bg-[#1e1e1e] border border-gray-700 rounded-[8px] w-72 h-80 overflow-y-auto shadow-lg">
      {stickerPacks.map((pack) => (
        <div key={pack.id} className="p-2 border-b border-gray-700">
          <button
            onClick={() => setOpenPack(openPack === pack.id ? null : pack.id)}
            className="w-full text-left text-white font-semibold text-sm flex justify-between items-center"
          >
            <span>{pack.name}</span>
            <span className="text-gray-500 text-xs">{pack.stickers?.length || 0}</span>
          </button>
          {openPack === pack.id && (
            <div className="grid grid-cols-3 gap-2 mt-2">
              {pack.stickers?.map((sticker) => {
                const isAnimated = sticker.format_type === 3 || sticker.format_type === 4;
                return (
                  <div
                    key={sticker.id}
                    className="bg-[#2c2f33] p-3 rounded hover:bg-[#40444b] cursor-pointer flex justify-center items-center "
                    onClick={() => onStickerSelect(sticker)}
                  >
                      <DiscordSticker width={56} height={56} stickerId={sticker.id}/>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
