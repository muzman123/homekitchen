"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CreateKitchen() {
  const router = useRouter();
  const [name, setName]           = useState("");
  const [address, setAddress]     = useState("");
  const [logo, setLogo]           = useState("");
  const [error, setError]         = useState(null);
  const [loading, setLoading]     = useState(false);
  const [token, setToken]         = useState(null);

  // grab token & verify owner before showing form
  useEffect(() => {
    const t = localStorage.getItem("access_token");
    if (!t) {
      router.replace("/login");
      return;
    }
    setToken(t);

    // Optionally decode or call /me to check role === owner
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/me/`, {
      headers: { Authorization: `Bearer ${t}` },
    })
      .then((r) => {
        if (r.status !== 200) throw new Error();
        return r.json();
      })
      .then((u) => {
        if (u.Role !== "owner") router.replace("/login");
      })
      .catch(() => router.replace("/login"));
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!name || !address) {
      setError("Name and address are required.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        Name: name,
        Address: address,
        AverageRating: null,
        VerifiedBy: null,
        ApprovalStatus: "pending",
        Logo: logo || null,
      };

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/homekitchens/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to create kitchen");
      }

      router.push("/feed");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white shadow-md rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-4">Create Your Home Kitchen</h1>
        {error && (
          <div className="mb-4 text-red-500 text-sm text-center">{error}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">
              Logo URL (optional)
            </label>
            <input
              type="url"
              value={logo}
              onChange={(e) => setLogo(e.target.value)}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition"
          >
            {loading ? "Creating…" : "Create Kitchen"}
          </button>
        </form>
      </div>
    </div>
  );
}
