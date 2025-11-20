import React, { useState, useEffect } from "react";
import logo from "@/assets/images/logo.svg";

interface ChatAvatarProps {
  name: string;
  avatar?: string | string[]; // ✅ single URL or array for groups
  backupAvatar?: string;
  size?: number;
}

const ChatAvatar: React.FC<ChatAvatarProps> = ({
  name,
  avatar,
  backupAvatar,
  size = 40,
}) => {
  const gravatar = logo;
  const [fallbackStep, setFallbackStep] = useState(0);

  const isArray = Array.isArray(avatar);

  const initialSrc = isArray
    ? avatar[0]
    : avatar
    ? avatar
    : backupAvatar
    ? backupAvatar
    : gravatar;

  const [src, setSrc] = useState(initialSrc);

  useEffect(() => {
    setSrc(initialSrc);
    setFallbackStep(0);
  }, [avatar, backupAvatar, initialSrc]);

  const handleError = () => {
    if (fallbackStep === 0 && backupAvatar && src !== backupAvatar) {
      setSrc(backupAvatar);
      setFallbackStep(1);
    } else if (fallbackStep <= 1 && src !== gravatar) {
      setSrc(gravatar);
      setFallbackStep(2);
    }
  };

  if (isArray) {
    const isTwoImageLayout = avatar.length <= 30;
    const avatars = isTwoImageLayout ? avatar.slice(0, 2) : avatar.slice(0, 4);
    const gridClass = isTwoImageLayout
      ? "grid grid-cols-2 w-10 h-10 overflow-hidden rounded-full bg-gray-200"
      : "grid grid-cols-2 grid-rows-2 w-10 h-10 overflow-hidden rounded-full bg-gray-200";

    return (
      <div className={gridClass}>
        {avatars.map((src, i) => {
          return (
            <img
              key={i}
              src={src}
              alt={name + i}
              className="object-cover w-full h-full"
              loading="lazy"
              decoding="async"
              onError={(e) => {                
                (e.target as HTMLImageElement).src = backupAvatar || gravatar;
              }}
            />
          );
        })}

        {Array.from({
          length: (isTwoImageLayout ? 2 : 4) - avatars.length,
        }).map((_, i) => (
          <div key={`empty-${i}`} className="bg-gray-300 w-full h-full" />
        ))}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      width={size}
      height={size}
      className="rounded-full object-cover"
      loading="lazy"
      decoding="async"
      onError={handleError}
    />
  );
};

export default ChatAvatar;