"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const router = useRouter();

  // States for email, password, error message, and loading indicator
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]     = useState(null);
  const [loading, setLoading]   = useState(false);

  // Handle form submission to call the FastAPI /auth/token endpoint
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Build URL-encoded form data for OAuth2PasswordRequestForm
      const formData = new URLSearchParams();
      formData.append("username", email);
      formData.append("password", password);

      // Authenticate and get JWT
      const response = await fetch(
        process.env.NEXT_PUBLIC_API_URL + "/auth/token",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: formData.toString(),
        }
      );

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Login failed.");
      }

      const data = await response.json();
      localStorage.setItem("access_token", data.access_token);

      //Fetch /me to get the user’s role
      const meRes = await fetch(process.env.NEXT_PUBLIC_API_URL + "/me", {
        headers: {
          Authorization: `Bearer ${data.access_token}`,
        },
      });
      if (!meRes.ok) throw new Error("Failed to fetch user info");
      const meData = await meRes.json();
      const role = meData.Role;

      //Redirect based on role
      if (role === "driver")       router.push("/driver");
      else if (role === "admin")   router.push("/admin");
      else                          router.push("/feed");

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white p-8 shadow-md rounded">
        <h2 className="text-2xl text-black font-bold text-center mb-6">Log In</h2>

        {error && <div className="mb-4 text-red-500 text-center">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded text-gray-500"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded text-gray-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 rounded transition-colors hover:bg-green-700"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-gray-500">
          New here?{" "}
          <button
            onClick={() => router.push("/signup")}
            className="text-green-600 font-bold hover:underline"
          >
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
}
