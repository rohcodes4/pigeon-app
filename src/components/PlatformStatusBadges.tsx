// ... existing imports ...
import telegram from '@/assets/images/telegram.png'
import discord from '@/assets/images/discord.png'

interface PlatformStatusBadgesProps {
  discordConnected: boolean;
  telegramConnected: boolean;
}

export const PlatformStatusBadges = ({
  discordConnected,
  telegramConnected,
}: PlatformStatusBadgesProps) => {
  return (
    <div className="flex gap-4 mt-2">
      {/* Discord Badge */}
      <div className={`flex bg-[#212121] items-center gap-2 px-4 py-2 rounded-[12px] transition-colors duration-300 ${discordConnected ? "shadow-[0_0_0_3px_rgba(255,255,255,0.1)]" : "shadow-[0_0_0_3px_#212121]"}`}>
        <img src={discord} className='h-5 w-5' />
        <span className={`text-sm ${discordConnected ? "text-[#ffffff72]" : "text-gray-500"}`}>
          Discord
        </span>
        <span
          className={`w-4 h-4 rounded-full mr-2
            ${discordConnected ? "bg-[#50DF3A]" : "bg-[#FDCB35]"}
          `}
        />
      </div>
      {/* Telegram Badge */}
      <div className={`flex bg-[#212121] items-center gap-2 px-4 py-2 rounded-[12px] transition-colors duration-300 ${telegramConnected ? "shadow-[0_0_0_3px_rgba(255,255,255,0.1)]" : "shadow-[0_0_0_3px_#212121]"}`}>
        <img src={telegram} className='h-5 w-5' />
        <span className={`text-sm ${telegramConnected ? "text-[#ffffff72]" : "text-gray-500"}`}>
          Telegram
        </span>
        <span
          className={`w-4 h-4 rounded-full mr-2
            ${telegramConnected ? "bg-[#50DF3A]" : "bg-[#FDCB35]"}
          `}
        />
      </div>
    </div>
  );
};