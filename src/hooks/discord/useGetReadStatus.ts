import { useState } from "react";

const url = import.meta.env.VITE_BACKEND_URL as string;
const apiURL = `${url}/api`;

export function useGetReadStatus() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const markChatRead = async (chatId: string, platform: "discord" | "tg") => {
    if (!chatId || !platform) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    const token = localStorage.getItem("access_token");

    try {
      const res = await fetch(`${apiURL}/chats/${chatId}/read?platform=${platform}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Failed to mark chat as read");
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return { markChatRead, loading, error, success };
}
