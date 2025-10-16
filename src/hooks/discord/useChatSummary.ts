import { useState } from "react";

const baseURL = import.meta.env.VITE_BACKEND_URL as string;
const apiURL = `${baseURL}/api`;

export const useChatsSummary = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  const generateChatSummary = async (
    chatId: string,
    messages: { text: string; timestamp: string; sender: string }[],
    chat_title?: string,
    minutes?: number
  ) => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("No access token found");

      const bodyParams = new URLSearchParams();
      bodyParams.append("messages", JSON.stringify(messages));
      if (chat_title) bodyParams.append("chat_title", chat_title);
      if (minutes) bodyParams.append("minutes", minutes.toString());

      const res = await fetch(`${apiURL}/discord/chats/${chatId}/summary`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Bearer ${token}`,
        },
        body: bodyParams.toString(),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to generate chat summary");
      }

      const result = await res.json();
      setData(result);
      return result;
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { generateChatSummary, loading, error, data };
};