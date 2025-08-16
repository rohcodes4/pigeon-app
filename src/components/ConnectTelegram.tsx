import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export default function ConnectTelegram({
  onConnected,
}: {
  onConnected?: () => void;
}) {
  const [step, setStep] = useState("phone"); // "phone" or "otp" or "password" or "success"
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [phoneToken, setPhoneToken] = useState<string | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const { user } = useAuth();

  async function requestLogin() {
    if (!phone.trim()) {
      setError("Please enter a valid phone number");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${BACKEND_URL}/auth/phone/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to start login");
      }

      setPhoneToken(data.token);
      setStep("otp");
      toast({
        title: "Code Sent",
        description:
          "Please check your Telegram app for the verification code.",
      });
    } catch (e: any) {
      setError(e.message);
      toast({
        title: "Error",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function submitOtp() {
    if (!otp.trim() || !phoneToken) {
      setError("Please enter the verification code");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${BACKEND_URL}/auth/phone/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          token: phoneToken,
          code: otp.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Verification failed");
      }

      if (data.status === "password_required") {
        // 2FA password is required
        setStep("password");
        setShowPasswordModal(true);
        toast({
          title: "Two-Factor Authentication Required",
          description:
            "Please enter your Telegram password to complete the connection.",
        });
      } else if (data.status === "success") {
        // Login successful
        setStep("success");
        if (data.access_token) {
          localStorage.setItem("access_token", data.access_token);
        }
        toast({
          title: "Success!",
          description: "Telegram connected successfully!",
        });
        if (onConnected) onConnected();
      } else {
        throw new Error(data.detail || "Unexpected response");
      }
    } catch (e: any) {
      setError(e.message);
      toast({
        title: "Error",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function submitPassword() {
    if (!password.trim() || !phoneToken) {
      setError("Please enter your password");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("access_token");
      const formData = new FormData();
      formData.append("password", password);

      const response = await fetch(
        `${BACKEND_URL}/auth/phone/${phoneToken}/password`,
        {
          method: "POST",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Password verification failed");
      }

      if (data.status === "success") {
        setStep("success");
        setShowPasswordModal(false);
        if (data.access_token) {
          localStorage.setItem("access_token", data.access_token);
        }
        toast({
          title: "Success!",
          description: "Telegram connected successfully!",
        });
        if (onConnected) onConnected();
      } else {
        throw new Error(data.detail || "Unexpected response");
      }
    } catch (e: any) {
      setError(e.message);
      toast({
        title: "Error",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  const resetForm = () => {
    setStep("phone");
    setPhone("");
    setOtp("");
    setPassword("");
    setError(null);
    setPhoneToken(null);
    setShowPasswordModal(false);
  };

  return (
    <div className="space-y-4 max-w-md mx-auto">
      {step === "phone" && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Phone Number
            </label>
            <Input
              type="tel"
              placeholder="+1234567890"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={loading}
              className="w-full"
            />
          </div>
          <Button
            onClick={requestLogin}
            disabled={loading || !phone.trim()}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Sending Code...
              </>
            ) : (
              "Send Verification Code"
            )}
          </Button>
        </div>
      )}

      {step === "otp" && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Verification Code
            </label>
            <Input
              type="text"
              placeholder="Enter the code from Telegram"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              disabled={loading}
              className="w-full"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={resetForm} variant="outline" className="flex-1">
              Back
            </Button>
            <Button
              onClick={submitOtp}
              disabled={loading || !otp.trim()}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Verifying...
                </>
              ) : (
                "Verify Code"
              )}
            </Button>
          </div>
        </div>
      )}

      {step === "success" && (
        <div className="text-center space-y-4">
          <div className="text-6xl">🎉</div>
          <h3 className="text-xl font-semibold text-white">
            Telegram Connected Successfully!
          </h3>
          <p className="text-gray-400">
            Your Telegram account is now connected and ready to use.
          </p>
          <div className="text-sm text-gray-500">
            Redirecting to complete login...
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* 2FA Password Modal */}
      <AlertDialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Two-Factor Authentication</AlertDialogTitle>
            <AlertDialogDescription>
              Your Telegram account has two-factor authentication enabled.
              Please enter your password to complete the connection.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col gap-4 p-4">
            <Input
              type="password"
              placeholder="Enter your Telegram password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !loading) {
                  submitPassword();
                }
              }}
              disabled={loading}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setShowPasswordModal(false);
                setPassword("");
                resetForm();
              }}
              disabled={loading}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={submitPassword}
              disabled={loading || !password.trim()}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Connect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
