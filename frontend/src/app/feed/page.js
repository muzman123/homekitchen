"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RestaurantFeed() {
  const router = useRouter();
  const [kitchens, setKitchens] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.replace("/login");
      return;
    }

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/homekitchens/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (res.status === 401) {
          router.replace("/login");
          return;
        }
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.detail || "Failed to load home kitchens");
        }
        return res.json();
      })
      .then((data) => {
        setKitchens(
          data.map((row) => ({
            id:             row[0],
            ownerUID:       row[1],
            name:           row[2],
            address:        row[3],
            averageRating:  row[4],
            verifiedBy:     row[5],
            approvalStatus: row[6],
            logo:           row[7],
          }))
        );
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) return <div className="p-8 text-center">Loading feed…</div>;
  if (error)   return <div className="p-8 text-red-500 text-center">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div
            className="text-2xl font-bold text-green-600 cursor-pointer"
            onClick={() => router.push("/")}
          >
            HomeKitchen
          </div>
          <div className="flex-1 max-w-lg mx-4">
            <input
              type="text"
              placeholder="Search kitchens..."
              className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            {localStorage.getItem("access_token") ? (
              <img
                src="/avatar-placeholder.png"
                alt="Account"
                className="w-8 h-8 rounded-full cursor-pointer"
                onClick={() => router.push("/account")}
              />
            ) : (
              <div className="space-x-4">
                <button
                  className="px-4 py-2 text-green-600 border border-green-600 rounded-full hover:bg-green-50"
                  onClick={() => router.push("/login")}
                >
                  Log in
                </button>
                <button
                  className="px-4 py-2 bg-green-600 text-white rounded-full hover:bg-green-700"
                  onClick={() => router.push("/signup")}
                >
                  Sign up
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Feed */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-3xl font-semibold text-gray-800 mb-6">
          Browse Home Kitchens
        </h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {kitchens.map((k) => (
            <div
              key={k.id}
              className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition cursor-pointer"
              onClick={() => router.push(`/homekitchens?id=${k.id}`)}
            >
              <img
                src={
                  k.logo
                    ? k.logo
                    : `https://via.placeholder.com/400x200?text=${encodeURIComponent(
                        k.name
                      )}`
                }
                alt={k.name}
                className="w-full h-36 object-cover"
              />
              <div className="px-4 py-3">
                <h3 className="text-lg font-medium text-gray-800">{k.name}</h3>
                <div className="mt-1 flex items-center text-sm text-gray-600">
                  <span className="text-green-600 mr-1">★</span>
                  <span className="font-semibold text-green-600">
                    {k.averageRating?.toFixed(1) ?? "—"}
                  </span>
                  <span className="ml-1 text-gray-500 capitalize">
                    {k.approvalStatus || "—"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
