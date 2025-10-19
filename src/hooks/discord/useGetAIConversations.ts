import { useState } from "react";


export function useGetAIConversations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const url = import.meta.env.VITE_BACKEND_URL;

  const fetchConversations = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    const token = localStorage.getItem("access_token");

    try {
      const res = await fetch(`${url}/api/v2/ai/conversations`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Failed to fetch AI conversations");
      }

      const res2 = await fetch(`${url}/api/v2/ai/conversations/${data[0]._id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      const data2 = await res2.json();
      if (!res2.ok) {
        throw new Error(data?.message || "Failed to fetch AI conversations");
      }
      setSuccess(true);
      return data2;
    } catch (err: any) {
      setError(err.message || "Failed to fetch AI conversations");
    } finally {
      setLoading(false);
    }
  };

  return { fetchConversations, loading, error, success };
}