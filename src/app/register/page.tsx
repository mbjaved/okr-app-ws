"use client";

import { Metadata } from "next";
import { Card, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Toast from "../../components/ui/Toast";
import Image from "next/image";


const registerSchema = z.object({
  name: z.string().min(2, { message: "Name is required" }),
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string()
    .min(8, { message: "Password must be at least 8 characters" })
    .regex(/[0-9]/, { message: "Must include a digit" })
    .regex(/[!@#$%^&*]/, { message: "Must include a special character" }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState<"success" | "error" | "info">("success");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  async function onSubmit(data: RegisterFormValues) {
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
        }),
      });
      const result = await res.json();
      if (!res.ok) {
        setError(result.error || "Registration failed");
      } else {
        setToastMsg("Registration successful! Please log in.");
        setToastType("success");
        setToastOpen(true);
        reset();
        setTimeout(() => {
          router.replace("/login");
        }, 1200);
      }
    } catch (e) {
      setError("Server error. Please try again later.");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAFAFB] p-4">
      <Card className="w-full max-w-2xl flex flex-row shadow-2xl">
        {/* Left section: Mascot & Welcome */}
        <div className="flex flex-col items-center justify-center w-1/2 bg-white p-8 rounded-l-md">
          <Image src="/mascot.png" alt="Robot mascot" width={80} height={80} />
          <h1 className="text-2xl font-bold mt-4">🎉 Join OKR App – Let’s Achieve Greatness Together!</h1>
        </div>
        {/* Right section: Register Form */}
        <CardContent className="w-1/2 flex flex-col justify-center p-8">
          <h2 className="text-xl font-semibold mb-4">Create Your Account</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input
              type="text"
              placeholder="Enter your full name."
              {...register("name")}
              disabled={isSubmitting}
            />
            {errors.name && <span className="text-red-500 text-xs">{errors.name.message}</span>}
            <Input
              type="email"
              placeholder="Enter your email."
              {...register("email")}
              disabled={isSubmitting}
            />
            {errors.email && <span className="text-red-500 text-xs">{errors.email.message}</span>}
            <Input
              type="password"
              placeholder="Create a secure password."
              {...register("password")}
              disabled={isSubmitting}
            />
            <ul className="text-xs text-gray-500 mb-2">
              <li>• At least 8 characters</li>
              <li>• One digit</li>
              <li>• One special character (!@#$%^&*)</li>
            </ul>
            {errors.password && <span className="text-red-500 text-xs">{errors.password.message}</span>}
            <Input
              type="password"
              placeholder="Confirm your password."
              {...register("confirmPassword")}
              disabled={isSubmitting}
            />
            {errors.confirmPassword && <span className="text-red-500 text-xs">{errors.confirmPassword.message}</span>}
            {error && <span className="text-red-500 text-xs">{error}</span>}

            <Button type="submit" disabled={isSubmitting} className="mt-2 hover:shadow-lg cursor-pointer">Create My Account</Button>
          </form>
          <div className="mt-4 flex flex-col gap-2">
            <span className="text-sm">Already have an account? <a href="/login" className="text-blue-600 hover:underline cursor-pointer">Log in.</a></span>
          </div>
        </CardContent>
      </Card>
      {/* Toast Notification */}
      <Toast
        message={toastMsg}
        type={toastType}
        open={toastOpen}
        onClose={() => setToastOpen(false)}
        duration={2200}
      />
    </div>
  );
}
