import React, { useEffect, useState } from "react";

function LinkPreview({ url }: { url: string }) {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!url) return;
    fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}`)
      .then(res => res.json())
      .then(res => setData(res.data))
      .catch(() => setData(null));
  }, [url]);

  if (!url) return null;
  if (!data) return <div className="text-xs text-gray-400">Loading preview…</div>;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-[#212121] rounded-lg p-3 p-6 rounded-[8px] border-2 border-l-[#7b5cfa] hover:bg-[#23242a] transition"
    >
      
      <div className="font-semibold text-gray-100 mb-1 text-xs">{data.title}</div>
      <div className="text-xs text-gray-400 mb-2">{data.description}</div>
      <div className="text-xs text-blue-400">{data.url}</div>
      {data.image && (
        <img src={data.image.url} alt={data.title} className="w-full h-48 object-contain p-4 rounded mb-2" />
      )}
    </a>
  );
}

export default LinkPreview;