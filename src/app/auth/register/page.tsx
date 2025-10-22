"use client";

import { useState, useRef } from "react";
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
import { Loader2, Eye, EyeOff } from "lucide-react";

const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  username: z.string().min(3, "Username must be at least 3 characters").optional(),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [step, setStep] = useState<"register" | "verify">("register");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [showPassword, setShowPassword] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: (data) => {
      setEmail(data.email);
      setStep("verify");
      setIsLoading(false);
      toast.success("Registration initiated! Please check your email for the OTP.");
    },
    onError: (error) => {
      setError(error.message);
      setIsLoading(false);
    },
  });

  const verifyMutation = trpc.auth.verifyOtp.useMutation({
    onSuccess: (data) => {
      // Store tokens in localStorage (in a real app, you'd use secure httpOnly cookies)
      localStorage.setItem("accessToken", data.tokens.accessToken);
      localStorage.setItem("refreshToken", data.tokens.refreshToken);

      toast.success("Registration successful!");
      
      // Use window.location instead of router.push to ensure a full page reload with the new token
      window.location.href = "/dashboard";
    },
    onError: (error) => {
      setError(error.message);
      setIsLoading(false);
    },
  });

  const onRegisterSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    setError(null);
    registerMutation.mutate(data);
  };

  const onOtpSubmit = async () => {
    setIsLoading(true);
    setError(null);
    const otpValue = otp.join("");
    verifyMutation.mutate({ email, otp: otpValue });
  };

  const handleOtpChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);
    
    // Focus last filled input
    const lastIndex = Math.min(pastedData.length, 5);
    otpRefs.current[lastIndex]?.focus();
  };

  const resendOtp = () => {
    const formData = registerForm.getValues();
    registerMutation.mutate(formData);
  };

  if (step === "verify") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <BackgroundPattern variant="grid" className="opacity-20" />

        <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">Verify Email</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              We&apos;ve sent a 6-digit code to {email}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => {
              e.preventDefault();
              const otpValue = otp.join("");
              if (otpValue.length === 6) {
                onOtpSubmit();
              }
            }} className="space-y-4">
              {error && (
                <Alert variant="destructive" className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
                  <AlertDescription className="text-red-800 dark:text-red-200">{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label className="text-gray-700 dark:text-gray-300">Verification Code</Label>
                <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
                  {otp.map((digit, index) => (
                    <Input
                      key={index}
                      ref={(el) => {
                        otpRefs.current[index] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className={cn(
                        "w-12 h-12 text-center text-lg font-semibold transition-all duration-200",
                        digit
                          ? "border-green-500 focus:border-green-600 dark:border-green-400 dark:focus:border-green-500"
                          : "border-gray-300 focus:border-blue-500 dark:border-gray-600 dark:focus:border-blue-400"
                      )}
                    />
                  ))}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center mt-2">
                  Enter the 6-digit code sent to your email
                </p>
              </div>

              <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 transition-all duration-200"
                disabled={isLoading || otp.join("").length !== 6}
              >
                {isLoading ? <Loader2 className="animate-spin h-5 w-5 mr-3" /> : "Verify Email"}
              </Button>
            </form>

            <div className="mt-6 text-center space-y-2">
              <button
                type="button"
                onClick={resendOtp}
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200"
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? "Sending..." : "Didn't receive code? Resend"}
              </button>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <button
                  type="button"
                  onClick={() => setStep("register")}
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
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <BackgroundPattern variant="waves" className="opacity-25" />

      <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">Create Account</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Enter your information to create your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
            {error && (
              <Alert variant="destructive" className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
                <AlertDescription className="text-red-800 dark:text-red-200">{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-700 dark:text-gray-300">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your full name"
                {...registerForm.register("name")}
                className={cn(
                  "transition-all duration-200",
                  registerForm.formState.errors.name
                    ? "border-red-300 focus:border-red-500 dark:border-red-600 dark:focus:border-red-500"
                    : "border-gray-300 focus:border-blue-500 dark:border-gray-600 dark:focus:border-blue-400"
                )}
              />
              {registerForm.formState.errors.name && (
                <p className="text-sm text-red-600 dark:text-red-400">{registerForm.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                {...registerForm.register("email")}
                className={cn(
                  "transition-all duration-200",
                  registerForm.formState.errors.email
                    ? "border-red-300 focus:border-red-500 dark:border-red-600 dark:focus:border-red-500"
                    : "border-gray-300 focus:border-blue-500 dark:border-gray-600 dark:focus:border-blue-400"
                )}
              />
              {registerForm.formState.errors.email && (
                <p className="text-sm text-red-600 dark:text-red-400">{registerForm.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="username" className="text-gray-700 dark:text-gray-300">Username (Optional)</Label>
              <Input
                id="username"
                type="text"
                placeholder="Choose a username"
                {...registerForm.register("username")}
                className={cn(
                  "transition-all duration-200",
                  registerForm.formState.errors.username
                    ? "border-red-300 focus:border-red-500 dark:border-red-600 dark:focus:border-red-500"
                    : "border-gray-300 focus:border-blue-500 dark:border-gray-600 dark:focus:border-blue-400"
                )}
              />
              {registerForm.formState.errors.username && (
                <p className="text-sm text-red-600 dark:text-red-400">{registerForm.formState.errors.username.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 dark:text-gray-300">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  {...registerForm.register("password")}
                  className={cn(
                    "transition-all duration-200 pr-10",
                    registerForm.formState.errors.password
                      ? "border-red-300 focus:border-red-500 dark:border-red-600 dark:focus:border-red-500"
                      : "border-gray-300 focus:border-blue-500 dark:border-gray-600 dark:focus:border-blue-400"
                  )}
                />
                <Button
                  variant="link"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-transparent"
                  onClick={() => setShowPassword((prev) => !prev)}
                  type="button"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" />
                  ) : (
                    <Eye className="w-5 h-5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" />
                  )}
                </Button>
              </div>
              {registerForm.formState.errors.password && (
                <p className="text-sm text-red-600 dark:text-red-400">{registerForm.formState.errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 transition-all duration-200"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{" "}
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