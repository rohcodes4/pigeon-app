import React, { useState } from "react";

function gravatarUrl(seed: string) {
  try {
    // Handle Unicode characters safely
    const safeSeed = seed.replace(/[^\x00-\x7F]/g, ""); // Remove non-ASCII characters
    if (!safeSeed)
      return `https://www.gravatar.com/avatar/default?d=identicon&s=80`;
    return `https://www.gravatar.com/avatar/${btoa(safeSeed)}?d=identicon&s=80`;
  } catch (error) {
    // Fallback to default avatar
    return `https://www.gravatar.com/avatar/default?d=identicon&s=80`;
  }
}

// ... existing code ...
function ChatAvatar({ name, avatar, backupAvatar }) {
  const gravatar = gravatarUrl(name + "Telegram");
  const [src, setSrc] = useState(
    avatar ? avatar : backupAvatar ? backupAvatar : gravatar
  );

  // Track which fallback we're on
  const [fallbackStep, setFallbackStep] = useState(0);

  const handleError = () => {
    if (fallbackStep === 0 && backupAvatar && src !== backupAvatar) {
      setSrc(backupAvatar);
      setFallbackStep(1);
    } else if (fallbackStep <= 1 && src !== gravatar) {
      setSrc(gravatar);
      setFallbackStep(2);
    }
  };

  return (
    <>
      <img
        src={src}
        alt={name}
        className="w-10 h-10 rounded-full object-cover"
        loading="lazy"
        decoding="async"
        onError={handleError}
      />
    </>
  );
}

export default ChatAvatar;
