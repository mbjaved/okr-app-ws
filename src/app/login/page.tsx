"use client";

import { Metadata } from "next";
import { Card, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { signIn } from "next-auth/react";
import { useState } from "react";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";


const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [error, setError] = useState("");
  const searchParams = useSearchParams();
  const router = useRouter();
  const callbackUrl = searchParams.get("callbackUrl") || "/okrs";
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginFormValues) {
    setError("");
    const res = await signIn("credentials", {
      redirect: false,
      email: data.email,
      password: data.password,
      callbackUrl, // Best Practice: pass callbackUrl for post-login redirect
    });
    if (res?.error) setError("Uh-oh! Your email or password isn’t correct. Try again or reset your password.");
    if (res?.ok) router.replace(callbackUrl); // Redirect on success
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAFAFB] p-4">
      <Card className="w-full max-w-2xl flex flex-row shadow-2xl">
        {/* Left section: Mascot & Welcome */}
        <div className="flex flex-col items-center justify-center w-1/2 bg-white p-8 rounded-l-md">
          <Image src="/mascot.png" alt="Robot mascot" width={80} height={80} />
          <h1 className="text-2xl font-bold mt-4">Welcome to OKR App – Your Personal OKR Assistant!</h1>
          <p className="mt-2 text-gray-600">Define goals, track progress, and achieve greatness. Your journey starts here!</p>
          <span className="mt-4 text-lg">🤖 <span className="font-semibold">Hey there! Ready to crush some goals?</span></span>
        </div>
        {/* Right section: Login Form */}
        <CardContent className="w-1/2 flex flex-col justify-center p-8">
          <h2 className="text-xl font-semibold mb-4">Log in to Get Started!</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input
              type="email"
              placeholder="Enter your email."
              {...register("email")}
              disabled={isSubmitting}
            />
            {errors.email && <span className="text-red-500 text-xs">{errors.email.message}</span>}
            <Input
              type="password"
              placeholder="Enter your password."
              {...register("password")}
              disabled={isSubmitting}
            />
            {errors.password && <span className="text-red-500 text-xs">{errors.password.message}</span>}
            {error && <span className="text-red-500 text-xs">{error}</span>}
            <Button type="submit" disabled={isSubmitting} className="mt-2">Log In</Button>
          </form>
          <Button
            variant="outline"
            className="mt-4 flex items-center gap-2"
            onClick={() => signIn("google")}
            disabled={isSubmitting}
          >
            <Image src="/google.svg" alt="Google logo" width={20} height={20} />
            Sign in with Google
          </Button>
          <div className="mt-4 flex flex-col gap-2">
            <a href="#" className="text-blue-600 hover:underline text-sm">Forgot Password?</a>
            <span className="text-sm">Don’t have an account yet? <a href="/register" className="text-blue-600 hover:underline">Create One.</a></span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
