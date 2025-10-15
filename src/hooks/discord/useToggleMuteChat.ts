import { useState } from "react";

const url = import.meta.env.VITE_BACKEND_URL as string;
const apiURL = `${url}/api`;

export function useToggleMuteChat() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const toggleMuteChat = async (
    chatId: string,
    platform: "discord" | "tg",
    muted: boolean
  ) => {
    if (!chatId || !platform) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    const token = localStorage.getItem("access_token");

    try {
      const body = new URLSearchParams();
      body.append("platform", platform);
      body.append("muted", String(muted));

      const res = await fetch(`${apiURL}/chats/${chatId}/mute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: body.toString(),
      });

      const data = await res.json();

      if (!res.ok) {
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
