import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import AIimg from "@/assets/images/aiBlue.png";
// import AIimg from '@/assets/images/sidebarLogo.png';
import {
  EyeIcon,
  UserIcon,
  LockClosedIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";
import { Mail } from "lucide-react";
import google from "@/assets/images/google.png";
import telegram from "@/assets/images/telegram.png";
import discord from "@/assets/images/discord.png";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export const AuthPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptTnC, setAcceptTnC] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const initialMode = params.get("mode") === "signup" ? false : true; // false = sign up, true = sign in
  const [isSignIn, setIsSignIn] = useState(initialMode);
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignIn) {
        const { error } = await supabase.auth.signInWithPassword({
          email: username, //to be changed to email in prod
          password,
        });

        if (error) throw error;

        toast({
          title: "Welcome back!",
          description: "You have been signed in successfully.",
        });
        navigate("/");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
          },
        });

        if (error) throw error;

        toast({
          title: "Account created!",
          description: "Please check your email to verify your account.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br">
      <Header />
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[calc(100vh-80px)] ">
        {/* Custom Card based on Figma */}
        <div
          className={`w-full max-w-md rounded-2xl shadow-lg p-8 bg-[#111111]`}
        >
          <div className="mb-0 flex flex-col items-center justify-center gap-2">
            <img src={AIimg} alt="AI" className="w-16 h-16" />
            <h2 className={`text-2xl tracking-[1px] text-center text-white`}>
              {isSignIn ? "Sign In" : "Create Account"}
            </h2>
          </div>
          <div className="mt-0 mb-10 text-center text-[13px]">
            <p className="text-[#ffffff48]">
              {isSignIn ? "Need an account?" : "Already having an account?"}
              <Button
                variant="link"
                onClick={() => setIsSignIn(!isSignIn)}
                className="pl-1 text-[#5389ff]"
              >
                {isSignIn ? "Create Account" : "Sign in"}
              </Button>
            </p>
          </div>
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="flex items-center bg-[#212121] rounded-[12px] px-3">
              <UserIcon className="w-5 h-5 text-[#8c8c8c] mr-2" />
              <Input
                type="text"
                placeholder={isSignIn ? "Username" : "Enter a unique username"}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="border-0 bg-transparent placeholder:text-[#8c8c8c] flex-1 pl-0 !outline-none focus:!outline-none  focus:ring-0"
              />
            </div>
            {/* Email (only for sign up) */}
            {!isSignIn && (
              <div className="flex items-center bg-[#212121] rounded-[12px] px-3">
                <Mail className="w-5 h-5 text-[#8c8c8c] mr-2" />
                <Input
                  type="email"
                  placeholder="youremail@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="border-0 bg-transparent placeholder:text-[#8c8c8c] flex-1 pl-0"
                />
              </div>
            )}
            <div className="flex items-center bg-[#212121] rounded-[12px] px-3 relative">
              <LockClosedIcon className="w-5 h-5 text-[#8c8c8c] mr-2" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="************"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="border-0 bg-transparent placeholder:text-[#8c8c8c] flex-1 pl-0 pr-10"
              />
              <button
                type="button"
                className="absolute right-3"
                tabIndex={-1}
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? (
                  <EyeSlashIcon className="w-5 h-5 text-[#8c8c8c]" />
                ) : (
                  <EyeIcon className="w-5 h-5 text-[#8c8c8c]" />
                )}
              </button>
            </div>
            {!isSignIn && (
              <div className="flex items-center space-x-2 py-3">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    id="tnc"
                    type="checkbox"
                    checked={acceptTnC}
                    onChange={(e) => setAcceptTnC(e.target.checked)}
                    className="peer sr-only"
                    required
                  />
                  <span className="w-4 h-4 rounded-[6px] border border-[#ffffff32] flex items-center justify-center peer-checked:bg-[#5389ff] peer-checked:[&>svg]:opacity-100 transition">
                    <svg
                      className="w-3 h-3 opacity-0 text-white"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </span>
                  <span className="text-xs text-[#8c8c8c] select-none">
                    I accept and agree to all the{" "}
                    <a href="/terms" className="text-[#5389ff] underline">
                      Terms & Conditions.
                    </a>
                  </span>
                </label>
              </div>
            )}
            <Button
              type="submit"
              className={`w-full bg-[#5389ff] text-black hover:bg-blue-700 rounded-[12px]`}
              disabled={isLoading}
            >
              {isLoading ? "Loading..." : isSignIn ? "Sign In" : "Sign Up"}
            </Button>
          </form>
          {/* <div className="flex items-center justify-center">
          <p className="text-center text-[13px] text-[#ffffff48] mt-4 bg-red-200 w-max px-4"> Or continue with</p>
          </div> */}

          <div className="relative flex items-center justify-center my-4">
            <div className="absolute left-0 right-0 h-px bg-white opacity-20"></div>
            <p className="relative z-10 bg-[#111111] text-center text-[13px] text-[#ffffff48] px-4">
              Or continue with
            </p>
          </div>
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              className="w-max bg-[#212121] text-white hover:bg-blue-700 rounded-[12px] grow"
            >
              <img
                src={google}
                alt="google"
                className="w-5 h-5 object-contain "
              />
            </Button>
            <Button
              variant="outline"
              className="w-max bg-[#212121] text-white hover:bg-blue-700 rounded-[12px] grow"
            >
              <img
                src={telegram}
                alt="telegram"
                className="w-5 h-5 object-contain"
              />
            </Button>
            <Button
              variant="outline"
              className="w-max bg-[#212121] text-white hover:bg-blue-700 rounded-[12px] grow"
            >
              <img
                src={discord}
                alt="discord"
                className="w-5 h-5 object-contain"
              />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
//   return (
//     <div className="min-h-screen bg-gradient-to-br">
//       <Header />

//       <div className="container mx-auto p-6 flex items-center justify-center min-h-[calc(100vh-80px)]">
//         <Card className="w-full max-w-md border-0">
//           <CardHeader>
//             <CardTitle className="text-2xl text-center">
//               {isSignIn ? "Sign In" : "Sign Up"}
//             </CardTitle>
//           </CardHeader>
//           <CardContent>
//             <form onSubmit={handleAuth} className="space-y-4">
//               <div>
//                 <Input
//                   type="email"
//                   placeholder="Email"
//                   value={email}
//                   onChange={(e) => setEmail(e.target.value)}
//                   required
//                   className="border-0 bg-gradient-to-br"
//                 />
//               </div>
//               <div>
//                 <Input
//                   type="password"
//                   placeholder="Password"
//                   value={password}
//                   onChange={(e) => setPassword(e.target.value)}
//                   required
//                   className="border-0 bg-gradient-to-br"

//                 />
//               </div>
//               <Button type="submit" className="w-full" disabled={isLoading}>
//                 {isLoading ? "Loading..." : isSignIn ? "Sign In" : "Sign Up"}
//               </Button>
//             </form>

//             <div className="mt-4 text-center">
//               <Button
//                 variant="link"
//                 onClick={() => setIsSignIn(!isSignIn)}
//                 className="text-sm"
//               >
//                 {isSignIn ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
//               </Button>
//             </div>
//           </CardContent>
//         </Card>
//       </div>
//     </div>
//   );
// };
