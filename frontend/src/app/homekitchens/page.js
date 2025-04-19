"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function KitchenPage() {
  const router    = useRouter();
  const params    = useSearchParams();
  const kitchenId = params.get("id");

  const [user, setUser]           = useState(null);
  const [kitchen, setKitchen]     = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [mealPlans, setMealPlans] = useState([]);
  const [activeTab, setActiveTab] = useState("menu");
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  // owner form state
  const [newItem, setNewItem]     = useState({ Name: "", Description: "", Price: "", Image: "" });
  const [newMeal, setNewMeal]     = useState({ Name: "", TotalPrice: "", Image: "", Items: [] });
  const [itemIdInput, setItemIdInput] = useState("");

  const API = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    if (!kitchenId) {
      router.replace("/feed");
      return;
    }
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.replace("/login");
      return;
    }

    Promise.all([
      // 1) get /me and normalize fields
      fetch(`${API}/me/`, { headers: { Authorization: `Bearer ${token}` } }).then(res => {
        if (res.status === 401) throw new Error("unauth");
        return res.json();
      }).then(u => ({ uid: u.UID, role: u.Role })),
      // 2) get all kitchens to find ours
      fetch(`${API}/homekitchens/`, { headers: { Authorization: `Bearer ${token}` } }).then(res => res.json())
    ])
      .then(([u, list]) => {
        setUser(u);
        const found = list
          .map(row => ({
            id:             row[0],
            ownerUID:       row[1],
            name:           row[2],
            address:        row[3],
            averageRating:  row[4],
            approvalStatus: row[6],
            logo:           row[7],
          }))
          .find(k => k.id === Number(kitchenId));
        if (!found) throw new Error("Kitchen not found");
        setKitchen(found);
        return { token, kitchenId };
      })
      .then(({ token, kitchenId }) =>
        Promise.all([
          // menu items (404 → [])
          fetch(`${API}/homekitchens/${kitchenId}/menuitems`, {
            headers: { Authorization: `Bearer ${token}` }
          }).then(async res => {
            if (res.status === 404) return [];
            if (!res.ok) throw new Error((await res.json()).detail);
            return res.json();
          }),
          // meal plans (404 → [])
          fetch(`${API}/homekitchens/${kitchenId}/mealplans`, {
            headers: { Authorization: `Bearer ${token}` }
          }).then(async res => {
            if (res.status === 404) return [];
            if (!res.ok) throw new Error((await res.json()).detail);
            return res.json();
          })
        ])
      )
      .then(([items, plans]) => {
        setMenuItems(items);
        setMealPlans(plans);
      })
      .catch(err => {
        if (err.message === "unauth") router.replace("/login");
        else setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [kitchenId, router]);

  if (loading) return <div className="p-8 text-center">Loading…</div>;
  if (error)   return <div className="p-8 text-red-500 text-center">{error}</div>;

  // use normalized user.uid & user.role
  const isOwner = user.role === "owner" && user.uid === kitchen.ownerUID;

  // --- OWNER handlers ---
  const handleAddItem = async e => {
    e.preventDefault();
    const token = localStorage.getItem("access_token");
    await fetch(`${API}/homekitchens/${kitchen.id}/menuitems`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        ...newItem,
        Items: []        // <— satisfy the Pydantic model
        })
    });
    setMenuItems([...menuItems, { ...newItem, ItemID: Date.now() }]);
    setNewItem({ Name: "", Description: "", Price: "", Image: "" });
  };

  const handleAddMeal = async e => {
    e.preventDefault();
    const token = localStorage.getItem("access_token");
    const payload = {
      Name:       newMeal.Name,
      TotalPrice: parseFloat(newMeal.TotalPrice),
      Image:      newMeal.Image,
      Items:      newMeal.Items.map(i => ({ ItemID: Number(i) }))
    };
    await fetch(`${API}/homekitchens/${kitchen.id}/mealplans`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    setMealPlans([...mealPlans, { ...payload, MealPlanID: Date.now() }]);
    setNewMeal({ Name: "", TotalPrice: "", Image: "", Items: [] });
    setItemIdInput("");
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-3xl mx-auto bg-white shadow-md rounded-lg overflow-hidden">
        {/* Kitchen header */}
        <div className="p-4 border-b">
          <h1 className="text-2xl font-bold">{kitchen.name}</h1>
          <p className="text-gray-600">{kitchen.address}</p>
        </div>

        {isOwner ? (
          <div className="p-6 space-y-6">
            {/* Add Menu Item */}
            <form onSubmit={handleAddItem} className="space-y-3">
              <h2 className="text-lg font-semibold">Add Menu Item</h2>
              <input
                placeholder="Name"
                value={newItem.Name}
                onChange={e => setNewItem({ ...newItem, Name: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                required
              />
              <input
                placeholder="Description"
                value={newItem.Description}
                onChange={e => setNewItem({ ...newItem, Description: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                required
              />
              <input
                type="number"
                placeholder="Price"
                value={newItem.Price}
                onChange={e => setNewItem({ ...newItem, Price: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                required
              />
              <input
                placeholder="Image URL"
                value={newItem.Image}
                onChange={e => setNewItem({ ...newItem, Image: e.target.value })}
                className="w-full px-3 py-2 border rounded"
              />
              <button className="bg-green-600 text-white px-4 py-2 rounded">
                Add Item
              </button>
            </form>

            {/* Add Meal Plan */}
            <form onSubmit={handleAddMeal} className="space-y-3">
              <h2 className="text-lg font-semibold">Add Meal Plan</h2>
              <input
                placeholder="Name"
                value={newMeal.Name}
                onChange={e => setNewMeal({ ...newMeal, Name: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                required
              />
              <input
                type="number"
                placeholder="Total Price"
                value={newMeal.TotalPrice}
                onChange={e => setNewMeal({ ...newMeal, TotalPrice: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                required
              />
              <input
                placeholder="Image URL"
                value={newMeal.Image}
                onChange={e => setNewMeal({ ...newMeal, Image: e.target.value })}
                className="w-full px-3 py-2 border rounded"
              />
              <div className="flex space-x-2">
                <input
                  type="number"
                  placeholder="Menu Item ID"
                  value={itemIdInput}
                  onChange={e => setItemIdInput(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (itemIdInput) {
                      setNewMeal({ ...newMeal, Items: [...newMeal.Items, itemIdInput] });
                      setItemIdInput("");
                    }
                  }}
                  className="px-4 py-2 bg-gray-200 rounded"
                >
                  Add ID
                </button>
              </div>
              <div className="text-sm text-gray-600">Added IDs: {newMeal.Items.join(", ")}</div>
              <button className="bg-green-600 text-white px-4 py-2 rounded">
                Add Meal Plan
              </button>
            </form>
          </div>
        ) : (
          // Customer view
          <div>
            <div className="flex border-b">
              <button
                onClick={() => setActiveTab("menu")}
                className={`flex-1 py-2 text-center ${activeTab === "menu" ? "border-b-2 border-green-600" : ""}`}
              >
                Menu Items
              </button>
              <button
                onClick={() => setActiveTab("meal")}
                className={`flex-1 py-2 text-center ${activeTab === "meal" ? "border-b-2 border-green-600" : ""}`}
              >
                Meal Plans
              </button>
            </div>
            <div className="p-4 space-y-4">
              {activeTab === "menu"
                ? menuItems.map(item => (
                    <div key={item[0]} className="flex items-center space-x-4">
                      <img src={item[5]} alt={item[1]} className="w-16 h-16 object-cover rounded" />
                      <div>
                        <h3 className="font-semibold">{item[1]}</h3>
                        <p className="text-sm text-gray-600">{item[2]}</p>
                        <p className="text-green-600 font-semibold">${item[3]}</p>
                      </div>
                    </div>
                  ))
                : mealPlans.map(plan => (
                    <div key={plan[0]} className="space-y-2">
                      <img src={plan[3]} alt={plan[1]} className="w-full h-32 object-cover rounded" />
                      <h3 className="font-semibold">{plan[1]}</h3>
                      <p className="text-green-600 font-semibold">${plan[2]}</p>
                    </div>
                  ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
