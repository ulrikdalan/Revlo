"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Noe gikk galt");
      }

      setMessage(
        "Hvis adressen finnes i systemet, vil du motta en e-post med instruksjoner for å tilbakestille passordet."
      );
      setEmail("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-md">
        <h1 className="mb-6 text-center text-2xl font-bold text-gray-900">
          Glemt passord
        </h1>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-gray-900"
            >
              E-postadresse
            </label>
            <input
              type="email"
              id="email"
              className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
              placeholder="din@epost.no"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-blue-600 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:opacity-70"
          >
            {isLoading ? "Sender..." : "Send tilbakestillingslink"}
          </button>
        </form>

        {message && (
          <div className="mt-4 rounded-lg bg-green-100 p-4 text-sm text-green-800">
            {message}
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-lg bg-red-100 p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        <div className="mt-4 text-center text-sm">
          <Link
            href="/login"
            className="font-medium text-blue-600 hover:underline"
          >
            Tilbake til innlogging
          </Link>
        </div>
      </div>
    </div>
  );
} 