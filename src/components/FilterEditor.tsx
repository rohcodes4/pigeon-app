import React, { useEffect, useMemo, useState } from "react";
import { X, Search } from "lucide-react";

type SmartFilter = {
  id: string;
  name: string;
  channels: number[];
  keywords: string[];
};

type Channel = { id: number; name: string; platform?: string };

interface FilterEditorProps {
  show: boolean;
  onClose: () => void;
  editingFilter: SmartFilter | null;
  onSave: (
    data: { name: string; channels: number[]; keywords: string[] },
    filterId?: string
  ) => Promise<any>;
  allChannels: Channel[];
}

const FilterEditor: React.FC<FilterEditorProps> = ({
  show,
  onClose,
  editingFilter,
  onSave,
  allChannels,
}) => {
  const [name, setName] = useState("");
  const [keyword, setKeyword] = useState("");
  const [keywords, setKeywords] = useState<string[]>(
    editingFilter?.keywords || []
  );
  const [channelSearch, setChannelSearch] = useState("");
  const [selectedChannels, setSelectedChannels] = useState<Channel[]>(
    editingFilter?.channels?.map((id) => {
      const match = allChannels.find(
        (channel) => String(channel.id) === String(id)
      );
      return match || ({ id: Number(id), name: String(id) } as Channel);
    }) || []
  );

  useEffect(() => {
    if (editingFilter) {
      setName(editingFilter.name || "");
      setKeywords(editingFilter.keywords || []);
      setSelectedChannels(
        editingFilter.channels?.map((id) => {
          const match = allChannels.find(
            (channel) => String(channel.id) === String(id)
          );
          return match || ({ id: Number(id), name: String(id) } as Channel);
        }) || []
      );
    } else {
      setName("");
      setKeywords([]);
      setSelectedChannels([]);
    }
    setKeyword("");
    setChannelSearch("");
  }, [editingFilter, show]); // Re-evaluate when channels load

  const filteredChannels = useMemo(() => {
    if (!channelSearch.trim()) return allChannels;
    const q = channelSearch.toLowerCase();
    return allChannels.filter((c) => (c.name || "").toLowerCase().includes(q));
  }, [allChannels, channelSearch]);

  const addKeyword = () => {
    const v = keyword.trim();
    if (!v) return;
    setKeywords((prev) => Array.from(new Set([...prev, v])));
    setKeyword("");
  };

  const removeKeyword = (v: string) => {
    setKeywords((prev) => prev.filter((k) => k !== v));
  };

  const toggleChannel = (c: Channel) => {
    setSelectedChannels((prev) => {
      const exists = prev.find((x) => x.id === c.id);
      return exists ? prev.filter((x) => x.id !== c.id) : [...prev, c];
    });
  };

  const handleSave = async () => {
    const channelIds = selectedChannels.map((c) => c.id);
    await onSave({ name, channels: channelIds, keywords }, editingFilter?.id);
    onClose(); // Close editor after save
  };

  if (!show) return null;

  return (
    <div className="absolute left-[20%] top-[20%] mt-2 z-50 w-[400px] bg-[#161717] border border-[#fafafa10] rounded-xl shadow-lg p-5">
      <div className="flex items-center justify-between mb-2">
        <div className="text-white text-base font-[200]">
          {editingFilter ? "Edit Filter" : "Create Filtered Stream"}
        </div>
        <button onClick={onClose}>
          <X className="w-4 h-4 text-[#ffffff80]" />
        </button>
      </div>
      <input
        className="w-full bg-[#fafafa10] rounded-[8px] px-3 py-2 mb-3 text-sm text-white outline-none"
        placeholder={editingFilter ? "Edit Filter Name" : "Filter Name"}
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <div className="text-xs text-[#ffffff80] mb-1">Keywords</div>
      <div className="flex items-center gap-2 mb-2">
        <input
          className="flex-1 bg-[#fafafa10] px-3 py-2 text-white outline-none rounded-[8px] text-sm"
          placeholder="Add keyword"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addKeyword()}
        />
        <button className="text-white px-3 py-2" onClick={addKeyword}>
          +
        </button>
      </div>
      {keywords.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {keywords.map((k) => (
            <span
              key={k}
              className="px-2 py-1 rounded-full bg-[#2d2d2d] text-xs text-white flex items-center gap-1"
            >
              {k}
              <button
                onClick={() => removeKeyword(k)}
                className="text-[#ffffff80]"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Select Channels - restored styling and behavior */}
      <div className="text-xs text-[#ffffff80] mb-1">Select Channels</div>
      <div className="flex items-center rounded-[8px]  px-3 py-2 mb-2">
        <Search className="w-4 h-4 text-[#ffffff80] mr-2" />
        <input
          className="flex-1 bg-transparent outline-none text-white text-sm"
          placeholder="Channel Name"
          value={channelSearch}
          onChange={(e) => setChannelSearch(e.target.value)}
        />
        {channelSearch && (
          <button
            className="ml-2 text-[#ffffff80]"
            onClick={() => setChannelSearch("")}
            aria-label="Clear search"
          >
            ×
          </button>
        )}
      </div>

      <div className="max-h-32 overflow-y-auto mb-2">
        {channelSearch.trim() && filteredChannels.length === 0 ? (
          <div className="text-xs text-[#ffffff80] px-3 py-2">
            No results found.
          </div>
        ) : (
          filteredChannels.map((c) => (
            <div
              key={`${c.id}`}
              className="flex items-center gap-2 hover:bg-[#ffffff10] rounded-[10px] px-3 py-2 mb-1 cursor-pointer"
              onClick={() => toggleChannel(c)}
            >
              {/* Platform icons (best-effort from name/platform) */}
              <span className="w-6 h-6 flex items-center justify-center rounded-full bg-[#2d2d2d] text-white text-xs">
                {String(c.name || c.id)
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .slice(0, 2)}
              </span>
              <span className="text-white text-sm">{c.name || c.id}</span>
            </div>
          ))
        )}
      </div>

      {selectedChannels.length > 0 && (
        <div className="mb-2 max-h-32 overflow-y-auto">
          {selectedChannels.map((c) => (
            <div
              key={`${c.id}`}
              className="flex items-center gap-2 bg-[#ffffff10] hover:bg-[#ffffff20] rounded px-3 py-2 mb-1"
            >
              <span className="w-6 h-6 flex items-center justify-center rounded-full bg-[#2d2d2d] text-white text-xs">
                {String(c.name || c.id)
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .slice(0, 2)}
              </span>
              <span className="text-white text-sm">{c.name || c.id}</span>
              <button
                className="ml-auto text-[#ffffff80]"
                onClick={() =>
                  setSelectedChannels((prev) =>
                    prev.filter((x) => x.id !== c.id)
                  )
                }
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-between mt-3">
        <button
          className="text-[#ffffff80] px-4 py-2 rounded hover:bg-[#23262F]"
          onClick={onClose}
        >
          Cancel
        </button>
        <button
          className="bg-[#2563eb] text-white px-8 py-2 rounded hover:bg-[#1d4ed8]"
          onClick={handleSave}
        >
          {editingFilter ? "Update" : "Save"}
        </button>
      </div>
    </div>
  );
};

export default FilterEditor;
