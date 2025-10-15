import { useState, useEffect, useCallback } from "react";

const url = import.meta.env.VITE_BACKEND_URL as string;
const apiURL = `${url}/api`;

export function useGetMuteChatStatus(chatId: string) {
  const [isMuted, setIsMuted] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const token = localStorage.getItem("access_token");

  const fetchMuteStatus = useCallback(async () => {
    if (!chatId) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${apiURL}/chats/${chatId}/mute`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data?.message || "Failed to fetch mute status");

      setIsMuted(data?.isMuted ?? false);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [chatId, token]);

  useEffect(() => {
    fetchMuteStatus();
  }, [fetchMuteStatus]);

  return { isMuted, loading, error, refetch: fetchMuteStatus };
}
