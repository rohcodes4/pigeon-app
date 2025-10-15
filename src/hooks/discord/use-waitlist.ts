import { useState } from "react";

const url = import.meta.env.VITE_BACKEND_URL as string;
const apiURL = url + "/api";

export function useJoinWaitlist() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const joinWaitlist = async (email: string) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch(`${apiURL}/waitlist/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.message || "Failed to join waitlist");
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return { joinWaitlist, loading, error, success };
}
