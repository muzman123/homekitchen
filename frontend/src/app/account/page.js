"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.replace("/login");
      return;
    }

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/me/`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(async (res) => {
        if (res.status === 401) {
          router.replace("/login");
          return;
        }
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.detail || "Failed to load account");
        }
        return res.json();
      })
      .then((data) => setUser(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) return <div className="p-8 text-center">Loading account…</div>;
  if (error)   return <div className="p-8 text-red-500 text-center">{error}</div>;
  if (!user)  return null; // redirecting…

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-md mx-auto bg-white shadow-md rounded-lg overflow-hidden">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold mb-2">
            {user.FirstName} {user.LastName}
          </h1>
          <p className="text-gray-700 mb-1"><strong>Email:</strong> {user.Email}</p>
          <p className="text-gray-700 mb-1"><strong>Phone:</strong> {user.PhoneNo}</p>
          <p className="text-gray-700 mb-4"><strong>Role:</strong> {user.Role}</p>
          
          {user.Role === "customer" && (
            <>
              <h2 className="text-lg font-semibold mb-2">Saved Addresses</h2>
              {user.Addresses && user.Addresses.length > 0 ? (
                <ul className="list-disc list-inside space-y-1">
                  {user.Addresses.map((addr, i) => (
                    <li key={i} className="text-gray-600">{addr}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">No saved addresses.</p>
              )}
            </>
          )}

          {user.Role === "owner" && (
            <>
              <h2 className="text-lg font-semibold mb-2">Your Kitchens</h2>
              {user.HomeKitchens && user.HomeKitchens.length > 0 ? (
                <ul className="space-y-1">
                  {user.HomeKitchens.map((k, i) => (
                    <li
                      key={i}
                      className="text-gray-600 hover:text-green-600 cursor-pointer"
                      onClick={() => router.push(`/restaurants/${k[0]}`)}
                    >
                      {k[1] /* assuming column 1 is kitchen name */}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">You haven’t added any kitchens yet.</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
