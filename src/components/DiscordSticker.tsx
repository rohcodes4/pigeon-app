import React, { useEffect, useState } from 'react';
import Lottie from 'lottie-react';

function DiscordSticker({stickerId}) {
  const [animationData, setAnimationData] = useState(null);

  useEffect(() => {
    async function fetchStickerJSON() {
      try {
        const response = await window.electronAPI.discord.getStickerById(stickerId)
        console.log('sticker res', response)
        if (!response.success) throw new Error('Failed to fetch sticker JSON');
        const jsonData = await response.data;
        setAnimationData(jsonData);
      } catch (error) {
        console.error('Error loading sticker animation:', error);
      }
    }

    fetchStickerJSON();
  }, [stickerId]);

  if (!animationData) return <div>Loading sticker...</div>;

  return (
    <div style={{width: 128, height: 128}}>
      <Lottie animationData={animationData} loop={true} />
    </div>
  );
}

export default DiscordSticker;
