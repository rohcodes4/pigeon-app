import React, { useState } from "react";
import MentionModal from "./MentionModal";
import { mapDiscordToTelegramSchema } from "@/lib/utils";

function MessageWithLinkifyAndMentions({ text, mentionsData, message }) {
  const [modalUsername, setModalUsername] = useState(null);
  const [modalUserId, setModalUserId] = useState(null);
  const [modalAvatar, setModalAvatar] = useState(null);
  const [modalMention, setModalMention] = useState(null);
// console.log('mentionsData',mentionsData)
  // Regex for mention detection - matches <@id>
  const mentionRegex = /<@(\d+)>/g;

  // Regex for URLs
  const urlRegex = /https?:\/\/[^\s]+/g;
  const combinedRegex = new RegExp(`${urlRegex.source}|${mentionRegex.source}`, "g");

  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = combinedRegex.exec(text)) !== null) {
    const start = match.index;
    const end = combinedRegex.lastIndex;

    if (lastIndex !== start) {
      parts.push(text.slice(lastIndex, start));
    }

    const matchedText = text.slice(start, end);

    if (matchedText.match(urlRegex)) {
      parts.push(
        <a
          key={start}
          href={matchedText}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 underline break-words"
        >
          {matchedText}
        </a>
      );
    } else if (matchedText.match(mentionRegex)) {
      // Extract ID from mention
      const id = matchedText.match(mentionRegex)[0].replace(/[<@>]/g, "");
      // Find mention username from mentionsData
      const mention = mentionsData?.find((m) => m.id === id);
      const user_id = mention ? mention.id : null;
      const avatar = mention ? `https://cdn.discordapp.com/avatars/${mention.id}/${mention.avatar}.png` : null;

      const username = mention ? mention.username : id;

      parts.push(
        <span
          key={start}
          className="bg-blue-100 underline text-blue-700 px-1 rounded cursor-pointer"
          onClick={() => {
            setModalUsername(username);
            setModalUserId(user_id);
            setModalAvatar(avatar);
            setModalMention(mention);
          }}
        >
          @{username}
        </span>
      );
    } else {
      parts.push(matchedText);
    }

    lastIndex = end;
  }

  if (lastIndex < text?.length) {
    parts.push(text?.slice(lastIndex));
  }

  return (
    <>
      <span>{parts}</span>
      {modalUsername && (
        <MentionModal
          username={modalUsername}
          avatar={modalAvatar}
          userId={modalUserId}
          mention={modalMention}
          message={message}
          onClose={() => setModalUsername(null)}
        />
      )}
    </>
  );
}

export default MessageWithLinkifyAndMentions;
