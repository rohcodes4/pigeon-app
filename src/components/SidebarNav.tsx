// ... existing code ...
import AI from "@/assets/images/sidebar/AI.png";
import Chat from "@/assets/images/sidebar/Chat.png";
import Doc from "@/assets/images/sidebar/Doc.png";
import Favourite from "@/assets/images/sidebar/Favourite.png";
import Help from "@/assets/images/sidebar/Help.png";
import Lobby from "@/assets/images/sidebar/Lobby.png";
import Logs from "@/assets/images/sidebar/Logs.png";
import Notification from "@/assets/images/sidebar/Notification.png";
import Discord from "@/assets/images/discord.png";
import Telegram from "@/assets/images/telegram.png";

export const SidebarNav = () => (
  <aside className="h-screen w-20 flex flex-col items-center py-6">
    <nav className="flex flex-col gap-2 flex-1">
      <button className="relative bg-[#212121] hover:bg-[#23272f] p-2 rounded-lg">
        <img src={AI} alt="AI" className="w-6 h-6" />
        <span className="absolute top-[3px] right-[3px] bg-[#5389FF] text-black text-[12px] w-4 h-4 rounded-[6px]">
      1
    </span>
      </button>
      <button className="hover:bg-[#212121] p-2 rounded-lg">
        <img src={Chat} alt="Chat" className="w-6 h-6" />
      </button>
      <button className="hover:bg-[#212121] p-2 rounded-lg">
        <img src={Logs} alt="Logs" className="w-6 h-6" />
      </button>
      
      <button className="hover:bg-[#212121] p-2 rounded-lg">
        <img src={Favourite} alt="Favourite" className="w-6 h-6" />
      </button>
      <button className="hover:bg-[#212121] p-2 rounded-lg">
        <img src={Notification} alt="Notification" className="w-6 h-6" />
      </button>
      
      <button className="hover:bg-[#212121] p-2 rounded-lg">
        <img src={Doc} alt="Doc" className="w-6 h-6" />
      </button>
      <button className="hover:bg-[#212121] p-2 rounded-lg">
        <img src={Lobby} alt="Lobby" className="w-6 h-6" />
      </button>
      <button className="hover:bg-[#212121] p-2 rounded-lg">
        <img src={Help} alt="Help" className="w-6 h-6" />
      </button>
      
    </nav>
    <div className="flex flex-col items-center gap-6 mt-auto mb-4">
      {/* Discord Icon with Connected Badge */}
      <div className="relative bg-[#7B5CFA] rounded-full p-2">
        <img src={Discord} alt="Discord" className="w-4 h-4 rounded" />
        <span className="absolute bottom-0 right-0 block w-2 h-2 bg-green-500  rounded-full"></span>
      </div>
      {/* Telegram Icon with Connected Badge */}
      <div className="relative bg-[#3474FF] rounded-full p-2">
        <img src={Telegram} alt="Telegram" className="w-4 h-4 rounded" />
        <span className="absolute bottom-0 right-0 block w-2 h-2 bg-green-500  rounded-full"></span>
      </div>
    </div>
  </aside>
);