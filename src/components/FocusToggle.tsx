import { useGlobalFocus } from "@/context/focusModeContext";
import { useEffect, useState } from "react";

export default function FocusToggle({ imgTop, imgBottom, onToggle }) {
    const { value, setValue } = useGlobalFocus();
    const [activeIndex, setActiveIndex] = useState(value==true?0:1);
  const baseClasses =
    "h-8 w-8 flex-1 flex items-center justify-center cursor-pointer transition-all duration-300 rounded-[8px]";
  const blueBg = "bg-[#4273FA]";
  const greyBg = "bg-[#212328]";

  useEffect(()=>{
    console.log('focus context value',value)
    // setActiveIndex(value==true?0:1)
  },[])
  // Toggle handler
  const handleToggle = (index) => {
    if (activeIndex !== index) {
      setActiveIndex(index);
      setValue(index==0?true:false)
      if (onToggle) onToggle(index);
    }
  };

  return (
    <div className="flex gap-1 h-[76px] py-1 flex-col justify-center items-center rounded-[8px] bg-[#23272f] shadow-lg overflow-hidden">
      {/* Top image element */}
      <div
        className={`${baseClasses} ${activeIndex === 0 ? blueBg : ''}`}
        style={{
          boxShadow: activeIndex === 0 ? "0 0 12px #4273FA33" : undefined,
        }}
        onClick={() => handleToggle(0)}
      >
        <img
          src={imgTop}
          alt="Top"
          className="h-6 w-6 object-contain"
          draggable={false}
        />
      </div>

      {/* Bottom image element */}
      <div
        className={`${baseClasses} ${activeIndex === 1 ? blueBg : ''}`}
        style={{
          boxShadow: activeIndex === 1 ? "0 0 12px #4273FA33" : undefined,
        }}
        onClick={() => handleToggle(1)}
      >
        <img
          src={imgBottom}
          alt="Bottom"
          className="h-6 w-6 object-contain"
          draggable={false}
        />
      </div>
    </div>
  );
}
