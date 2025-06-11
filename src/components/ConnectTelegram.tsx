import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";

export default function ConnectTelegram() {
  const [step, setStep] = useState("phone"); // "phone" or "otp" or "success"
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  async function requestLogin() {
    setLoading(true);
    setError(null);
    try {
      // Call backend API to start login with phone
      // We send phone but OTP and password are awaited callbacks server-side, so for now send dummy OTP (or adjust your backend)
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/telegram/send-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone_number:phone }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to start login");
      setStep("otp");
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }

  async function submitOtp() {
    setLoading(true);
    setError(null);
    try {
      // Call backend API with phone + otp to complete login
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/telegram/verify-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user?.id, phone_number: phone, code: otp }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Login failed");
      setStep("success");
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }

  return (
    <div style={{ maxWidth: 400, margin: "auto" }}>
      {step === "phone" && (
        <>
          <input
            type="tel"
            placeholder="+1234567890"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={loading}
            style={{ width: "100%", padding: 8, fontSize: 16 }}
          />
          <button onClick={requestLogin} disabled={loading || !phone}>
            {loading ? "Sending OTP..." : "Connect Telegram"}
          </button>
        </>
      )}

      {step === "otp" && (
        <>
          <input
            type="text"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            disabled={loading}
            style={{ width: "100%", padding: 8, fontSize: 16 }}
          />
          <button onClick={submitOtp} disabled={loading || !otp}>
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
        </>
      )}

      {step === "success" && (
        <p>🎉 Telegram connected successfully!</p>
      )}

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
