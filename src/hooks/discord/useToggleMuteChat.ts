import { useState } from "react";

const url = import.meta.env.VITE_BACKEND_URL as string;
const apiURL = url + "/api";

export function useToggleMuteChat() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const toggleMuteChat = async (
    messageId: string,
    platform: "discord" | "tg",
    muted: boolean
  ) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    const token = localStorage.getItem("access_token");

    try {
      const res = await fetch(`${apiURL}/chats/${messageId}/mute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          platform,
          muted,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.message || "Failed to update mute status");
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return { toggleMuteChat, loading, error, success };
}
