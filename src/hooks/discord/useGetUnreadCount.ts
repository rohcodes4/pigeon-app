import { useState, useEffect, useCallback } from "react";

const url = import.meta.env.VITE_BACKEND_URL as string;
const apiURL = `${url}/api`;

export function useGetUnreadCount(platform: "discord" | "tg") {
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUnreadCount = useCallback(async () => {
    if (!platform) return;

    setLoading(true);
    setError(null);

    const token = localStorage.getItem("access_token");

    try {
      const res = await fetch(`${apiURL}/unread-counts?platform=${platform}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Failed to fetch unread count");
      }

      setCount(data?.count ?? 0);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [platform]);

  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  return { count, loading, error, refetch: fetchUnreadCount };
}
