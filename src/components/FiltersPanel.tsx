import React, { useEffect, useMemo, useState } from "react";
import { ChevronLeft, Plus, X, GripVertical } from "lucide-react";

type SmartFilter = {
  id: string;
  name: string;
  channels: number[];
  keywords: string[];
};

type Channel = { id: number; name: string; platform?: string };

interface FiltersPanelProps {
  onClose: () => void;
  loadFilters: () => Promise<SmartFilter[]>;
  createFilter: (data: {
    name: string;
    channels: number[];
    keywords: string[];
  }) => Promise<SmartFilter>;
  updateFilter: (
    filterId: string,
    data: { name?: string; channels?: number[]; keywords?: string[] }
  ) => Promise<SmartFilter>;
  deleteFilter: (filterId: string) => Promise<void>;
  listChannels?: () => Promise<Channel[]>; // Optional backend for channels to replace search over displayChats
  topItems: string[];
  onTopItemsReorder: (newOrder: string[]) => void;
}

const FiltersPanel: React.FC<FiltersPanelProps> = ({
  onClose,
  loadFilters,
  createFilter,
  updateFilter,
  deleteFilter,
  listChannels,
  topItems,
  onTopItemsReorder,
}) => {
  const [smartFilters, setSmartFilters] = useState<SmartFilter[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editing, setEditing] = useState<SmartFilter | null>(null);
  const [name, setName] = useState("");
  const [keyword, setKeyword] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [channelSearch, setChannelSearch] = useState("");
  const [allChannels, setAllChannels] = useState<Channel[]>([]);
  const [selectedChannels, setSelectedChannels] = useState<Channel[]>([]);
  const [localTopItems, setLocalTopItems] = useState<string[]>(topItems);

  useEffect(() => {
    // Initialize localTopItems when topItems prop changes
    setLocalTopItems(topItems);
  }, [topItems]);

  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    index: number
  ) => {
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (
    e: React.DragEvent<HTMLDivElement>,
    dropIndex: number
  ) => {
    const dragIndex = parseInt(e.dataTransfer.getData("text/plain"));
    const newItems = [...localTopItems];
    const [draggedItem] = newItems.splice(dragIndex, 1);
    newItems.splice(dropIndex, 0, draggedItem);
    setLocalTopItems(newItems);
    onTopItemsReorder(newItems);
  };

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const filters = await loadFilters();
        setSmartFilters(filters);
        if (listChannels) {
          try {
            const chans = await listChannels();
            setAllChannels(chans);
          } catch (e) {
            // optional
          }
        }
      } catch (e: any) {
        setError(e?.message || "Failed to load filters");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [loadFilters, listChannels]);

  const filteredChannels = useMemo(() => {
    if (!channelSearch.trim()) return allChannels;
    const q = channelSearch.toLowerCase();
    return allChannels.filter((c) => (c.name || "").toLowerCase().includes(q));
  }, [allChannels, channelSearch]);

  const unionSmartLabels = useMemo(() => {
    const set = new Set<string>();
    smartFilters.forEach((f) => (f.keywords || []).forEach((k) => set.add(k)));
    return Array.from(set);
  }, [smartFilters]);

  const resetEditor = () => {
    setEditing(null);
    setName("");
    setKeyword("");
    setKeywords([]);
    setSelectedChannels([]);
    setChannelSearch("");
  };

  const beginCreate = () => {
    resetEditor();
    setShowEditor(true);
  };
  const beginEdit = (f: SmartFilter) => {
    setEditing(f);
    setName(f.name || "");
    setKeywords(f.keywords || []);
    setSelectedChannels(
      (f.channels || []).map((id) => ({ id, name: String(id) }))
    );
    setShowEditor(true);
  };

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

  const onSave = async () => {
    const channelIds = selectedChannels.map((c) => c.id);
    if (editing) {
      const updated = await updateFilter(editing.id, {
        name,
        channels: channelIds,
        keywords,
      });
      setSmartFilters((prev) =>
        prev.map((f) => (f.id === updated.id ? updated : f))
      );
    } else {
      const created = await createFilter({
        name,
        channels: channelIds,
        keywords,
      });
      setSmartFilters((prev) => [...prev, created]);
    }
    setShowEditor(false);
    resetEditor();
  };

  const onDelete = async (id: string) => {
    await deleteFilter(id);
    setSmartFilters((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <aside className="h-[calc(100vh-73px)] w-[350px] p-3 pl-0 flex flex-col flex-shrink-0 border-r border-[#23272f] bg-[#111111]">
      <div className="flex items-center mb-2 pb-3 border-b">
        <button className="flex items-center gap-2" onClick={onClose}>
          <ChevronLeft className="text-white w-4 h-4" />
          <span className="text-white">Filters</span>
        </button>
        <button className="ml-auto" onClick={beginCreate}>
          <Plus className="text-white w-4 h-4" />
        </button>
      </div>

      <div className="px-2 mb-4">
        <span className="text-[#ffffff80] text-sm">Top Items</span>
        <div className="mt-2">
          {localTopItems.map((item, index) => (
            <div
              key={item}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              className="flex justify-between items-center p-2 hover:bg-[#2d2d2d] rounded-[10px] cursor-grab group"
            >
              <span className="text-white">{item}</span>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical className="w-4 h-4 text-[#fafafa60] cursor-grab" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-2 mb-4">
        <span className="text-[#ffffff80] text-sm">Filtered Streams</span>
        <div className="mt-2">
          {isLoading ? (
            <div className="text-[#ffffff80] text-sm p-2">
              Loading filters...
            </div>
          ) : error ? (
            <div className="text-red-400 text-sm p-2">Error: {error}</div>
          ) : smartFilters.length === 0 ? (
            <div className="text-[#ffffff80] text-sm p-2">
              No filtered streams yet
            </div>
          ) : (
            smartFilters.map((filter) => (
              <div
                key={filter.id}
                className="flex justify-between items-center p-2 hover:bg-[#2d2d2d] rounded cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 flex items-center justify-center rounded-full bg-[#3474ff] text-white text-xs">
                    {filter.name
                      .split(" ")
                      .map((w) => w[0])
                      .join("")
                      .slice(0, 2)}
                  </span>
                  <span className="text-white">{filter.name}</span>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100">
                  <button
                    className="text-xs text-[#84afff] px-2 py-1 rounded"
                    onClick={(e) => {
                      e.stopPropagation();
                      beginEdit(filter);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="text-xs text-red-400 px-2 py-1 rounded"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(filter.id);
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="px-2 mb-4">
        <span className="text-[#ffffff80] text-sm">Smart Labels</span>
        <div className="mt-2 flex flex-wrap gap-2">
          {unionSmartLabels.length === 0 ? (
            <div className="text-[#ffffff80] text-sm">No labels</div>
          ) : (
            unionSmartLabels.map((label) => (
              <div
                key={label}
                className="flex items-center gap-1 text-white text-xs px-2 py-1 rounded-full cursor-default"
              >
                {label}
              </div>
            ))
          )}
        </div>
      </div>

      {showEditor && (
        <div className="absolute left-[20%] top-[20%] mt-2 z-50 w-[400px] bg-[#161717] border border-[#fafafa10] rounded-xl shadow-lg p-5">
          <div className="flex items-center justify-between mb-2">
            <div className="text-white text-base font-[200]">
              {editing ? "Edit Filter" : "Create Filtered Stream"}
            </div>
            <button
              onClick={() => {
                setShowEditor(false);
                resetEditor();
              }}
            >
              <X className="w-4 h-4 text-[#ffffff80]" />
            </button>
          </div>
          <input
            className="w-full bg-[#fafafa10] rounded-[8px] px-3 py-2 mb-3 text-sm text-white outline-none"
            placeholder={editing ? "Edit Filter Name" : "Filter Name"}
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
          <div className="max-h-40 overflow-y-auto mb-2">
            {filteredChannels.map((c) => {
              const checked = !!selectedChannels.find((x) => x.id === c.id);
              return (
                <label
                  key={c.id}
                  className="flex items-center gap-2 px-2 py-1 hover:bg-[#ffffff10] rounded"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleChannel(c)}
                  />
                  <span className="text-white text-sm">{c.name || c.id}</span>
                </label>
              );
            })}
          </div>
          <div className="flex justify-between mt-3">
            <button
              className="text-[#ffffff80] px-4 py-2 rounded hover:bg-[#23262F]"
              onClick={() => {
                setShowEditor(false);
                resetEditor();
              }}
            >
              Cancel
            </button>
            <button
              className="bg-[#2563eb] text-white px-8 py-2 rounded hover:bg-[#1d4ed8]"
              onClick={onSave}
            >
              {editing ? "Update" : "Save"}
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};

export default FiltersPanel;
