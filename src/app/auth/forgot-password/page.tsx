"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { trpc } from "@/utils/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/lib/utils";
import BackgroundPattern from "@/components/ui/background-pattern";

const emailSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

const resetSchema = z.object({
  otp: z.string().length(6, "OTP must be 6 digits"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});

type EmailForm = z.infer<typeof emailSchema>;
type ResetForm = z.infer<typeof resetSchema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "reset">("email");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");

  const emailForm = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
  });

  const resetForm = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
  });

  const forgotPasswordMutation = trpc.auth.forgotPassword.useMutation({
    onSuccess: () => {
      setStep("reset");
      setIsLoading(false);
      toast.success("Password reset code sent! Please check your email.");
    },
    onError: (error) => {
      setError(error.message);
      setIsLoading(false);
    },
  });

  const resetPasswordMutation = trpc.auth.resetPassword.useMutation({
    onSuccess: () => {
      toast.success("Password reset successful! Please log in with your new password.");
      router.push("/auth/login");
    },
    onError: (error) => {
      setError(error.message);
      setIsLoading(false);
    },
  });

  const onEmailSubmit = async (data: EmailForm) => {
    setIsLoading(true);
    setError(null);
    setEmail(data.email);
    forgotPasswordMutation.mutate(data);
  };

  const onResetSubmit = async (data: ResetForm) => {
    setIsLoading(true);
    setError(null);
    resetPasswordMutation.mutate({
      email,
      otp: data.otp,
      newPassword: data.newPassword,
    });
  };

  const resendCode = () => {
    forgotPasswordMutation.mutate({ email });
  };

  if (step === "reset") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <BackgroundPattern variant="grid" className="opacity-20" />

        <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto w-12 h-12 bg-orange-600 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">Reset Password</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Enter the code sent to {email} and your new password
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={resetForm.handleSubmit(onResetSubmit)} className="space-y-4">
              {error && (
                <Alert variant="destructive" className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
                  <AlertDescription className="text-red-800 dark:text-red-200">{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="otp" className="text-gray-700 dark:text-gray-300">Verification Code</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  autoComplete="one-time-code"
                  {...resetForm.register("otp")}
                  className={cn(
                    "text-center text-lg tracking-widest transition-all duration-200",
                    resetForm.formState.errors.otp
                      ? "border-red-300 focus:border-red-500 dark:border-red-600 dark:focus:border-red-500"
                      : "border-gray-300 focus:border-orange-500 dark:border-gray-600 dark:focus:border-orange-400"
                  )}
                />
                {resetForm.formState.errors.otp && (
                  <p className="text-sm text-red-600 dark:text-red-400">{resetForm.formState.errors.otp.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-gray-700 dark:text-gray-300">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Enter new password"
                  {...resetForm.register("newPassword")}
                  className={cn(
                    "transition-all duration-200",
                    resetForm.formState.errors.newPassword
                      ? "border-red-300 focus:border-red-500 dark:border-red-600 dark:focus:border-red-500"
                      : "border-gray-300 focus:border-orange-500 dark:border-gray-600 dark:focus:border-orange-400"
                  )}
                />
                {resetForm.formState.errors.newPassword && (
                  <p className="text-sm text-red-600 dark:text-red-400">{resetForm.formState.errors.newPassword.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-orange-600 hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-700 transition-all duration-200"
                disabled={isLoading}
              >
                {isLoading ? "Resetting..." : "Reset Password"}
              </Button>
            </form>

            <div className="mt-6 text-center space-y-2">
              <button
                type="button"
                onClick={resendCode}
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200"
                disabled={forgotPasswordMutation.isPending}
              >
                {forgotPasswordMutation.isPending ? "Sending..." : "Didn't receive code? Resend"}
              </button>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <button
                  type="button"
                  onClick={() => setStep("email")}
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors duration-200"
                >
                  Change email
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <BackgroundPattern variant="dots" className="opacity-30" />

      <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto w-12 h-12 bg-orange-600 rounded-xl flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">Forgot Password</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Enter your email address and we&apos;ll send you a reset code
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
            {error && (
              <Alert variant="destructive" className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
                <AlertDescription className="text-red-800 dark:text-red-200">{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                {...emailForm.register("email")}
                className={cn(
                  "transition-all duration-200",
                  emailForm.formState.errors.email
                    ? "border-red-300 focus:border-red-500 dark:border-red-600 dark:focus:border-red-500"
                    : "border-gray-300 focus:border-orange-500 dark:border-gray-600 dark:focus:border-orange-400"
                )}
              />
              {emailForm.formState.errors.email && (
                <p className="text-sm text-red-600 dark:text-red-400">{emailForm.formState.errors.email.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-orange-600 hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-700 transition-all duration-200"
              disabled={isLoading}
            >
              {isLoading ? "Sending..." : "Send Reset Code"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Remember your password?{" "}
              <Link
                href="/auth/login"
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors duration-200"
              >
                Sign in
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}