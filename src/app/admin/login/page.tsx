"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/src/actions/auth";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Shield, Loader2 } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const result = await login(formData);

    if (result.success && result.redirect) {
      // Force a hard navigation to ensure cookies are loaded
      window.location.href = result.redirect;
    } else {
      setError(result.message);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">
              Trainform Admin
            </h1>
          </div>
        </div>

        <Card className="border-purple-500/20 shadow-2xl bg-slate-900/50 backdrop-blur">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-white">Super Admin Access</CardTitle>
            <CardDescription className="text-gray-400">
              Restricted access for platform administrators
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-300">
                  Email
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="admin@trainform.com"
                  required
                  disabled={loading}
                  className="bg-slate-800/50 border-purple-500/30 text-white"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-300">
                  Password
                </label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter admin password"
                  required
                  disabled={loading}
                  className="bg-slate-800/50 border-purple-500/30 text-white"
                />
              </div>
              <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Admin Sign in
                  </>
                )}
              </Button>
              <p className="text-center text-sm text-gray-400">
                Regular user?{" "}
                <a href="/login" className="text-purple-400 hover:underline font-medium">
                  Login here
                </a>
              </p>
            </CardContent>
          </form>
        </Card>
      </div>
    </div>
  );
}

