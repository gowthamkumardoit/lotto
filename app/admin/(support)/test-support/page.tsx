/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase"; // adjust import if needed

export default function TestSupportPage() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const sendTestMessage = async () => {
    if (!message.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const sendSupportMessage = httpsCallable(
        functions,
        "sendSupportMessage"
      );

      await sendSupportMessage({ message });

      setResult("✅ Message sent successfully to Telegram");
      setMessage("");
    } catch (err: any) {
      console.error(err);
      setResult(
        err?.message ?? "❌ Failed to send message (check console)"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 space-y-4">
      <h1 className="text-xl font-semibold">
        Telegram Support – Test
      </h1>

      <textarea
        className="w-full min-h-[120px] rounded-md border p-3 text-sm"
        placeholder="Type a test support message..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        disabled={loading}
      />

      <button
        onClick={sendTestMessage}
        disabled={loading}
        className="px-4 py-2 rounded-md bg-black text-white disabled:opacity-50"
      >
        {loading ? "Sending..." : "Send Test Message"}
      </button>

      {result && (
        <div className="text-sm">
          {result}
        </div>
      )}
    </div>
  );
}
