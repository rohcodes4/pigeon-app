import React, { useEffect, useMemo, useState } from "react";
import { ChevronLeft, Plus, X, GripVertical } from "lucide-react";
import FilterEditor from "./FilterEditor";

type SmartFilter = {
  id: string;
  name: string;
  channels: number[];
  keywords?: string[];
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
  onFiltersUpdated: () => void; // Callback to notify parent of filter changes
}

const FiltersPanel = React.memo(function FiltersPanel({
  onClose,
  loadFilters,
  createFilter,
  updateFilter,
  deleteFilter,
  listChannels,
  topItems,
  onTopItemsReorder,
  onFiltersUpdated,
}: FiltersPanelProps) {
  const [smartFilters, setSmartFilters] = useState<SmartFilter[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editingFilter, setEditingFilter] = useState<SmartFilter | null>(null); // To pass to FilterEditor
  const [allChannels, setAllChannels] = useState<Channel[]>([]);
  const [localTopItems, setLocalTopItems] = useState<string[]>(topItems);

  useEffect(() => {
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
        } else {
          // Fallback: fetch channels directly from backend
          try {
            const BACKEND_URL = (import.meta as any).env.VITE_BACKEND_URL;
            const token = localStorage.getItem("access_token");
            const resp = await fetch(`${BACKEND_URL}/chats`, {
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (resp.ok) {
              const chats = await resp.json();
              const chans = (chats || []).map((c: any) => ({
                id: c?.id ?? c?._id,
                name: c?.title || c?.username || String(c?.id ?? c?._id),
                platform: c?.platform,
              }));
              setAllChannels(chans.filter((c: any) => c.id != null));
            }
          } catch (_) {
            // silent fallback
          }
        }
      } catch (e: any) {
        setError(e?.message || "Failed to load filters");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const unionSmartLabels = useMemo(() => {
    const set = new Set<string>();
    smartFilters.forEach((f) => (f.keywords || []).forEach((k) => set.add(k)));
    return Array.from(set);
  }, [smartFilters]);

  const beginCreate = React.useCallback(() => {
    setEditingFilter(null);
    setShowEditor(true);
  }, []);

  const beginEdit = React.useCallback((f: SmartFilter) => {
    setEditingFilter(f);
    setShowEditor(true);
  }, []);

  const handleEditorSave = async (
    data: { name: string; channels: number[]; keywords: string[] },
    filterId?: string
  ) => {
    try {
      if (filterId) {
        // Update existing filter
        const updatedFilter = await updateFilter(filterId, data);
        setSmartFilters((prev) =>
          prev.map((f) => (f.id === filterId ? updatedFilter : f))
        );
      } else {
        // Create new filter
        const newFilter = await createFilter(data);
        setSmartFilters((prev) => [...prev, newFilter]);
      }
      onFiltersUpdated(); // Notify parent component of changes
    } catch (error) {
      console.error("Error saving filter:", error);
      // You might want to show an error message to the user here
    }
  };

  const handleEditorClose = React.useCallback(() => {
    setShowEditor(false);
    // Don't clear editingFilter immediately to prevent input flicker
    setTimeout(() => setEditingFilter(null), 150);
  }, []);

  const onDelete = async (id: string) => {
    try {
      await deleteFilter(id);
      setSmartFilters((prev) => prev.filter((f) => f.id !== id));
      onFiltersUpdated(); // Notify parent component of changes
    } catch (error) {
      console.error("Error deleting filter:", error);
      // You might want to show an error message to the user here
    }
  };

  return (
    <aside className="h-[calc(100vh-73px)] w-[350px] p-3 pl-0 flex flex-col flex-shrink-0 border-r border-[#23272f] bg-[#111111]">
      <div className="flex items-center mb-2 pb-3 border-b">
        <button className="flex items-center gap-2 ml-2" onClick={onClose}>
          <ChevronLeft className="text-white w-4 h-4" />
          <span className="text-white">Filters</span>
        </button>
        <button className="ml-auto" onClick={beginCreate}>
          <Plus className="text-white w-4 h-4" />
        </button>
      </div>

      <div className="px-3 mb-4">
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

      <div className="px-3 mb-4">
        <div className="flex justify-start items-center gap-4">
          <span className="text-[#ffffff80] text-sm">Filtered Streams</span>
          <button
            onClick={beginCreate}
            className="hover:bg-[#2d2d2d] rounded-full p-1"
          >
            <Plus className="text-white w-4 h-4" />
          </button>
        </div>
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

      <div className="px-3 mb-4">
        <span className="text-[#ffffff80] text-sm">Smart Labels</span>
        <div className="mt-2 flex flex-wrap gap-2">
          {unionSmartLabels.length === 0 ? (
            <div className="text-[#ffffff80] text-xs">No labels</div>
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

      {/* Wrap FilterEditor in useMemo to prevent unnecessary re-renders */}
      {React.useMemo(
        () => (
          <FilterEditor
            show={showEditor}
            onClose={handleEditorClose}
            editingFilter={editingFilter}
            onSave={handleEditorSave}
            allChannels={allChannels}
          />
        ),
        [
          showEditor,
          editingFilter,
          handleEditorClose,
          handleEditorSave,
          allChannels,
        ]
      )}
    </aside>
  );
});

export default FiltersPanel;