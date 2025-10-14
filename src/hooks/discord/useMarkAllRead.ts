import { useState } from "react";

const url = import.meta.env.VITE_BACKEND_URL as string;
const apiURL = url + "/api";

export function useMarkAllRead() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const markAllRead = async (platform: "discord" | "tg") => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    const token = localStorage.getItem("access_token");

    try {
      const res = await fetch(`${apiURL}/chats/mark-all-read`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({ platform }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.message || "Failed to mark all chats as read");
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return { markAllRead, loading, error, success };
}
