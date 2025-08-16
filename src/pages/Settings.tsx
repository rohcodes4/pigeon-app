import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import {
  Settings as SettingsIcon,
  User,
  Shield,
  Bell,
  Palette,
  Save,
  Eye,
  EyeOff,
} from "lucide-react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const Settings = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isOAuthUser, setIsOAuthUser] = useState(false);

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    username: "",
    full_name: "",
    email: "",
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [isUpdating, setIsUpdating] = useState(false);

  // Function to check if user is OAuth user
  const checkIfOAuthUser = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/auth/user-type`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setIsOAuthUser(data.is_oauth_user || false);
      }
    } catch (error) {
      console.error("Error checking user type:", error);
      // If we can't determine, assume they can change password
      setIsOAuthUser(false);
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      setProfileForm({
        username: user.username || "",
        full_name: user.full_name || "",
        email: user.email || "",
      });

      // Check if user is OAuth user
      checkIfOAuthUser();
    }
  }, [user]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);

    try {
      const formData = new FormData();
      formData.append("username", profileForm.username);
      formData.append("email", profileForm.email);
      formData.append("full_name", profileForm.full_name);

      const response = await fetch(`${BACKEND_URL}/auth/update-profile`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to update profile");
      }

      const updatedUser = await response.json();

      // Update the form with the latest data
      setProfileForm({
        username: updatedUser.username || "",
        full_name: updatedUser.full_name || "",
        email: updatedUser.email || "",
      });

      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "New password and confirmation password don't match.",
        variant: "destructive",
      });
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);

    try {
      const formData = new FormData();
      formData.append("current_password", passwordForm.currentPassword);
      formData.append("new_password", passwordForm.newPassword);

      const response = await fetch(`${BACKEND_URL}/auth/change-password`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to change password");
      }

      toast({
        title: "Password Changed",
        description: "Your password has been changed successfully.",
      });

      // Clear the form
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      toast({
        title: "Password Change Failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to change password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-24 h-24 bg-gradient-to-r rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <SettingsIcon className="w-20 h-20 text-white" />
            </div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Layout>
      <div className="flex grow flex-col p-6 bg-gradient-to-br from-[#171717] via-[#1a1a1a] to-[#171717] min-h-screen min-w-0 max-w-full ">
        <div className="max-w-4xl mx-auto w-full space-y-8">
          {/* Header */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-[#3474ff] to-[#7B5CFA] text-white">
                <SettingsIcon className="w-6 h-6" />
              </div>
              <h1 className="text-4xl font-bold text-white">Settings</h1>
            </div>
            <p className="text-[#ffffff72] text-lg">
              Manage your account settings and preferences
            </p>
          </div>

          <Card className="bg-gradient-to-br from-[#212121] via-[#1f1f1f] to-[#1a1a1a] border-[#333] hover:border-[#444] transition-all duration-300">
            <CardContent className="p-6">
              <Tabs defaultValue="profile" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-[#171717] border-[#333]">
                  <TabsTrigger
                    value="profile"
                    className="flex items-center gap-2 data-[state=active]:bg-[#3474ff] data-[state=active]:text-white"
                  >
                    <User className="w-4 h-4" />
                    Profile
                  </TabsTrigger>
                  <TabsTrigger
                    value="security"
                    className="flex items-center gap-2 data-[state=active]:bg-[#3474ff] data-[state=active]:text-white"
                  >
                    <Shield className="w-4 h-4" />
                    Security
                  </TabsTrigger>
                  {/* <TabsTrigger
                    value="preferences"
                    className="flex items-center gap-2 data-[state=active]:bg-[#3474ff] data-[state=active]:text-white"
                  >
                    <Palette className="w-4 h-4" />
                    Preferences
                  </TabsTrigger> */}
                </TabsList>

                <TabsContent value="profile" className="space-y-6 mt-6">
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-white">
                      Profile Information
                    </h3>
                    <form onSubmit={handleProfileUpdate} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="username" className="text-white">
                          Username
                        </Label>
                        <Input
                          id="username"
                          type="text"
                          value={profileForm.username}
                          onChange={(e) =>
                            setProfileForm((prev) => ({
                              ...prev,
                              username: e.target.value,
                            }))
                          }
                          className="bg-[#2A2D36] border-[#333] text-white"
                          placeholder="Enter your username"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="full_name" className="text-white">
                          Full Name
                        </Label>
                        <Input
                          id="full_name"
                          type="text"
                          value={profileForm.full_name}
                          onChange={(e) =>
                            setProfileForm((prev) => ({
                              ...prev,
                              full_name: e.target.value,
                            }))
                          }
                          className="bg-[#2A2D36] border-[#333] text-white"
                          placeholder="Enter your full name"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-white">
                          Email
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={profileForm.email}
                          onChange={(e) =>
                            setProfileForm((prev) => ({
                              ...prev,
                              email: e.target.value,
                            }))
                          }
                          className="bg-[#2A2D36] border-[#333] text-white"
                          placeholder="Enter your email"
                        />
                      </div>

                      <Button
                        type="submit"
                        disabled={isUpdating}
                        className="bg-gradient-to-r from-[#3474ff] to-[#7B5CFA] text-white hover:from-[#2563eb] hover:to-[#6d28d9] transition-all duration-300"
                      >
                        {isUpdating ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Updating...
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Save className="w-4 h-4" />
                            Save Changes
                          </div>
                        )}
                      </Button>
                    </form>
                  </div>
                </TabsContent>

                <TabsContent value="security" className="space-y-6 mt-6">
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-white">
                      {isOAuthUser ? "Account Security" : "Change Password"}
                    </h3>

                    {isOAuthUser ? (
                      <div className="bg-gradient-to-r from-[#2A2D36] to-[#1f2229] border border-[#444] rounded-lg p-6 space-y-4">
                        <div className="flex items-center gap-3">
                          <Shield className="w-6 h-6 text-[#3474ff]" />
                          <div>
                            <h4 className="text-lg font-semibold text-white">
                              OAuth Account
                            </h4>
                            <p className="text-[#ffffff72] text-sm">
                              Your account was created using OAuth (Google,
                              Discord, etc.)
                            </p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <p className="text-[#ffffff72]">
                            Since you signed in with an external provider,
                            password management is handled by that service.
                          </p>

                          <div className="flex flex-col gap-2">
                            <p className="text-sm text-[#ffffff72]">
                              To change your password:
                            </p>
                            <ul className="text-sm text-[#ffffff72] space-y-1 ml-4">
                              <li>
                                • Go to your Google/Discord/etc. account
                                settings
                              </li>
                              <li>• Update your password there</li>
                              <li>
                                • The changes will automatically apply here
                              </li>
                            </ul>
                          </div>

                          <div className="pt-4 border-t border-[#444]">
                            <p className="text-xs text-[#ffffff48]">
                              Need help? Contact support or check your OAuth
                              provider's help documentation.
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <form
                        onSubmit={handlePasswordChange}
                        className="space-y-4"
                      >
                        <div className="space-y-2">
                          <Label
                            htmlFor="currentPassword"
                            className="text-white"
                          >
                            Current Password
                          </Label>
                          <div className="relative">
                            <Input
                              id="currentPassword"
                              type={showCurrentPassword ? "text" : "password"}
                              value={passwordForm.currentPassword}
                              onChange={(e) =>
                                setPasswordForm((prev) => ({
                                  ...prev,
                                  currentPassword: e.target.value,
                                }))
                              }
                              className="bg-[#2A2D36] border-[#333] text-white pr-10"
                              placeholder="Enter your current password"
                            />
                            <button
                              type="button"
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#ffffff72] hover:text-white"
                              onClick={() =>
                                setShowCurrentPassword(!showCurrentPassword)
                              }
                            >
                              {showCurrentPassword ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="newPassword" className="text-white">
                            New Password
                          </Label>
                          <div className="relative">
                            <Input
                              id="newPassword"
                              type={showNewPassword ? "text" : "password"}
                              value={passwordForm.newPassword}
                              onChange={(e) =>
                                setPasswordForm((prev) => ({
                                  ...prev,
                                  newPassword: e.target.value,
                                }))
                              }
                              className="bg-[#2A2D36] border-[#333] text-white pr-10"
                              placeholder="Enter your new password"
                            />
                            <button
                              type="button"
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#ffffff72] hover:text-white"
                              onClick={() =>
                                setShowNewPassword(!showNewPassword)
                              }
                            >
                              {showNewPassword ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label
                            htmlFor="confirmPassword"
                            className="text-white"
                          >
                            Confirm New Password
                          </Label>
                          <div className="relative">
                            <Input
                              id="confirmPassword"
                              type={showConfirmPassword ? "text" : "password"}
                              value={passwordForm.confirmPassword}
                              onChange={(e) =>
                                setPasswordForm((prev) => ({
                                  ...prev,
                                  confirmPassword: e.target.value,
                                }))
                              }
                              className="bg-[#2A2D36] border-[#333] text-white pr-10"
                              placeholder="Confirm your new password"
                            />
                            <button
                              type="button"
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#ffffff72] hover:text-white"
                              onClick={() =>
                                setShowConfirmPassword(!showConfirmPassword)
                              }
                            >
                              {showConfirmPassword ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        <Button
                          type="submit"
                          disabled={
                            isUpdating ||
                            !passwordForm.currentPassword ||
                            !passwordForm.newPassword ||
                            !passwordForm.confirmPassword
                          }
                          className="bg-gradient-to-r from-[#3474ff] to-[#7B5CFA] text-white hover:from-[#2563eb] hover:to-[#6d28d9] transition-all duration-300"
                        >
                          {isUpdating ? (
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Changing...
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Shield className="w-4 h-4" />
                              Change Password
                            </div>
                          )}
                        </Button>
                      </form>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Settings;
