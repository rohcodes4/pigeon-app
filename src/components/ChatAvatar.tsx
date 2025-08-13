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
  
  function ChatAvatar({ name, avatar }) {
  const [src, setSrc] = useState(
    avatar && (avatar.includes("/contact_photo/") || avatar.includes("/chat_photo/"))
      ? avatar
      : gravatarUrl(name + "Telegram")
  );

  // If avatar is a backend photo, set src as avatar
  // If that fails, fallback to gravatar

  return (
    <>
    <img
      src={src}
      alt={name}
      className="w-10 h-10 rounded-full object-cover"
      loading="lazy"
      decoding="async"
      onError={() => {
        if (src !== gravatarUrl(name + "Telegram")) {
          setSrc(gravatarUrl(name + "Telegram"));
        }
      }}
    />
    </>
  );
}
export default ChatAvatar;