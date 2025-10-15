import { useState } from "react";

const url = import.meta.env.VITE_BACKEND_URL as string;
const apiURL = `${url}/api`;

export const useSummarizeMessage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  const summarizeMessages = async (
    messages: any[],
    extract_tasks: boolean,
    platform: string
  ) => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("access_token");

      const body = new URLSearchParams();
      body.append("messages", JSON.stringify(messages));
      body.append("extract_tasks", String(extract_tasks));
      body.append("platform", platform);

      const res = await fetch(`${apiURL}/summarize-messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: body.toString(),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result?.message || "Failed to summarize messages");
      }

      setData(result);
      return result;
    } catch (err: any) {
      setError(err.message || "An error occurred");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { summarizeMessages, loading, error, data };
};
