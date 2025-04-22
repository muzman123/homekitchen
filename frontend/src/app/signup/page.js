"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Signup() {
  const router = useRouter();

  // Form state
  const [role, setRole]             = useState("customer");
  const [firstName, setFirstName]   = useState("");
  const [lastName, setLastName]     = useState("");
  const [email, setEmail]           = useState("");
  const [phoneNo, setPhoneNo]       = useState("");
  const [password, setPassword]     = useState("");
  const [confirmPassword, setConfirm] = useState("");
  const [address, setAddress]       = useState("");
  const [error, setError]           = useState(null);
  const [loading, setLoading]       = useState(false);

  const API = process.env.NEXT_PUBLIC_API_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!firstName || !lastName || !email || !phoneNo || !password) {
      setError("Please fill in all required fields.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (role === "customer" && !address) {
      setError("Please enter your address.");
      return;
    }

    setLoading(true);
    try {
      // 1) Create user
      const signupPayload = {
        FirstName: firstName,
        LastName:  lastName,
        Email:     email,
        PhoneNo:   phoneNo,
        Password:  password,
        Role:      role,
        Address:   role === "customer" ? address : ""
      };

      const signupRes = await fetch(`${API}/auth/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(signupPayload),
      });

      if (!signupRes.ok) {
        const errData = await signupRes.json();
        throw new Error(errData.detail || "Signup failed.");
      }

      // 2) If owner, auto-login and go to create-kitchen
      if (role === "owner") {
        const formData = new URLSearchParams();
        formData.append("username", email);
        formData.append("password", password);

        const loginRes = await fetch(`${API}/auth/token`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: formData.toString(),
        });

        if (!loginRes.ok) {
          const errData = await loginRes.json();
          throw new Error(errData.detail || "Auto-login failed.");
        }

        const { access_token } = await loginRes.json();
        localStorage.setItem("access_token", access_token);
        router.push("/create-kitchen");
      } else {
        // 3) Otherwise, send them to login
        router.push("/login");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-lg bg-white shadow-md rounded-lg">
        {/* Role Tabs */}
        <div className="flex">
          {["customer", "owner", "driver"].map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={`flex-1 py-3 text-center font-medium ${
                role === r
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              } rounded-t-lg`}
            >
              {r === "customer"
                ? "Customer"
                : r === "owner"
                ? "Restaurant Owner"
                : "Driver"}
            </button>
          ))}
        </div>

        <div className="p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-800 capitalize">
            {role} Sign Up
          </h2>

          {error && (
            <div className="mb-4 text-red-500 text-center">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="flex-1 px-3 py-2 border rounded text-gray-500"
                required
              />
              <input
                type="text"
                placeholder="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="flex-1 px-3 py-2 border rounded text-gray-500"
                required
              />
            </div>

            {/* Email & Phone */}
            <div className="flex gap-4">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 px-3 py-2 border rounded text-gray-500"
                required
              />
              <input
                type="tel"
                placeholder="Phone No."
                value={phoneNo}
                onChange={(e) => setPhoneNo(e.target.value)}
                className="flex-1 px-3 py-2 border rounded text-gray-500"
                required
              />
            </div>

            {/* Address only for customers */}
            {role === "customer" && (
              <input
                type="text"
                placeholder="Address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 border rounded text-gray-500"
                required
              />
            )}

            {/* Password */}
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded text-gray-500"
              required
            />

            {/* Confirm Password */}
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full px-3 py-2 border rounded text-gray-500"
              required
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-2 rounded-md font-semibold hover:bg-green-700 transition"
            >
              {loading ? "Creating account…" : "Sign Up"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{" "}
            <button
              onClick={() => router.push("/login")}
              className="text-green-600 font-semibold hover:underline"
            >
              Log in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
