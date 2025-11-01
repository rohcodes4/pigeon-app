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
  checkAuth,
}: {
  onConnected?: () => void;
  checkAuth?: () => Promise<void>;
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

  // Helper function to handle successful authentication
  const handleAuthSuccess = async () => {
    // Update global auth state
    if (checkAuth) {
      await checkAuth();
    }

    // Force a page refresh to ensure the auth state is properly updated
    // This is needed because the component is used in ConnectAccounts which doesn't have the same redirect logic
    setTimeout(() => {
      window.location.reload();
    }, 1000);

    if (onConnected) onConnected();
  };

  async function requestLogin() {
    if (!phone.trim()) {
      setError("Please enter a valid phone number");
      return;
    }

    // Basic phone number validation
    const phoneNumber = phone.trim();
    if (!phoneNumber.startsWith("+")) {
      setError("Phone number must include country code (e.g., +1234567890)");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      window.electronAPI.telegram.onCodeSent(() => {
        console.log("Please enter the code sent to your Telegram app or SMS.");
        setStep("otp");
        toast({
          title: "Code Sent",
          description:
            "Please check your Telegram app for the verification code. It may take a few moments to arrive.",
        });
        setLoading(false);
      });
      const response = window.electronAPI.telegram.loginPhone(phoneNumber);
      console.log("Phone login response:", response);
    } catch (e: any) {
      console.error("Phone login error:", e);
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
    if (!otp.trim()) {
      setError("Please enter the verification code");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await window.electronAPI.telegram.verifyCode(otp.trim());
      window.electronAPI.telegram.onConnected((user) => {
        console.log("Logged in:", user);
        setStep("success");
        toast({
          title: "Success!",
          description:
            "Telegram connected successfully! Your chats are being synced in the background.",
        });
        if (onConnected) onConnected();
      });

      window.electronAPI.telegram.onPasswordRequired(() => {
        console.log("Password required for 2FA");
        setStep("password");
        setShowPasswordModal(true);
        toast({
          title: "Two-Factor Authentication Required",
          description:
            "Please enter your Telegram password to complete the connection.",
        });
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

  async function submitPassword() {
    if (!password.trim()) {
      setError("Please enter your password");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await window.electronAPI.telegram.sendPassword(password.trim());
      window.electronAPI.telegram.onLoginSuccess((user) => {
        console.log("Telegram ipc login success:", user);
        setShowPasswordModal(false);
        setStep("success");
        toast({
          title: "Success!",
          description:
            "Telegram connected successfully! Your chats are being synced in the background.",
        });
        if (onConnected) onConnected();
      });

      window.electronAPI.telegram.onLoginError((error) => {
        toast({
          title: "Authentication Failed",
          description: "Failed to verify password",
          variant: "destructive",
        });
      });
      window.electronAPI.telegram.onPasswordInvalid(() => {
        toast({
          title: "Authentication Failed",
          description: "Invalid password. Please try again.",
          variant: "destructive",
        });
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
          <div className="text-center">
            <Button
              onClick={() => {
                setStep("phone");
                setOtp("");
                setError(null);
              }}
              variant="link"
              className="text-sm text-gray-400 hover:text-white"
            >
              Didn't receive a code? Try again
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
