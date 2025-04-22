// src/app/homekitchens/page.js
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
  const [planItems, setPlanItems] = useState({});
  const [activeTab, setActiveTab] = useState("menu");
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  // owner form state
  const [newItem, setNewItem]     = useState({ Name: "", Description: "", Price: "", Image: "" });
  const [newMeal, setNewMeal]     = useState({ Name: "", TotalPrice: "", Image: "", Items: [] });
  const [itemIdInput, setItemIdInput] = useState("");

  // modal/subscription state
  const [showModal, setShowModal]     = useState(false);
  const [modalPlanId, setModalPlanId] = useState(null);
  const [selectedQty, setSelectedQty] = useState(4);

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

    // fetch /me and list of kitchens to find this one
    Promise.all([
      fetch(`${API}/me/`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => {
          if (res.status === 401) throw new Error("unauth");
          return res.json();
        })
        .then(u => ({ uid: u.UID, role: u.Role })),
      fetch(`${API}/homekitchens/`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => res.json())
    ])
      .then(([u, list]) => {
        setUser(u);
        const found = list
          .map(r => ({
            id:             r[0],
            ownerUID:       r[1],
            name:           r[2],
            address:        r[3],
            averageRating:  r[4],
            approvalStatus: r[6],
            logo:           r[7],
          }))
          .find(k => k.id === Number(kitchenId));
        if (!found) throw new Error("Kitchen not found");
        setKitchen(found);
        return { token, kitchenId };
      })
      .then(({ token, kitchenId }) =>
        Promise.all([
          // fetch menu items
          fetch(`${API}/homekitchens/${kitchenId}/menuitems`, {
            headers: { Authorization: `Bearer ${token}` }
          }).then(async res => {
            if (res.status === 404) return [];
            if (!res.ok) throw new Error((await res.json()).detail);
            return res.json();
          }),
          // fetch meal plans
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

  // when switching to meal tab, fetch each plan's items
  useEffect(() => {
    if (activeTab !== "meal") return;
    const token = localStorage.getItem("access_token");
    mealPlans.forEach(plan => {
      const planId = plan[0];
      if (planItems[planId] !== undefined) return;
      fetch(`${API}/homekitchens/${kitchenId}/${planId}/items`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(async res => {
          if (res.status === 404) return [];
          if (!res.ok) throw new Error((await res.json()).detail);
          return res.json();
        })
        .then(items => {
          setPlanItems(prev => ({ ...prev, [planId]: items }));
        })
        .catch(console.error);
    });
  }, [activeTab, mealPlans, kitchenId, planItems]);

  if (loading) return <div className="p-8 text-center">Loading…</div>;
  if (error)   return <div className="p-8 text-red-500 text-center">{error}</div>;

  const isOwner = user.role === "owner" && user.uid === kitchen.ownerUID;

  // Owner: add menu item
  const handleAddItem = async e => {
    e.preventDefault();
    const token = localStorage.getItem("access_token");
    await fetch(`${API}/homekitchens/${kitchen.id}/menuitems`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ ...newItem, Items: [] })
    });
    setMenuItems([...menuItems, { ...newItem, ItemID: Date.now() }]);
    setNewItem({ Name: "", Description: "", Price: "", Image: "" });
  };

  // Owner: add meal plan
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

  // Customer: add menu item to cart
  const addToCart = item => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const idx  = cart.findIndex(ci => ci.ItemID === item[0]);
    if (idx > -1) cart[idx].quantity++;
    else cart.push({
      ItemID:   item[0],
      KitchenID: kitchenId,
      Kitchen:  kitchen.name,
      name:     item[2],
      price:    item[4],
      image:    item[5],
      quantity: 1
    });
    localStorage.setItem("cart", JSON.stringify(cart));
  };

  // Modal helpers
  const openModal  = planId => { setModalPlanId(planId); setSelectedQty(4); setShowModal(true); };
  const closeModal = ()       => setShowModal(false);

  const subscribePlan = async () => {
    const plan = mealPlans.find(p => p[0] === modalPlanId);
    const ETA  = new Date().toTimeString().split(" ")[0];
    const payload = {
      KitchenID:  Number(kitchenId),
      Items:      (planItems[modalPlanId] || []).map(item => ({ ItemID: item[0], Quantity: selectedQty })),
      ETA,
      TotalPrice: plan[3] * selectedQty
    };
    const res = await fetch(`${API}/order/`, {
      method:  "POST",
      headers: {
        "Content-Type":"application/json",
        Authorization:`Bearer ${localStorage.getItem("access_token")}`
      },
      body:    JSON.stringify(payload)
    });
    if (res.ok) {
      closeModal();
      alert("Subscribed successfully!");
    } else {
      const e = await res.json();
      alert("Error: " + (e.detail || res.statusText));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-3xl mx-auto bg-white shadow-md rounded-lg overflow-hidden">
        {/* Kitchen header */}
        <button
           onClick={() => router.push("/feed")}
           title="Back to Feed"
           className="
             text-2xl 
             p-2 rounded 
             hover:bg-gray-200 
             active:bg-gray-300 
             transition 
            duration-150
            "
         >
           ←
         </button>
        <div className="p-4 border-b">
          <h1 className="text-2xl font-bold text-black">{kitchen.name}</h1>
          <p className="text-gray-600">{kitchen.address}</p>
        </div>

        {isOwner ? (
          // OWNER VIEW
          <div className="p-6 space-y-8 text-black">
            {/* Existing Menu Items */}
            <div>
              <h2 className="text-lg font-semibold mb-2">Existing Menu Items</h2>
              {menuItems.length === 0 ? (
                <p className="text-gray-600">No menu items yet.</p>
              ) : (
                <ul className="space-y-2">
                  {menuItems.map(mi => (
                    <li key={mi[0]} className="flex items-center space-x-4 border p-2 rounded">
                      <span className="font-mono text-sm text-gray-500">#{mi[0]}</span>
                      <img src={mi[5]} alt={mi[2]} className="w-12 h-12 object-cover rounded" />
                      <div className="flex-1">
                        <h3 className="font-semibold">{mi[2]}</h3>
                        <p className="text-sm text-gray-600">{mi[3]}</p>
                      </div>
                      <span className="font-semibold text-green-600">${mi[4]}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Add Menu Item Form */}
            <form onSubmit={handleAddItem} className="space-y-4">
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
                Add Menu Item
              </button>
            </form>

            {/* Add Meal Plan Form */}
            <form onSubmit={handleAddMeal} className="space-y-4">
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
                  Add to Plan
                </button>
              </div>
              <div className="text-sm text-gray-600">
                Items in plan: {newMeal.Items.join(", ")}
              </div>
              <button className="bg-green-600 text-white px-4 py-2 rounded">
                Add Meal Plan
              </button>
            </form>
          </div>
        ) : (
          // CUSTOMER VIEW
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
                    <div key={item[0]} className="flex items-center justify-between space-x-4">
                      <div className="flex items-center space-x-4">
                        <img src={item[5]} alt={item[2]} className="w-16 h-16 object-cover rounded" />
                        <div>
                          <h3 className="font-semibold text-black">{item[2]}</h3>
                          <p className="text-sm text-gray-600">{item[3]}</p>
                          <p className="text-green-600 font-semibold">${item[4]}</p>
                        </div>
                      </div>
                      <button
                      onClick={() => {
                        addToCart(item);
                        alert("Item added to cart");
                      }}
                      className="px-3 py-1 bg-green-600 text-white rounded hover:scale-110 hover:ring-2 hover:ring-green-500 hover:ring-offset-1 transition"
                    >
                      +
                    </button>
                    </div>
                  ))
                : mealPlans.map(plan => {
                    const planId   = plan[0];
                    const name     = plan[2];
                    const price    = plan[3];
                    const imageUrl = plan[4];

                    return (
                      <div key={planId} className="border p-4 rounded space-y-2">
                        <div className="flex items-center space-x-4">
                          <img src={imageUrl} alt={name} className="w-24 h-24 object-cover rounded" />
                          <div>
                            <h3 className="font-semibold">{name}</h3>
                            <p className="text-green-600 font-semibold">${price.toFixed(2)}</p>
                          </div>
                        </div>
                        <div className="pl-4">
                          <h4 className="font-medium">Includes:</h4>
                          {planItems[planId] ? (
                            <ul className="list-disc list-inside space-y-1">
                              {planItems[planId].map(item => (
                                <li key={item[0]}>
                                  <strong>{item[2]}</strong> — {item[3]}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-gray-500 text-sm">Loading items…</p>
                          )}
                        </div>
                        <button onClick={() => openModal(planId)} className="px-4 py-2 bg-green-600 text-white rounded hover:scale-110 hover:ring-2 hover:ring-green-500 hover:ring-offset-1">
                          Subscribe
                        </button>
                      </div>
                    );
                  })}
            </div>
          </div>
        )}
      </div>

      {/* Subscription Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded max-w-md w-full space-y-4">
            <h2 className="text-xl font-bold">Subscribe to Plan</h2>
            <ul className="list-disc pl-5 max-h-40 overflow-auto">
              {planItems[modalPlanId]?.map(item => (
                <li key={item[0]}>
                  <strong>{item[2]}</strong> — {item[3]} (${item[4].toFixed(2)})
                </li>
              )) || <p>Loading…</p>}
            </ul>
            <div className="flex items-center">
              <label className="mr-2">Meals/week:</label>
              <select value={selectedQty} onChange={e => setSelectedQty(+e.target.value)} className="border px-2 py-1 rounded">
                {[4,5,6].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <p>Total: ${(mealPlans.find(p=>p[0]===modalPlanId)[3] * (selectedQty/5)).toFixed(2)}</p>
            <div className="flex justify-end space-x-2">
              <button onClick={closeModal} className="px-4 py-2 bg-gray-200 rounded hover:scale-110 hover:ring-2 hover:ring-green-500 hover:ring-offset-1">Cancel</button>
              <button onClick={subscribePlan} className="px-4 py-2 bg-green-600 text-white rounded hover:scale-110 hover:ring-2 hover:ring-green-500 hover:ring-offset-1">Select This Plan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
