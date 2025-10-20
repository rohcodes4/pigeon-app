import React, { useEffect, useState, useRef } from 'react';
import Lottie from 'lottie-react';

function DiscordSticker({ stickerId, height = 128, width = 128 }) {
  const [animationData, setAnimationData] = useState(null);
  const [inView, setInView] = useState(false); // Track if sticker is visible
  const stickerRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect(); // Stop observing once in view
        }
      },
      { threshold: 0.2 } // Trigger when 20% of the component is visible
    );

    if (stickerRef.current) observer.observe(stickerRef.current);

    return () => {
      if (stickerRef.current) observer.unobserve(stickerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!inView || !stickerId) return;

    async function fetchStickerJSON() {
      try {
        const response = await window.electronAPI.discord.getStickerById(stickerId);
        console.log('sticker res', response);
        if (!response.success) throw new Error('Failed to fetch sticker JSON');
        const jsonData = await response.data;
        setAnimationData(jsonData);
      } catch (error) {
        console.error('Error loading sticker animation:', error);
      }
    }

    fetchStickerJSON();
  }, [inView, stickerId]);

  return (
    <div ref={stickerRef} style={{ width, height }}>
      {!animationData ? (
        <div className="text-gray-400 text-sm flex justify-center items-center h-full">
          Loading sticker...
        </div>
      ) : (
        <Lottie animationData={animationData} loop={true} />
      )}
    </div>
  );
}

export default DiscordSticker;

// import React, { useEffect, useState } from 'react';
// import Lottie from 'lottie-react';

// function DiscordSticker({stickerId, height=128, width=128}) {
//   const [animationData, setAnimationData] = useState(null);

//   useEffect(() => {
//     async function fetchStickerJSON() {
//       try {
//         const response = await window.electronAPI.discord.getStickerById(stickerId)
//         console.log('sticker res', response)
//         if (!response.success) throw new Error('Failed to fetch sticker JSON');
//         const jsonData = await response.data;
//         setAnimationData(jsonData);
//       } catch (error) {
//         console.error('Error loading sticker animation:', error);
//       }
//     }

//     fetchStickerJSON();
//   }, [stickerId]);

//   if (!animationData) return <div>Loading sticker...</div>;

//   return (
//     <div style={{width: width, height: height}}>
//       <Lottie animationData={animationData} loop={true} />
//     </div>
//   );
// }

// export default DiscordSticker;
