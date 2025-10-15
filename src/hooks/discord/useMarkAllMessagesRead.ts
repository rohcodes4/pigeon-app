import { useState } from "react";

const url = import.meta.env.VITE_BACKEND_URL as string;
const apiURL = `${url}/api`;

export function useMarkAllMessagesRead() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const markAllMessagesRead = async (
    platform: "discord" | "tg",
    chat_ids: string | string[]
  ) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    const token = localStorage.getItem("access_token");
    const ids = Array.isArray(chat_ids) ? chat_ids.join(",") : chat_ids;

    try {
      const body = new URLSearchParams();
      body.append("platform", platform);
      body.append("chat_ids", ids);

      const res = await fetch(`${apiURL}/messages/mark-all-read`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: body.toString(),
      });

      const data = await res.json();

      if (!res.ok) {
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
