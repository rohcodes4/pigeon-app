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
      const bodyParams = new URLSearchParams();
      bodyParams.append("email", email);

      const res = await fetch(`${apiURL}/waitlist/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: bodyParams.toString(),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
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
