"use client";

import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";

export default function DebugCookiesPage() {
  const [result, setResult] = useState<any>(null);

  async function testCookie() {
    const response = await fetch("/api/test-cookie");
    const data = await response.json();
    setResult(data);
  }

  function checkBrowserCookies() {
    const cookies = document.cookie.split(";").map((c) => c.trim());
    setResult({
      success: true,
      message: "Browser cookies",
      cookies: cookies.map((c) => {
        const [name, value] = c.split("=");
        return { name, value: value?.substring(0, 20) + "..." };
      }),
    });
  }

  return (
    <div className="min-h-screen p-8 bg-background">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Cookie Debug Tool</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button onClick={testCookie}>Test Server Cookie</Button>
              <Button onClick={checkBrowserCookies} variant="outline">
                Check Browser Cookies
              </Button>
            </div>

            {result && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <pre className="text-sm overflow-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}

            <div className="mt-6 space-y-2 text-sm">
              <p className="font-semibold">Instructions:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Click "Test Server Cookie" to set a cookie from server</li>
                <li>Open DevTools (F12) → Application → Cookies</li>
                <li>Check if cookies appear</li>
                <li>Click "Check Browser Cookies" to see what JavaScript can read</li>
              </ol>
              
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="font-semibold text-yellow-900">Note:</p>
                <p className="text-yellow-800">
                  HttpOnly cookies won't appear in "Check Browser Cookies" - 
                  that's correct behavior. They should only appear in DevTools.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

