"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/utils/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Lock, Upload, Save, Check, X, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { useAuth } from "@/hooks/use-auth";

export default function SettingsPage() {
  const [isUpdating, setIsUpdating] = useState(false);

  // Profile form state
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");

  // Password form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Password validation state
  const [passwordValidation, setPasswordValidation] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
    match: false,
  });

  // Use the new auth hook
  const { isAuthenticated, isLoading, profile, profileLoading } = useAuth();

  // Password validation function
  const validatePassword = (password: string, confirm: string) => {
    const validation = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
      match: password === confirm && password.length > 0,
    };
    setPasswordValidation(validation);
    return Object.values(validation).every(Boolean);
  };

  // Update password validation when new password changes
  useEffect(() => {
    validatePassword(newPassword, confirmPassword);
  }, [newPassword, confirmPassword]);

  // Populate form when profile loads
  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setUsername(profile.username || "");
      setEmail(profile.email || "");
      setBio(profile.bio || "");
      setAvatar(profile.avatarUrl || "");
    }
  }, [profile]);

  // Redirect if not authenticated - wait for auth check to complete
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = "/auth/login";
    }
  }, [isAuthenticated, isLoading]);

  const updateProfileMutation = trpc.auth.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("Profile updated successfully!");
      // Refetch profile to update UI
      window.location.reload();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update profile");
    },
  });

  const changePasswordMutation = trpc.auth.changePassword.useMutation({
    onSuccess: () => {
      toast.success("Password changed successfully! You remain logged in.");
      // Clear form fields
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      // Reset validation state
      setPasswordValidation({
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
        special: false,
        match: false,
      });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to change password");
    },
  });

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);

    try {
      await updateProfileMutation.mutateAsync({
        name,
        username: username || undefined,
        bio: bio || undefined,
        avatar: avatar || undefined,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate password
    if (!validatePassword(newPassword, confirmPassword)) {
      toast.error("Please ensure your password meets all requirements");
      return;
    }

    if (!currentPassword.trim()) {
      toast.error("Please enter your current password");
      return;
    }

    setIsUpdating(true);

    try {
      await changePasswordMutation.mutateAsync({
        currentPassword,
        newPassword,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setIsUpdating(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      setAvatar(data.url);
      
      // Save avatar URL to profile
      await updateProfileMutation.mutateAsync({
        avatar: data.url,
      });
      
      toast.success("Avatar uploaded and saved successfully!");
    } catch {
      toast.error("Failed to upload avatar");
    } finally {
      setIsUpdating(false);
    }
  };

  if (profileLoading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Settings
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage your account settings and preferences
          </p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your public profile information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileUpdate} className="space-y-6">
                  {/* Avatar */}
                  <div className="flex items-center space-x-6">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={avatar} alt={name} />
                      <AvatarFallback className="bg-blue-600 text-white text-2xl">
                        {name?.charAt(0)?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <Label
                        htmlFor="avatar-upload"
                        className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Avatar
                      </Label>
                      <Input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarUpload}
                      />
                      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        JPG, PNG or WebP. Max 5MB.
                      </p>
                    </div>
                  </div>

                  {/* Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your full name"
                    />
                  </div>

                  {/* Username */}
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter your username"
                    />
                  </div>

                  {/* Bio */}
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <textarea
                      id="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell us about yourself"
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                    />
                  </div>

                  <Button type="submit" disabled={isUpdating}>
                    <Save className="w-4 h-4 mr-2" />
                    {isUpdating ? "Saving..." : "Save Changes"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Account Tab */}
          <TabsContent value="account" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>
                  Manage your account email and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={(e) => {
                  e.preventDefault();
                  setIsUpdating(true);
                  updateProfileMutation.mutateAsync({ email })
                    .finally(() => setIsUpdating(false));
                }}>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                    />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      This email will be used for account notifications
                    </p>
                  </div>

                  <div className="space-y-2 mt-4">
                    <Label>Role</Label>
                    <div className="px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-md">
                      <span className="text-sm font-medium capitalize">{profile.role}</span>
                    </div>
                  </div>

                  <div className="space-y-2 mt-4">
                    <Label>Email Verified</Label>
                    <div className="px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-md">
                      <span className="text-sm font-medium">
                        {profile.emailVerified ? "✓ Verified" : "✗ Not Verified"}
                      </span>
                    </div>
                  </div>

                  <Button type="submit" disabled={isUpdating} className="mt-4">
                    <Save className="w-4 h-4 mr-2" />
                    {isUpdating ? "Saving..." : "Save Changes"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-red-200 dark:border-red-900">
              <CardHeader>
                <CardTitle className="text-red-600 dark:text-red-400">Danger Zone</CardTitle>
                <CardDescription>
                  Irreversible actions for your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
                      toast.info("Account deletion feature coming soon");
                    }
                  }}
                >
                  Delete Account
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>
                  Update your password to keep your account secure
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="current-password"
                        type={showCurrentPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                        required
                      />
                      <Button
                        variant="link"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowCurrentPassword((prev) => !prev)}
                        type="button"
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="w-5 h-5 text-gray-500" />
                        ) : (
                          <Eye className="w-5 h-5 text-gray-500" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <div className="relative">
                      <Input
                        id="new-password"
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        required
                      />
                      <Button
                        variant="link"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowNewPassword((prev) => !prev)}
                        type="button"
                      >
                        {showNewPassword ? (
                          <EyeOff className="w-5 h-5 text-gray-500" />
                        ) : (
                          <Eye className="w-5 h-5 text-gray-500" />
                        )}
                      </Button>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Must be at least 8 characters long
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center">
                        {passwordValidation.length ? (
                          <Check className="w-4 h-4 text-green-500 mr-1" />
                        ) : (
                          <X className="w-4 h-4 text-red-500 mr-1" />
                        )}
                        <span>8+ characters</span>
                      </div>
                      <div className="flex items-center">
                        {passwordValidation.uppercase ? (
                          <Check className="w-4 h-4 text-green-500 mr-1" />
                        ) : (
                          <X className="w-4 h-4 text-red-500 mr-1" />
                        )}
                        <span>1 uppercase letter</span>
                      </div>
                      <div className="flex items-center">
                        {passwordValidation.lowercase ? (
                          <Check className="w-4 h-4 text-green-500 mr-1" />
                        ) : (
                          <X className="w-4 h-4 text-red-500 mr-1" />
                        )}
                        <span>1 lowercase letter</span>
                      </div>
                      <div className="flex items-center">
                        {passwordValidation.number ? (
                          <Check className="w-4 h-4 text-green-500 mr-1" />
                        ) : (
                          <X className="w-4 h-4 text-red-500 mr-1" />
                        )}
                        <span>1 number</span>
                      </div>
                      <div className="flex items-center">
                        {passwordValidation.special ? (
                          <Check className="w-4 h-4 text-green-500 mr-1" />
                        ) : (
                          <X className="w-4 h-4 text-red-500 mr-1" />
                        )}
                        <span>1 special character</span>
                      </div>
                      <div className="flex items-center">
                        {passwordValidation.match ? (
                          <Check className="w-4 h-4 text-green-500 mr-1" />
                        ) : (
                          <X className="w-4 h-4 text-red-500 mr-1" />
                        )}
                        <span>Passwords match</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        id="confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        required
                      />
                      <Button
                        variant="link"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        type="button"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-5 h-5 text-gray-500" />
                        ) : (
                          <Eye className="w-5 h-5 text-gray-500" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <Button type="submit" disabled={isUpdating}>
                    <Lock className="w-4 h-4 mr-2" />
                    {isUpdating ? "Updating..." : "Update Password"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
}
