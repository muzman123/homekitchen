"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DriverDashboard() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [tab, setTab] = useState("claimed"); // default: active orders
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const tabs = [
    { label: "Active Orders", value: "claimed" },
    { label: "Unclaimed Orders", value: "pending" },
    { label: "Delivered Orders", value: "completed" },
  ];

  useEffect(() => {
    const storedToken = localStorage.getItem("access_token");
    if (!storedToken) return router.push("/login");

    setToken(storedToken);

    // Verify role
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/me`, {
      headers: { Authorization: `Bearer ${storedToken}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.Role !== "driver") {
          router.push("/feed");
        } else {
          fetchOrders(tab, storedToken);
        }
      });
  }, []);

  useEffect(() => {
    if (token) fetchOrders(tab, token);
  }, [tab]);

  const fetchOrders = async (status, token) => {
    setLoading(true);
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/driver/orders?status=${status[0].toUpperCase() + status.slice(1)}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const data = await res.json();
    setOrders(data);
    setLoading(false);
  };

  const claimOrder = async (orderId) => {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/driver/orders/${orderId}/claim`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchOrders("pending", token);
    setTab("claimed");
  };

  const completeOrder = async (orderId) => {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/driver/orders/${orderId}/complete`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchOrders("claimed", token);
    setTab("completed");
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Driver Dashboard</h1>

      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        {tabs.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`px-4 py-2 rounded ${
              tab === t.value ? "bg-green-600 text-white" : "bg-gray-200 text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Orders */}
      {loading ? (
        <p className="text-gray-500">Loading orders...</p>
      ) : orders.length === 0 ? (
        <p className="text-gray-500">
          {tab === "claimed"
            ? "No active orders"
            : tab === "pending"
            ? "No unclaimed orders"
            : "No delivered orders"}
        </p>
      ) : (
        <ul className="space-y-4">
          {orders.map((order) => (
            <li
              key={order.OrderID}
              className="border p-4 rounded flex flex-col md:flex-row md:justify-between md:items-center"
            >
              <div className="mb-2 md:mb-0">
                <p>
                  <strong>Order ID:</strong> {order.OrderID}
                </p>
                <p>
                  <strong>Total Price:</strong> ${order.TotalPrice}
                </p>
                <p>
                  <strong>Status:</strong> {order.Status}
                </p>
                <p>
                  <strong>ETA:</strong> {order.ETA ?? "Not set"}
                </p>
              </div>

              <div className="flex gap-2">
                {tab === "pending" && (
                  <button
                    onClick={() => claimOrder(order.OrderID)}
                    className="bg-yellow-500 text-white px-3 py-1 rounded"
                  >
                    Claim
                  </button>
                )}
                {tab === "claimed" && (
                  <button
                    onClick={() => completeOrder(order.OrderID)}
                    className="bg-blue-600 text-white px-3 py-1 rounded"
                  >
                    Mark as Delivered
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
