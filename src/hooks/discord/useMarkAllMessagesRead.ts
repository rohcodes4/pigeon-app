import { useState } from "react";

const url = import.meta.env.VITE_BACKEND_URL as string;
const apiURL = url + "/api";

export function useMarkAllMessagesRead() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const markAllMessagesRead = async (platform: "discord" | "tg", chat_ids: string | string[]) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    const token = localStorage.getItem("access_token");

    // If chat_ids is an array, join into a comma-separated string
    const ids = Array.isArray(chat_ids) ? chat_ids.join(",") : chat_ids;

    try {
      const res = await fetch(`${apiURL}/messages/mark-all-read`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({ platform, chat_ids: ids }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.message || "Failed to mark all messages as read");
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return { markAllMessagesRead, loading, error, success };
}
