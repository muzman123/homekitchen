// src/app/checkout/page.js
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart]               = useState([]);
  const [groups, setGroups]           = useState([]);
  const [address, setAddress]         = useState("");
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [error, setError]             = useState(null);

  const API = process.env.NEXT_PUBLIC_API_URL;

  // redirect if not logged in
  useEffect(() => {
    if (!localStorage.getItem("access_token")) router.replace("/login");
  }, [router]);

  // load cart & group by KitchenID
  useEffect(() => {
    const c = JSON.parse(localStorage.getItem("cart") || "[]");
    setCart(c);

    const byKitchen = c.reduce((acc, item) => {
      const key = item.KitchenID;
      if (!acc[key]) {
        acc[key] = {
          KitchenID: key,
          Kitchen:   item.Kitchen,
          Items:     [],
          Total:     0
        };
      }
      acc[key].Items.push({
        ItemID:   item.ItemID,
        Quantity: item.quantity
      });
      acc[key].Total += item.price * item.quantity;
      return acc;
    }, {});
    setGroups(Object.values(byKitchen));
  }, []);

  // fetch user address
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    fetch(`${API}/me/`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(u => {
        // assume first address
        setAddress((u.Addresses && u.Addresses[0]) || "");
      })
      .catch(() => setAddress(""));
  }, []);

  const grandTotal = groups.reduce((sum, g) => sum + g.Total, 0);

  const placeOrders = async () => {
    setLoadingOrders(true);
    setError(null);

    // compute an ETA 30min from now in HH:MM:SS
    const now = new Date(Date.now() + 30 * 60000);
    const ETA = now.toTimeString().split(" ")[0];

    const token = localStorage.getItem("access_token");

    try {
      // fire one POST per kitchen
      await Promise.all(
        groups.map(group =>
          fetch(`${API}/order/`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              KitchenID:   group.KitchenID,
              Items:       group.Items,
              ETA,
              TotalPrice:  Math.round(group.Total)
            })
          }).then(async res => {
            if (!res.ok) {
              const err = await res.json();
              throw new Error(err.detail || `Order to kitchen ${group.KitchenID} failed`);
            }
          })
        )
      );

      // all succeeded
      localStorage.removeItem("cart");
      router.push("/feed");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingOrders(false);
    }
  };

  if (!localStorage.getItem("access_token")) return null;

  return (
    <div className="min-h-screen bg-gray-50 text-black p-6">
      <div className="max-w-3xl mx-auto bg-white p-6 rounded shadow">
        <h1 className="text-2xl font-bold mb-4">Checkout</h1>

        {groups.length === 0 ? (
          <p className="text-gray-600">Your cart is empty.</p>
        ) : (
          <>
            <div className="mb-6">
              <h2 className="font-semibold">Delivery Address</h2>
              <p className="text-gray-800">{address || "No address on file"}</p>
            </div>

            {groups.map((g) => (
              <div key={g.KitchenID} className="mb-6 border p-4 rounded">
                <h3 className="font-semibold mb-2">{g.Kitchen}</h3>
                <ul className="space-y-2 mb-2">
                  {g.Items.map((it) => (
                    <li key={it.ItemID} className="flex justify-between">
                      <span>Item #{it.ItemID}</span>
                      <span>Qty: {it.Quantity}</span>
                    </li>
                  ))}
                </ul>
                <div className="text-right font-semibold">
                  Subtotal: ${g.Total.toFixed(2)}
                </div>
              </div>
            ))}

            <div className="flex justify-between text-lg font-bold mb-6">
              <span>Grand Total:</span>
              <span>${grandTotal.toFixed(2)}</span>
            </div>

            {error && <p className="text-red-500 mb-4">{error}</p>}

            <button
              onClick={placeOrders}
              disabled={loadingOrders}
              className={`w-full py-2 rounded text-white ${
                loadingOrders
                  ? "bg-gray-400"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {loadingOrders ? "Placing orders…" : "Place Orders"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
