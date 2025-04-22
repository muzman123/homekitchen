// src/app/cart/page.js
"use client";

import { useState, useEffect } from "react";
import { useRouter }       from "next/navigation";

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart]     = useState([]);
  const [total, setTotal]   = useState(0);

  useEffect(() => {
    const c = JSON.parse(localStorage.getItem("cart") || "[]");
    setCart(c);
  }, []);

  useEffect(() => {
    setTotal(
      cart.reduce((acc, i) => acc + i.price * i.quantity, 0)
    );
  }, [cart]);

  const updateQty = (idx, delta) => {
    const copy = [...cart];
    copy[idx].quantity = Math.max(1, copy[idx].quantity + delta);
    setCart(copy);
    localStorage.setItem("cart", JSON.stringify(copy));
  };

  const removeItem = idx => {
    const copy = [...cart];
    copy.splice(idx, 1);
    setCart(copy);
    localStorage.setItem("cart", JSON.stringify(copy));
  };

  // redirect if not logged in
  useEffect(() => {
    if (!localStorage.getItem("access_token")) {
      router.replace("/login");
    }
  }, [router]);

  if (!localStorage.getItem("access_token")) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 text-black p-6">
      <div className="max-w-2xl mx-auto bg-white p-6 rounded shadow">
        <h1 className="text-2xl font-bold mb-4">Your Cart</h1>
        {cart.length === 0 ? (
          <p className="text-gray-600">Your cart is empty.</p>
        ) : (
          <div className="space-y-4">
            {cart.map((item, idx) => (
              <div
                key={item.ItemID}
                className="flex items-center justify-between"
              >
                <div className="flex items-center space-x-4">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div>
                    <h3 className="font-semibold">{item.name}</h3>
                    <h3 className="font-semibold">{item.KitchenID}</h3>
                    <p className="text-sm text-gray-500">{item.Kitchen}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => updateQty(idx, -1)}
                    className="px-2 bg-gray-200 rounded"
                  >
                    −
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    onClick={() => updateQty(idx, +1)}
                    className="px-2 bg-gray-200 rounded"
                  >
                    +
                  </button>
                  <span className="w-16 text-right">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                  <button
                    onClick={() => removeItem(idx)}
                    className="text-red-500"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
            <div className="flex justify-between font-semibold text-lg border-t pt-4">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <button
              className="w-full mt-4 bg-green-600 text-white py-2 rounded hover:bg-green-700"
              onClick={() => router.push("/checkout")}
            >
              Checkout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
