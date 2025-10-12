import React, { useEffect, useState } from "react";

const Sticker = ({ mediaItem, openMedia }) => {
  const [svgContent, setSvgContent] = useState<string | null>(null);

  useEffect(() => {
    const fetchSvg = async () => {
      try {
        const res = await fetch(`https://discord.com/stickers/${mediaItem.id}.json`);
        const json = await res.json();

        // Assuming json contains SVG markup as a string or in a known property
        // Adjust based on actual JSON structure
        const svg = json.svg || json.data?.svg || JSON.stringify(json);

        setSvgContent(svg);
      } catch (e) {
        setSvgContent(null);
      }
    };
    fetchSvg();
  }, [mediaItem.id]);

  if (!svgContent) return null;

  return (
    <div
      style={{ maxWidth: 320, cursor: "pointer" }}
      onClick={() => openMedia(mediaItem)}
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
};

export default Sticker;