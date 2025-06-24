"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import Toast from "../../components/ui/Toast";

export default function ResetPasswordPage() {
  // All hooks must be called before any return/logic!
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState<"success" | "error" | "info">("info");
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") || "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) {
      setToastMsg("Invalid or missing token.");
      setToastType("error");
      setToastOpen(true);
      return;
    }
    if (password.length < 8) {
      setToastMsg("Password must be at least 8 characters.");
      setToastType("error");
      setToastOpen(true);
      return;
    }
    if (password !== confirmPassword) {
      setToastMsg("Passwords do not match.");
      setToastType("error");
      setToastOpen(true);
      return;
    }
    setLoading(true);
    setToastOpen(false);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const result = await res.json();
      if (res.ok) {
        setToastMsg("Password reset successful! You can now log in.");
        setToastType("success");
        setToastOpen(true);
        setTimeout(() => router.replace("/login"), 1200);
      } else {
        setToastMsg(result.error || "Failed to reset password.");
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
      <Card className="w-full max-w-md shadow-2xl">
        <CardContent className="flex flex-col justify-center p-8">
          <h2 className="text-xl font-semibold mb-4">Reset your password</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              type="password"
              placeholder="New password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              minLength={8}
              required
              disabled={loading}
            />
            <Input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              minLength={8}
              required
              disabled={loading}
            />
            <Button type="submit" disabled={loading} className="mt-2 hover:shadow-lg cursor-pointer">
              {loading ? "Resetting..." : "Reset Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
      <Toast
        message={toastMsg}
        type={toastType}
        open={toastOpen}
        onClose={() => setToastOpen(false)}
        duration={2500}
      />
    </div>
  );
}
