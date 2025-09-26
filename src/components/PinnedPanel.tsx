import React, { useState, useEffect } from "react";
import { Bell, ChevronDown, ChevronRight, Heart, MoreHorizontal, Pin, PinOff, Plus, SmilePlus, VolumeX, X } from "lucide-react";
import { FaTelegramPlane, FaDiscord } from "react-icons/fa";
import discord from "@/assets/images/discord.png";
import telegram from "@/assets/images/telegram.png";
import smartIcon from "@/assets/images/sidebar/Chat.png";

// API function to fetch pinned messages using /pins endpoint
const fetchPinnedMessages = async () => {
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  const token = localStorage.getItem("access_token");

  const response = await fetch(`${BACKEND_URL}/pins`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch pins: ${response.status}`);
  }

  return response.json();
};

// API function to unpin a message using /pins/{pin_id} endpoint
const unpinMessage = async (pinId: string) => {
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  const token = localStorage.getItem("access_token");

  const response = await fetch(`${BACKEND_URL}/pins/${pinId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to unpin message: ${response.status}`);
  }

  return response.json();
};

// API function to pin a message using /pins endpoint
const pinMessage = async (messageId: string) => {
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  const token = localStorage.getItem("access_token");

  const formData = new FormData();
  formData.append('message_id', messageId);

  const response = await fetch(`${BACKEND_URL}/pins`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to pin message: ${response.status}`);
  }

  return response.json();
};

const PinnedPanel = () => {
  const [openChannel, setOpenChannel] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [pinnedMessages, setPinnedMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [groupedPins, setGroupedPins] = useState<{[key: string]: any[]}>({});

  // Load pinned messages on component mount
  useEffect(() => {
    const loadPinnedMessages = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await fetchPinnedMessages();
        setPinnedMessages(data);
        console.log('Loaded pinned messages:', data);
        
        // Group pinned messages by chat_id
        const grouped = data.reduce((acc: {[key: string]: any[]}, pin: any) => {
          const chatId = pin.chat_id?.toString() || 'general';
          if (!acc[chatId]) {
            acc[chatId] = [];
          }
          acc[chatId].push(pin);
          return acc;
        }, {});
        
        setGroupedPins(grouped);
        
        // Set first channel as open by default
        const firstChannel = Object.keys(grouped)[0];
        if (firstChannel) {
          setOpenChannel(firstChannel);
        }
      } catch (error) {
        console.error('Error loading pinned messages:', error);
        setError(error instanceof Error ? error.message : 'Failed to load pinned messages');
      } finally {
        setIsLoading(false);
      }
    };

    loadPinnedMessages();
  }, []);

  const toggleChannel = (channel: string) => {
    setOpenChannel(openChannel === channel ? null : channel);
  };

  const handleUnpinMessage = async (pinId: string) => {
    try {
      console.log('Unpinning message with pin ID:', pinId);
      await unpinMessage(pinId);
      
      // Remove from local state using pin.id (not pin._id)
      setPinnedMessages(prev => prev.filter(pin => pin.id !== pinId));
      
      // Update grouped pins
      const newGrouped = {...groupedPins};
      Object.keys(newGrouped).forEach(chatId => {
        newGrouped[chatId] = newGrouped[chatId].filter(pin => pin.id !== pinId);
        if (newGrouped[chatId].length === 0) {
          delete newGrouped[chatId];
        }
      });
      setGroupedPins(newGrouped);
      
      console.log('Message unpinned successfully');
    } catch (error) {
      console.error('Error unpinning message:', error);
      alert('Failed to unpin message. Please try again.');
    }
  };

  const handleUnpinAllInChannel = async (channelKey: string) => {
    try {
      const pinsInChannel = groupedPins[channelKey] || [];
      
      // Unpin all messages in this channel
      await Promise.all(pinsInChannel.map(pin => unpinMessage(pin.id)));
      
      // Remove all pins for this channel from local state
      setPinnedMessages(prev => prev.filter(pin => pin.chat_id?.toString() !== channelKey));
      
      // Remove channel from grouped pins
      const newGrouped = {...groupedPins};
      delete newGrouped[channelKey];
      setGroupedPins(newGrouped);
      
      // Close menu
      setOpenMenuId(null);
      
      console.log(`All messages unpinned from channel ${channelKey}`);
    } catch (error) {
      console.error('Error unpinning all messages:', error);
      alert('Failed to unpin all messages. Please try again.');
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const getChannelName = (chatId: string) => {
    // Get chat name from first pinned message in that chat
    const pins = groupedPins[chatId];
    if (pins && pins.length > 0) {
      return `Chat ${chatId}`;
    }
    return `Channel ${chatId}`;
  };

  const getPlatformFromChatId = (chatId: string) => {
    // Simple heuristic - you might want to store this info in pins
    // return Math.random() > 0.5 ? 'telegram' : 'discord';
    return 'telegram';
  };

const renderPinnedMessages = (pins: any[], channelKey: string) => {
  if (!pins || pins.length <= 0) return null;
       
  return pins.map((pin) => (
    <div 
      key={pin.id} 
      className="relative flex items-start gap-2 mb-2 bg-[#212121] p-2 rounded-[10px] border border-[#ffffff09]"
    >
      <div 
        className="absolute top-2 right-2 cursor-pointer" 
        onClick={() => handleUnpinMessage(pin.id)}
      >
        <X className="w-4 h-4 text-[#fafafa60] hover:text-[#fafafa]" />
      </div>
      
      <div className="flex-shrink-0 w-8 flex items-center justify-center">
        <img
          src={`https://www.gravatar.com/avatar/${pin.message_id || 'default'}?d=identicon&s=80`}
          className="w-7 h-7 rounded-full object-cover"
        />
      </div>
      
      {/* Fixed: Added min-w-0 and proper text constraints */}
      <div className="flex-1 min-w-0 rounded-[8px] px-2">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm text-[#fafafa] font-medium">
            Pinned Message
          </span>
          <span className="text-xs text-[#FAFAFA60]">
            {formatDate(pin.created_at)}
          </span>
          <Pin className="w-3 h-3 text-[#84AFFF] fill-[#84AFFF]" />
        </div>
        
        {/* Fixed: Proper text wrapping with overflow handling */}
        <div className="text-sm text-[#fafafa] break-words overflow-wrap-anywhere hyphens-auto mb-2">
   {pin.text}
        </div>
        
        <div className="flex flex-wrap gap-1 mt-2">
          <span className="text-xs rounded-full bg-[#ffffff16] px-2 py-1">
            📌 Pinned
          </span>
          <span className="text-xs rounded-full bg-[#ffffff16] px-2 py-1">
            💬 {pin.chat_id}
          </span>
          <span className="text-xs rounded-full bg-[#ffffff16] px-1 py-1 flex items-center">
            <SmilePlus className="w-3 h-3" />
          </span>
        </div>
      </div>
    </div>
  ));
};

  if (isLoading) {
    return (
      <aside className="h-[calc(100vh-72px)] overflow-y-scroll overflow-x-hidden min-w-[400px] 2xl:min-w-[500px] bg-[#111111] text-white rounded-2xl flex flex-col shadow-lg border border-[#23242a]">
        <div className="text-[#84AFFF] flex items-center gap-2 p-4">
          <Pin className="w-4 h-4 fill-[#84AFFF]" />
          <span>Pinned Messages</span>
        </div>
        <div className="flex items-center justify-center h-full">
          <div className="text-[#fafafa60]">Loading pinned messages...</div>
        </div>
      </aside>
    );
  }

  if (error) {
    return (
      <aside className="h-[calc(100vh-72px)] overflow-y-scroll overflow-x-hidden bg-[#111111] text-white rounded-2xl flex flex-col shadow-lg border border-[#23242a]">
        <div className="text-[#84AFFF] flex items-center gap-2 p-4">
          <Pin className="w-4 h-4 fill-[#84AFFF]" />
          <span>Pinned Messages</span>
        </div>
        <div className="flex items-center justify-center h-full">
          <div className="text-red-400">Error: {error}</div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="h-[calc(100vh-72px)] overflow-y-scroll overflow-x-hidden min-w-[400px] w-[200px] bg-[#111111] 2xl:max-w-[600px] text-white flex flex-col shadow-lg border border-[#23242a]">
      <div className="text-[#84AFFF] flex items-center justify-between gap-2 p-4">
        <div className="flex items-center gap-2">
          <Pin className="w-4 h-4 fill-[#84AFFF]" />
          <span>Pinned Messages ({pinnedMessages.length})</span>
        </div>
      </div>
      
      {Object.keys(groupedPins).length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-[#fafafa60] text-center">
            <Pin className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <div>No pinned messages yet</div>
            <div className="text-xs mt-1">Pin important messages to save them here</div>
          </div>
        </div>
      ) : (
        Object.keys(groupedPins).map((channelKey) => (
          <div key={channelKey} className="mb-2 px-4">
            <div className="flex justify-between items-center gap-2 mb-2 cursor-pointer">
              <div className="flex items-center gap-2" onClick={() => toggleChannel(channelKey)}>
                {openChannel === channelKey ? <ChevronDown className="text-[#fafafa]" /> : <ChevronRight className="text-[#fafafa]" />}
                <div className="relative mr-2">
                  <img
                    src={`https://www.gravatar.com/avatar/${channelKey}?d=identicon&s=80`}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <img
                    src={getPlatformFromChatId(channelKey) === "discord" ? discord : telegram}
                    className={`
                      absolute -bottom-2 -right-1
                      ${getPlatformFromChatId(channelKey) === "discord" ? "bg-[#7b5cfa]" : "bg-[#3474ff]"}
                      rounded-[4px] w-5 h-5 p-0.5 border-2 border-[#111111]
                    `}
                    alt={getPlatformFromChatId(channelKey)}
                  />
                </div>
                <span className="text-sm text-[#fafafa] leading-none">
                  {getChannelName(channelKey)} ({groupedPins[channelKey].length})
                </span>
              </div>
              <div className="flex gap-2">
                <div className="bg-[#fafafa10] p-2 rounded-[6px]">
                  <PinOff className="w-3 h-3 fill-[#fafafa60]" />
                </div>
                <div className="bg-[#fafafa10] p-2 rounded-[6px] relative" onClick={() => {setOpenMenuId(openMenuId === channelKey ? null : channelKey);}}>
                  <MoreHorizontal className="w-3 h-3 fill-[#fafafa60] z-50" />
                  {openMenuId === channelKey && (
                    <div className="absolute right-0 top-[30px] mt-2 bg-[#111111] border border-[#ffffff12] rounded-[10px] shadow-lg z-50 flex flex-col p-2 min-w-max">
                      <button className="flex gap-2 items-center justify-start rounded-[10px] px-4 py-2 text-left hover:bg-[#23272f] text-[#ffffff72] hover:text-white whitespace-nowrap">
                        <img src={smartIcon} className="w-6 h-6"/>
                        Add to Smart Channels
                      </button>
                      <button className="flex gap-2 items-center justify-start rounded-[10px] px-4 py-2 text-left hover:bg-[#23272f] text-[#ffffff72] hover:text-white whitespace-nowrap">
                        <Heart className="w-6 h-6" stroke="currentColor" fill="currentColor"/>
                        Save to Favorites
                      </button>
                      <button 
                        className="flex gap-2 items-center justify-start rounded-[10px] px-4 py-2 text-left hover:bg-[#23272f] text-[#ffffff72] hover:text-white whitespace-nowrap"
                        onClick={() => handleUnpinAllInChannel(channelKey)}
                      >
                        <Pin className="w-6 h-6" stroke="currentColor" fill="currentColor"/>                        
                        Unpin All Messages
                      </button>
                      {/* <button className="flex gap-2 items-center justify-start rounded-[10px] px-4 py-2 text-left hover:bg-[#23272f] text-[#ffffff72] hover:text-white whitespace-nowrap">
                        <Plus className="w-6 h-6" stroke="currentColor" fill="currentColor"/>                        
                        Add Tags
                      </button> */}
                      <button className="flex gap-2 items-center justify-start rounded-[10px] px-4 py-2 text-left hover:bg-[#23272f] text-[#f36363] hover:text-[#f36363] whitespace-nowrap">
                        <VolumeX className="w-6 h-6" stroke="currentColor" fill="currentColor"/>                        
                        Mute Channel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {openChannel === channelKey && (
              <div className="px-0 py-2 rounded-[16px]">
                {renderPinnedMessages(groupedPins[channelKey], channelKey)}
              </div>
            )}
          </div>
        ))
      )}
    </aside>
  );
};

export default PinnedPanel;