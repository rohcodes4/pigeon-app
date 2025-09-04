import React, { useState, useEffect } from "react";
import { Bell, Check, ChevronDown, ChevronRight, Heart, MoreHorizontal, Pin, PinOff, Plus, SmilePlus, VolumeX, X } from "lucide-react";
import { FaTelegramPlane, FaDiscord } from "react-icons/fa";
import discord from "@/assets/images/discord.png";
import telegram from "@/assets/images/telegram.png";
import smartIcon from "@/assets/images/sidebar/Chat.png";
import ChatAvatar from "./ChatAvatar";

// API function to fetch notifications
const fetchNotifications = async (limit: number = 20) => {
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  const token = localStorage.getItem("access_token");

  const response = await fetch(`${BACKEND_URL}/notifications?limit=${limit}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch notifications: ${response.status}`);
  }

  return response.json();
};

// API function to clear notifications
const clearNotifications = async () => {
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  const token = localStorage.getItem("access_token");

  const response = await fetch(`${BACKEND_URL}/notifications/clear`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to clear notifications: ${response.status}`);
  }

  return response.json();
};

const NotificationPanel = () => {
  const [openChannel, setOpenChannel] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [groupedNotifications, setGroupedNotifications] = useState<{[key: string]: any[]}>({});
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  // Load notifications on component mount
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await fetchNotifications(50);
        setNotifications(data);
        console.log('Loaded notifications:', data);
        
        // Group notifications by chat_id
        const grouped = data.reduce((acc: {[key: string]: any[]}, notification: any) => {
          const chatId = notification.chat_id?.toString() || 'general';
          if (!acc[chatId]) {
            acc[chatId] = [];
          }
          acc[chatId].push(notification);
          return acc;
        }, {});
        
        setGroupedNotifications(grouped);
        
        // Set first channel as open by default
        const firstChannel = Object.keys(grouped)[0];
        if (firstChannel) {
          setOpenChannel(firstChannel);
        }
      } catch (error) {
        console.error('Error loading notifications:', error);
        setError(error instanceof Error ? error.message : 'Failed to load notifications');
      } finally {
        setIsLoading(false);
      }
    };

    loadNotifications();
  }, []);

  const toggleChannel = (channel: string) => {
    setOpenChannel(openChannel === channel ? null : channel);
  };

  const removeNotification = async (notificationId: string) => {
    try {
      // Remove from local state immediately for better UX
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
      
      // Update grouped notifications
      const newGrouped = {...groupedNotifications};
      Object.keys(newGrouped).forEach(chatId => {
        newGrouped[chatId] = newGrouped[chatId].filter(n => n._id !== notificationId);
        if (newGrouped[chatId].length === 0) {
          delete newGrouped[chatId];
        }
      });
      setGroupedNotifications(newGrouped);
      
      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
      const token = localStorage.getItem("access_token");
    
      const response = await fetch(`${BACKEND_URL}/notifications/${notificationId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
    
      if (!response.ok) {
        throw new Error(`Failed to delete notifications: ${response.status}`);
      }
    
      return response.json();
      
      console.log('Notification removed:', notificationId);
    } catch (error) {
      console.error('Error removing notification:', error);
    }
  };

  const handleClearAllNotifications = async () => {
    if (!confirm('Are you sure you want to clear all notifications?')) {
      return;
    }
    
    try {
      await clearNotifications();
      setNotifications([]);
      setGroupedNotifications({});
      setOpenChannel(null);
      console.log('All notifications cleared');
    } catch (error) {
      console.error('Error clearing notifications:', error);
      alert('Failed to clear notifications. Please try again.');
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
    
    // You can customize this to show actual chat names
    const notifications = groupedNotifications[chatId];
    if (notifications && notifications.length > 0) {
      // Try to get chat title from notification data
      return notifications[0].chat_name || `Chat ${chatId}`;
    }
    return `Channel ${chatId}`;
  };

  const getPlatformFromChatId = (chatId: string) => {
    // Simple heuristic - you might want to store this info in notifications
    // return Math.random() > 0.5 ? 'telegram' : 'discord';
    return 'telegram'
  };

  const renderNotifications = (notifications: any[], channelKey: string) => {
    if (!notifications || notifications.length <= 0) return null;
    console.log(notifications)
    return notifications.map((notification) => (
      <div key={notification._id} className="relative flex items-start gap-2 mb-2 bg-[#212121] p-2 rounded-[10px] border border-[#ffffff09]">
        <div className="absolute top-2 right-2 cursor-pointer" onClick={() => removeNotification(notification._id)}>
          <X className="w-4 h-4 text-[#fafafa60] hover:text-[#fafafa]" />
        </div>
        <div className="flex-shrink-0 w-8 flex items-center justify-center">
          <ChatAvatar name={notification.name} avatar={`${BACKEND_URL}/contact_photo/${notification.chat_id}`} backupAvatar={`${BACKEND_URL}/chat_photo/${notification.chat_id}`} />
        </div>
        <div className="grow rounded-[8px] px-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#fafafa] font-medium">
              {notification.type === 'summary' ? 'Summary' : 'Notification'}
            </span>
            <span className="text-xs text-[#FAFAFA60]">
              {formatDate(notification.created_at)}
            </span>
            {notification.importance && (
              <span className="text-xs bg-[#3474ff] text-white px-2 py-0.5 rounded-full">
                {(notification.importance * 100).toFixed(0)}%
              </span>
            )}
          </div>
          <div className="text-sm text-[#fafafa] break-words w-full">
            {notification.text}
          </div>
          <div className="flex space-x-2 mt-2">
            <span className="text-xs rounded-full bg-[#ffffff16] px-2 py-1">
              💡 {notification.type}
            </span>
            {notification.chat_name && (
              <span className="text-xs rounded-full bg-[#ffffff16] px-2 py-1">
                📱 {notification.chat_name}
              </span>
            )}
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
          <Bell className="w-4 h-4 fill-[#84AFFF]" />
          <span>Notifications</span>
        </div>
        <div className="flex items-center justify-center h-full">
          <div className="text-[#fafafa60]">Loading notifications...</div>
        </div>
      </aside>
    );
  }

  if (error) {
    return (
      <aside className="h-[calc(100vh-72px)] overflow-y-scroll overflow-x-hidden min-w-[400px] 2xl:min-w-[500px] bg-[#111111] text-white rounded-2xl flex flex-col shadow-lg border border-[#23242a]">
        <div className="text-[#84AFFF] flex items-center gap-2 p-4">
          <Bell className="w-4 h-4 fill-[#84AFFF]" />
          <span>Notifications</span>
        </div>
        <div className="flex items-center justify-center h-full">
          <div className="text-red-400">Error: {error}</div>
        </div>
      </aside>
    );
  }
  console.log('notificationss')
  console.log(notifications)
  return (
    <aside className="h-[calc(100vh-72px)] overflow-y-scroll overflow-x-hidden max-w-[501px] min-w-[400px] 2xl:min-w-[500px] bg-[#111111] text-white rounded-2xl flex flex-col shadow-lg border border-[#23242a]">
      <div className="text-[#84AFFF] flex items-center justify-between gap-2 p-4">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 fill-[#84AFFF]" />
          <span>Notifications ({notifications.length})</span>
        </div>
        {notifications.length > 0 && (
          <button
            onClick={handleClearAllNotifications}
            className="text-xs text-[#fafafa60] hover:text-[#fafafa] px-2 py-1 rounded bg-[#ffffff10] hover:bg-[#ffffff20]"
          >
            Clear All
          </button>
        )}
      </div>
      
      {Object.keys(groupedNotifications).length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-[#fafafa60] text-center">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <div>No notifications yet</div>
          </div>
        </div>
      ) : (
        Object.keys(groupedNotifications).map((channelKey) => (
          <div key={channelKey} className="mb-2 px-4">
            <div className="flex justify-between items-center gap-2 mb-2 cursor-pointer">
              <div className="flex items-center gap-2" onClick={() => toggleChannel(channelKey)}>
                {openChannel === channelKey ? <ChevronDown className="text-[#fafafa]" /> : <ChevronRight className="text-[#fafafa]" />}
                <div className="relative mr-2">
                  {/* <img
                    src={`https://www.gravatar.com/avatar/${channelKey}?d=identicon&s=80`}
                    className="w-10 h-10 rounded-full object-cover"
                  /> */}
            <ChatAvatar name={getChannelName(channelKey)} avatar={`${BACKEND_URL}/chat_photo/${channelKey}`} backupAvatar={`${BACKEND_URL}/contact_photo/${channelKey}`}/>

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
                  {getChannelName(channelKey)} ({groupedNotifications[channelKey].length})
                </span>
              </div>
              <div className="flex gap-2">
                <div className="bg-[#fafafa10] p-2 rounded-[6px]">
                  <Check className="w-3 h-3 fill-[#fafafa60]" />
                </div>
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
                      <button className="flex gap-2 items-center justify-start rounded-[10px] px-4 py-2 text-left hover:bg-[#23272f] text-[#ffffff72] hover:text-white whitespace-nowrap">
                        <Pin className="w-6 h-6" stroke="currentColor" fill="currentColor"/>                        
                        Pin Message
                      </button>
                      <button className="flex gap-2 items-center justify-start rounded-[10px] px-4 py-2 text-left hover:bg-[#23272f] text-[#ffffff72] hover:text-white whitespace-nowrap">
                        <Plus className="w-6 h-6" stroke="currentColor" fill="currentColor"/>                        
                        Add Tags
                      </button>
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
                {renderNotifications(groupedNotifications[channelKey], channelKey)}
              </div>
            )}
          </div>
        ))
      )}
    </aside>
  );
};

export default NotificationPanel;