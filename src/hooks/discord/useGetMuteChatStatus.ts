import { useState, useEffect, useCallback } from "react";

const url = import.meta.env.VITE_BACKEND_URL as string;
const apiURL = url + "/api";

export function useGetMuteChatStatus(messageId: string) {
  const [isMuted, setIsMuted] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const token = localStorage.getItem("access_token");

  const fetchMuteStatus = useCallback(async () => {
    if (!messageId) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${apiURL}/chats/${messageId}/mute`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.message || "Failed to fetch mute status");
      }

      const data = await res.json();
      setIsMuted(data?.isMuted ?? false);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [messageId, token]);

  useEffect(() => {
    fetchMuteStatus();
  }, [fetchMuteStatus]);

  return { isMuted, loading, error, refetch: fetchMuteStatus };
}
