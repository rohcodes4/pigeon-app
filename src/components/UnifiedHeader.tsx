// import React from "react";
// import { Search, Filter, Settings, Plus, CheckCheck, PinOff, SmilePlusIcon } from "lucide-react";
// import aiIMG from "@/assets/images/aiBlue.png";

// type UnifiedHeaderProps = {
//     title: string;
//     smartText: string;
//     isSmartSummary?: boolean;
//     isReadAll?: boolean;
//     setIsSmartSummary?: (value:boolean)=>void;
//   isPinnable?: boolean;
//   isContact?: boolean;

//   };
// const UnifiedHeader:React.FC<UnifiedHeaderProps> = ({
//     title,
//     smartText,
//     isReadAll,
//     isSmartSummary,
//     setIsSmartSummary,
//     isPinnable,
//     isContact=false
// }) => {
//   return (
//     <header className="flex flex-shrink-0 items-center justify-between px-6 py-1 border-b border-[#23272f] rounded-tl-[12px]">
//       {/* Left: Title and subtitle */}
//       <div className="flex gap-2 items-center">
//         <h1 className="text-[15px] text-[#ffffff72]">{title}</h1>
//         {/* <span className="p-1.5 rounded-[6px] text-[11px] text-[#84afff] bg-[#3474ff12]">All Channels</span> */}
//         <span className="p-1.5 rounded-[6px] text-[11px] text-[#bfd6ff] bg-[#3474ff]">Telegram</span>
//         <span className="p-1.5 rounded-[6px] text-[11px] text-[#d7d5ff] bg-[#7b5cfa]">Discord</span>
        
//         {isPinnable && <div className=" cursor-pointer p-2 flex items-center justify-center bg-[#fafafa10] rounded-[6px]">
//   <PinOff
//     className="text-[#fafafa60] fill-[#fafafa60] w-4 h-4"
//     aria-label="Unpin"
//   />
// </div>}
//       </div>

    
//       {/* Right: Actions and avatar */}
//       {isContact ? (
//   <div className="flex items-center gap-3">
//       <button className="p-1.5 my-1 flex gap-2 text-[11px] items-center rounded-lg bg-[#fafafa10] border border-[#ffffff03] text-[#ffffff] hover:text-[#ffffff] hover:bg-[#ffffff32] transition">
//         <SmilePlusIcon className="w-4 h-4" /> <span>Add a friend</span>
//       </button>
//   </div>
// ) : (
//   <div className="flex items-center gap-3">
//     {isReadAll && (
//       <button className="p-1.5 my-1 flex gap-2 text-[11px] items-center rounded-[6px] cursor-pointer bg-[#ffffff06] border border-[#ffffff03] text-[#ffffff32] hover:text-[#ffffff64] hover:bg-[#ffffff32] transition">
//         <CheckCheck className="w-5 h-5" /> <span>Read All</span>
//       </button>
//     )}
//     <button
//       onClick={() => setIsSmartSummary(!isSmartSummary)}
//       className="p-1.5 px-3 my-1 flex gap-2 text-[11px] items-center rounded-[6px] cursor-pointer text-[#84afff] bg-[#3474ff12] hover:text-[#ffffff] hover:bg-[#3474ff] transition"
//     >
//       <img src={aiIMG} className="w-5 h-5" />
//       <span>{smartText}</span>
//     </button>
//   </div>
// )}
//     </header>
//   );
// };

// export default UnifiedHeader;


import React from "react";
import { useLocation } from "react-router-dom";
import { Search, Filter, Settings, Plus, CheckCheck, PinOff, SmilePlusIcon } from "lucide-react";
import aiIMG from "@/assets/images/aiBlue.png";

type UnifiedHeaderProps = {
    title: string;
    smartText: string;
    isSmartSummary?: boolean;
    isReadAll?: boolean;
    setIsSmartSummary?: (value:boolean)=>void;
  isPinnable?: boolean;
  isContact?: boolean;
  isAI?: boolean;
};

const UnifiedHeader:React.FC<UnifiedHeaderProps> = ({
    title,
    smartText,
    isReadAll,
    isSmartSummary,
    setIsSmartSummary,
    isPinnable,
    isContact=false,
    isAI=false
}) => {
  const location = useLocation();

  // Only show smart button on the home page (/)
  const showSmartButton = location.pathname === "/" || (location.pathname === "/ai" && !isAI);
  return (
    <header className="flex flex-shrink-0 items-center justify-between px-6 py-1 border-b border-[#23272f] rounded-tl-[12px] py-2">
      {/* Left: Title and subtitle */}
      <div className="flex gap-2 items-center">
        <h1 className="text-[15px] text-[#ffffff72]">{title}</h1>
        {/* <span className="p-1.5 rounded-[6px] text-[11px] text-[#84afff] bg-[#3474ff12]">All Channels</span> */}
        <span className="p-1.5 rounded-[6px] text-[11px] text-[#bfd6ff] bg-[#3474ff]">Telegram</span>
        <span className="p-1.5 rounded-[6px] text-[11px] text-[#d7d5ff] bg-[#7b5cfa]">Discord</span>
        
        {isPinnable && <><div className=" cursor-pointer p-2 flex items-center justify-center bg-[#fafafa10] rounded-[6px]">
  <PinOff
    className="text-[#fafafa60] fill-[#fafafa60] w-4 h-4"
    aria-label="Unpin"
  />
</div>
<div className=" cursor-pointer p-2 flex items-center justify-center bg-[#fafafa10] rounded-[6px]">
  <PinOff
    className="text-[#fafafa60] fill-[#fafafa60] w-4 h-4"
    aria-label="Unpin"
  />
</div></>}
      </div>
      
      {/* Right: Actions and avatar */}
      {isContact ? (
  <div className="flex items-center gap-3">
      <button onClick={() => setIsSmartSummary(!isSmartSummary)} className="p-1.5 my-1 flex gap-2 text-[11px] items-center rounded-[6px] bg-[#fafafa10] border border-[#ffffff03] text-[#ffffff] hover:text-[#ffffff] hover:bg-[#ffffff32] transition">
        <SmilePlusIcon className="w-4 h-4" /> <span>Add a friend</span>
      </button>
  </div>
) : (
  <div className="flex items-center gap-3">
    {isReadAll && (
      <button className="p-1.5 my-1 flex gap-2 text-[11px] items-center rounded-[6px] cursor-pointer bg-[#ffffff06] border border-[#ffffff03] text-[#ffffff32] hover:text-[#ffffff64] hover:bg-[#ffffff32] transition">
        <CheckCheck className="w-5 h-5" /> <span>Read All</span>
      </button>
    )}
   {showSmartButton && (
      <button
        onClick={() => setIsSmartSummary && setIsSmartSummary(!isSmartSummary)}
        className="p-1.5 px-3 my-1 flex gap-2 text-[11px] items-center rounded-[6px] cursor-pointer text-[#84afff] bg-[#3474ff12] hover:text-[#ffffff] hover:bg-[#3474ff] transition"
      >
        <img src={aiIMG} className="w-5 h-5" />
        <span>{smartText}</span>
      </button>
    )}
  </div>
)}
    </header>
  );
};

export default UnifiedHeader;