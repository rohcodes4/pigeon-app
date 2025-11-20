import React, { useState, useEffect } from "react";
import logo from "@/assets/images/logo.svg";

interface ChatAvatarProps {
  name: string;
  avatar?: string | string[]; // ✅ single URL or array for groups
  backupAvatar?: string;
  size?: number;
  debug?: boolean;
}

const ChatAvatar: React.FC<ChatAvatarProps> = ({
  name,
  avatar,
  backupAvatar,
  size = 40,
  debug = false,
}) => {
  const gravatar = logo;
  const [fallbackStep, setFallbackStep] = useState(0);

  // Log avatar, backupAvatar, fallbackStep, and current src on relevant changes
  useEffect(() => {
    if (debug) {
      console.log("[chatav] avatar:", avatar);
      console.log("[chatav] backupAvatar:", backupAvatar);
    }
  }, [avatar, backupAvatar, debug]);

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
    if (debug) {
      console.log("[chatav] initialSrc changed:", initialSrc);
      console.log("[chatav] resetting src and fallbackStep");
    }
    setSrc(initialSrc);
    setFallbackStep(0);
  }, [avatar, backupAvatar, initialSrc, debug]);

  const handleError = () => {
    if (debug) console.log("[chatav] handleError called. fallbackStep:", fallbackStep, "current src:", src);

    if (fallbackStep === 0 && backupAvatar && src !== backupAvatar) {
      if (debug) console.log("[chatav] Switching src to backupAvatar");
      setSrc(backupAvatar);
      setFallbackStep(1);
    } else if (fallbackStep <= 1 && src !== gravatar) {
      if (debug) console.log("[chatav] Switching src to gravatar");
      setSrc(gravatar);
      setFallbackStep(2);
    } else {
      if (debug) console.log("[chatav] No more fallbacks available");
    }
  };

  if (isArray) {
    if (debug) console.log("[chatav] rendering array of avatars", avatar);

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
                if (debug) console.log(`[chatav] img #${i} failed to load, src: ${src}`);
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

  if (debug) console.log("[chatav] rendering single avatar with src:", src);

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
