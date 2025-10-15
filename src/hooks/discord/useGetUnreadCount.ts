import { useState, useEffect, useCallback } from "react";

const url = import.meta.env.VITE_BACKEND_URL as string;
const apiURL = url + "/api";

export function useGetUnreadCount(platform: "discord" | "tg") {
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const token = localStorage.getItem("access_token");

  const fetchUnreadCount = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${apiURL}/unread-counts?platform=${platform}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.message || "Failed to fetch unread count");
      }

      const data = await res.json();
      setCount(data?.count ?? 0);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [platform, token]);

  // Fetch once when hook loads
  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  return { count, loading, error, refetch: fetchUnreadCount };
}