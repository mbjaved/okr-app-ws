"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Card, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import Toast from "../../components/ui/Toast";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  // All hooks must be called before any return/logic!
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState<"success" | "error" | "info">("info");
  const [showSignUpPrompt, setShowSignUpPrompt] = useState(false);
  const [showGooglePrompt, setShowGooglePrompt] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setToastOpen(false);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = await res.json();
      if (res.ok) {
        setToastMsg("Password reset email sent! Check your inbox.");
        setToastType("success");
        setToastOpen(true);
      } else if (res.status === 404) {
        setToastMsg(result.error);
        setToastType("error");
        setToastOpen(true);
        setShowSignUpPrompt(true);
      } else if (res.status === 403 && result.oauth) {
        setToastMsg(result.error);
        setToastType("info");
        setToastOpen(true);
        setShowGooglePrompt(true);
      } else {
        setToastMsg(result.error || "Failed to send reset email.");
        setToastType("error");
        setToastOpen(true);
      }
    } catch (err) {
      setToastMsg("Server error. Please try again later.");
      setToastType("error");
      setToastOpen(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAFAFB] p-4">
      {!showGooglePrompt ? (
        <>
          <Card className="w-full max-w-md shadow-2xl">
            <CardContent className="flex flex-col justify-center p-8">
              <h2 className="text-xl font-semibold mb-4">Forgot your password?</h2>
              <p className="mb-4 text-gray-600 text-sm">Enter your email address and we'll send you a link to reset your password.</p>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <Input
                  type="email"
                  placeholder="Enter your email."
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
                <Button type="submit" disabled={loading || !email} className="mt-2 hover:shadow-lg cursor-pointer">
                  {loading ? "Sending..." : "Send Reset Link"}
                </Button>
              </form>
              <div className="mt-4 flex flex-col gap-2">
                <span className="text-sm">
                  Remember your password?{' '}
                  <a href="/login" className="text-blue-600 hover:underline cursor-pointer">Log in.</a>
                </span>
              </div>
            </CardContent>
          </Card>
          <Toast
            message={toastMsg}
            type={toastType}
            open={toastOpen}
            onClose={() => setToastOpen(false)}
            duration={2500}
          />
          {showSignUpPrompt && (
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 flex flex-col items-center z-50">
              <span className="mb-2 text-gray-700">No account found. Would you like to sign up?</span>
              <a href="/register" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">Sign up</a>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center bg-white border border-gray-200 rounded-lg shadow-lg p-8">
          <h2 className="text-xl font-semibold mb-4">Google Account Detected</h2>
          <p className="mb-4 text-gray-700">This account uses Google sign-in. Please use the button below to log in with Google.</p>
          <Button
            variant="outline"
            className="mt-4 flex items-center gap-2 hover:shadow-lg cursor-pointer"
            onClick={() => signIn("google")}
          >
            <img src="/google.svg" alt="Google logo" width={20} height={20} />
            Sign in with Google
          </Button>
        </div>
      )}
    </div>
  );
}
