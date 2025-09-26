// src/components/CustomCheckbox.tsx
import React from "react";

interface CustomCheckboxProps {
  checked: boolean;
  onChange: () => void;
  className?: string;
}

const CustomCheckbox: React.FC<CustomCheckboxProps> = ({ checked, onChange, className }) => (
  <button
    type="button"
    className={`h-5 w-5 flex items-center justify-center rounded-[6px] border  transition-colors
      ${checked ? "bg-[#5389FF] border-[#ffffff00]" : "bg-transparent border-[#ffffff48]"} ${className || ""}`}
    onClick={onChange}
    aria-checked={checked}
    role="checkbox"
    tabIndex={0}
  >
    {checked && (
      <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
        <path
          d="M5 10.5L9 14.5L15 7.5"
          stroke="#000"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )}
  </button>
);

export default CustomCheckbox;