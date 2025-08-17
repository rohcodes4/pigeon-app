// API Helper Functions for ChatPilot Frontend
// Use these functions to interact with the backend endpoints

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

// Get auth token from localStorage
const getAuthToken = () => localStorage.getItem("access_token");

// Helper for authenticated requests
const authFetch = async (url: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  const headers = {
    Authorization: `Bearer ${token}`,
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response;
};

// 1. Search Tasks/Reminders/Favorites
export const searchTasks = async (params: {
  search?: string;
  status?: string;
  priority?: string;
  tags?: string;
  chat_id?: number;
}) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      searchParams.append(key, value.toString());
    }
  });

  const response = await authFetch(`${BACKEND_URL}/tasks?${searchParams}`);
  return response.json();
};

export const searchBookmarks = async (params: {
  search?: string;
  type?: string;
  chat_id?: number;
}) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      searchParams.append(key, value.toString());
    }
  });

  const response = await authFetch(`${BACKEND_URL}/bookmarks?${searchParams}`);
  return response.json();
};

// 2. Search by Platform
export const searchMessages = async (params: {
  keyword: string;
  platform?: "telegram" | "discord";
  date_from?: string;
  date_to?: string;
  limit?: number;
}) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      searchParams.append(key, value.toString());
    }
  });

  const response = await authFetch(`${BACKEND_URL}/search?${searchParams}`);
  return response.json();
};

export const searchByPlatform = async (
  platform: "telegram" | "discord",
  keyword?: string,
  limit?: number
) => {
  const searchParams = new URLSearchParams();
  if (keyword) searchParams.append("keyword", keyword);
  if (limit) searchParams.append("limit", limit.toString());

  const response = await authFetch(
    `${BACKEND_URL}/search/platform/${platform}?${searchParams}`
  );
  return response.json();
};

// 3. Send Messages
export const sendMessage = async (
  chatId: number,
  text: string,
  replyTo?: number
) => {
  const formData = new FormData();
  formData.append("text", text);
  if (replyTo) {
    formData.append("reply_to", replyTo.toString());
  }

  const response = await authFetch(`${BACKEND_URL}/chats/${chatId}/send`, {
    method: "POST",
    body: formData,
  });

  return response.json();
};

// 4. Send Reactions
export const sendReaction = async (
  messageId: string,
  reaction: string,
  options?: { clear?: boolean }
) => {
  const formData = new FormData();
  formData.append("reaction", reaction);
  if (options?.clear) {
    formData.append("clear", "true");
  }

  const response = await authFetch(
    `${BACKEND_URL}/api/messages/${messageId}/reactions`,
    {
      method: "POST",
      body: formData,
    }
  );

  return response.json();
};

// Fetch a single message (with updated reactions after a send)
export const getMessageById = async (messageId: string) => {
  const response = await authFetch(`${BACKEND_URL}/api/messages/${messageId}`);
  return response.json();
};

// 5. Media Handling
export const getChatMedia = async (
  chatId: number,
  limit?: number,
  before?: string
) => {
  const searchParams = new URLSearchParams();
  if (limit) searchParams.append("limit", limit.toString());
  if (before) searchParams.append("before", before);

  const response = await authFetch(
    `${BACKEND_URL}/api/chats/${chatId}/media?${searchParams}`
  );
  return response.json();
};

export const downloadMessageMedia = async (
  messageId: string
): Promise<Blob> => {
  const response = await authFetch(
    `${BACKEND_URL}/api/messages/${messageId}/media`,
    {
      method: "POST",
    }
  );

  return response.blob();
};

export const sendMediaToChat = async (
  chatId: number,
  file: File,
  caption?: string
) => {
  const formData = new FormData();
  formData.append("file", file);
  if (caption) formData.append("caption", caption);
  formData.append("file_name", file.name);

  const response = await authFetch(
    `${BACKEND_URL}/api/chats/${chatId}/send_media`,
    {
      method: "POST",
      body: formData,
    }
  );

  return response.json();
};

// 6. Example Usage Functions for Components

// Example: Search component
export const handleTaskSearch = async (searchTerm: string, filters: any) => {
  try {
    const results = await searchTasks({
      search: searchTerm,
      status: filters.status,
      tags: filters.tags?.join(","),
    });
    return results;
  } catch (error) {
    console.error("Task search failed:", error);
    throw error;
  }
};

// Example: Platform filter component
export const handlePlatformFilter = async (
  platform: "telegram" | "discord",
  keyword?: string
) => {
  try {
    const results = await searchByPlatform(platform, keyword, 50);
    return results;
  } catch (error) {
    console.error("Platform search failed:", error);
    throw error;
  }
};

// Example: Reaction component
export const handleReactionClick = async (messageId: string, emoji: string) => {
  try {
    const result = await sendReaction(messageId, emoji);
    console.log("Reaction sent:", result);
    return result;
  } catch (error) {
    console.error("Failed to send reaction:", error);
    throw error;
  }
};

// Example: Media upload component
export const handleFileUpload = async (
  chatId: number,
  file: File,
  caption?: string
) => {
  try {
    const result = await sendMediaToChat(chatId, file, caption);
    console.log("File sent:", result);
    return result;
  } catch (error) {
    console.error("Failed to send file:", error);
    throw error;
  }
};

// Example: Media download component
export const handleMediaDownload = async (
  messageId: string,
  fileName: string
) => {
  try {
    const blob = await downloadMessageMedia(messageId);

    // Create download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log("Media downloaded:", fileName);
  } catch (error) {
    console.error("Failed to download media:", error);
    throw error;
  }
};

// Export all functions
export default {
  searchTasks,
  searchBookmarks,
  searchMessages,
  searchByPlatform,
  sendMessage,
  sendReaction,
  getMessageById,
  getChatMedia,
  downloadMessageMedia,
  sendMediaToChat,
  handleTaskSearch,
  handlePlatformFilter,
  handleReactionClick,
  handleFileUpload,
  handleMediaDownload,
};
