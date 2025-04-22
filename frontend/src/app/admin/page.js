"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();
  const [userRole, setUserRole] = useState("");
  const [token, setToken] = useState("");
  const [drivers, setDrivers] = useState([]);
  const [kitchens, setKitchens] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("access_token");
    if (!storedToken) return router.push("/login");
    setToken(storedToken);

    fetch(process.env.NEXT_PUBLIC_API_URL + "/me", {
      headers: { Authorization: `Bearer ${storedToken}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.Role !== "admin") {
          router.push("/feed");
        } else {
          setUserRole("admin");
          loadDashboard(storedToken);
        }
      });
  }, []);

  const loadDashboard = async (token) => {
    const [driversRes, kitchensRes, usersRes] = await Promise.all([
      fetch(process.env.NEXT_PUBLIC_API_URL + "/admin/pending-drivers", {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch(process.env.NEXT_PUBLIC_API_URL + "/admin/pending-kitchens", {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch(process.env.NEXT_PUBLIC_API_URL + "/admin/all-users", {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);
    setDrivers(await driversRes.json());
    setKitchens(await kitchensRes.json());
    setUsers(await usersRes.json());
    setLoading(false);
  };

  const approveDriver = async (id) => {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/verify-driver/${id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    });
    loadDashboard(token);
  };

  const approveKitchen = async (id) => {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/approve-kitchen/${id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    });
    loadDashboard(token);
  };

  const deleteUser = async (id) => {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/delete-user/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    loadDashboard(token);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-gray-600">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Pending Drivers</h2>
        {drivers.length === 0 ? (
          <p>No pending drivers</p>
        ) : (
          <ul className="space-y-2">
            {drivers.map((driver) => (
              <li
                key={driver.DriverUID}
                className="flex justify-between items-center border p-3 rounded"
              >
                <span>Driver ID: {driver.DriverUID}</span>
                <button
                  onClick={() => approveDriver(driver.DriverUID)}
                  className="bg-green-600 text-white px-3 py-1 rounded"
                >
                  Approve
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Pending Kitchens</h2>
        {kitchens.length === 0 ? (
          <p>No pending kitchens</p>
        ) : (
          <ul className="space-y-2">
            {kitchens.map((kitchen) => (
              <li
                key={kitchen.KitchenID}
                className="flex justify-between items-center border p-3 rounded"
              >
                <span>Kitchen: {kitchen.Name}</span>
                <button
                  onClick={() => approveKitchen(kitchen.KitchenID)}
                  className="bg-green-600 text-white px-3 py-1 rounded"
                >
                  Approve
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">All Users</h2>
        {users.length === 0 ? (
          <p>No users found</p>
        ) : (
          <ul className="space-y-2">
            {users.map((user) => (
              <li
                key={user.UID}
                className="flex justify-between items-center border p-3 rounded"
              >
                <span>
                  {user.FirstName} {user.LastName} ({user.Role})
                </span>
                <button
                  onClick={() => deleteUser(user.UID)}
                  className="bg-red-600 text-white px-3 py-1 rounded"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}