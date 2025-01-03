"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface Order {
  id: number;
  table_id: number;
  menu_item_id: number;
  quantity: number;
  phone_number: string;
  status: string;
  menu_items: {
    name: string;
    price: number;
  };
}

const WaiterPage = () => {
  const [tables, setTables] = useState<any[]>([]);
  const [menu, setMenu] = useState<any[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [selectedMenuItem, setSelectedMenuItem] = useState<number | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [phoneNumbers, setPhoneNumbers] = useState<Record<number, string>>({});

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      const [tablesRes, menuRes, ordersRes] = await Promise.all([
        supabase.from("tables").select("*"),
        supabase.from("menu_items").select("*"),
        supabase
          .from("orders")
          .select("*, menu_items(name, price)")
          .order("id", { ascending: true }),
      ]);

      setTables(tablesRes.data || []);
      setMenu(menuRes.data || []);
      setOrders(ordersRes.data || []);
    };

    fetchData();
  }, []);

  const handleOrderSubmit = async () => {
    if (!selectedTable || !selectedMenuItem || quantity < 1) return;

    const table = tables.find((t) => t.id === selectedTable);
    const currentPhoneNumber = phoneNumbers[selectedTable] || phoneNumber;

    if (!currentPhoneNumber) {
      alert("Please provide a phone number.");
      return;
    }

    if (table.status !== "available" && table.phone_number !== currentPhoneNumber) {
      alert("This table is already engaged with a different phone number.");
      return;
    }

    await supabase.from("orders").insert({
      table_id: selectedTable,
      menu_item_id: selectedMenuItem,
      quantity,
      phone_number: currentPhoneNumber,
      status: "pending",
    });

    await supabase
      .from("tables")
      .update({ status: "engaged", phone_number: currentPhoneNumber })
      .eq("id", selectedTable);

    setPhoneNumbers((prev) => ({ ...prev, [selectedTable]: currentPhoneNumber }));
    alert("Order placed!");

    resetOrderForm();
    refreshOrders();
  };

  const handleClearOrders = async (tableId: number) => {
    await supabase.from("orders").delete().eq("table_id", tableId);
    await supabase
      .from("tables")
      .update({ status: "available", phone_number: null })
      .eq("id", tableId);

    setPhoneNumbers((prev) => {
      const updated = { ...prev };
      delete updated[tableId];
      return updated;
    });

    alert("Orders cleared!");
    refreshOrders();
  };

  const handleProceedToBilling = async (tableId: number) => {
    const tableOrders = orders.filter((order) => order.table_id === tableId);
    const totalAmount = tableOrders.reduce(
      (total, order) => total + order.quantity * order.menu_items.price,
      0
    );

    const phone = tables.find((table) => table.id === tableId)?.phone_number;
    const orderedItems = tableOrders
      .map((order) => `${order.menu_items.name} x ${order.quantity}`)
      .join(", ");

    await supabase.from("billing").insert({
      table_id: tableId,
      phone_number: phone,
      total_amount: totalAmount,
      ordered_items: orderedItems,
    });

    await handleClearOrders(tableId);
    alert(`Bill processed: $${totalAmount.toFixed(2)} with items: ${orderedItems}`);
  };

  const calculateTotal = (tableId: number) => {
    return orders
      .filter((order) => order.table_id === tableId)
      .reduce((total, order) => total + order.quantity * order.menu_items.price, 0);
  };

  const resetOrderForm = () => {
    setSelectedMenuItem(null);
    setQuantity(1);
    setPhoneNumber("");
    setSelectedTable(null);
  };

  const refreshOrders = async () => {
    const { data } = await supabase
      .from("orders")
      .select("*, menu_items(name, price)")
      .order("id", { ascending: true });
    setOrders(data || []);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Waiter Dashboard</h1>
      <div className="grid grid-cols-3 gap-4">
        {tables.map((table) => (
          <div key={table.id} className="p-4 border rounded bg-white shadow">
            <h2 className="text-lg font-semibold">Table {table.number}</h2>
            <p>Phone: {table.phone_number || "N/A"}</p>
            <div>
              <h3 className="font-bold mt-2">Orders:</h3>
              {orders
                .filter((order) => order.table_id === table.id)
                .map((order) => (
                  <p key={order.id}>
                    {order.menu_items.name} x {order.quantity} - $
                    {(order.menu_items.price * order.quantity).toFixed(2)}
                  </p>
                ))}
            </div>
            <p className="mt-2">
              <strong>Total:</strong> ${calculateTotal(table.id).toFixed(2)}
            </p>
            <button
              className="p-2 bg-green-500 text-white rounded mt-2"
              onClick={() => setSelectedTable(table.id)}
            >
              Add Order
            </button>
            <button
              className="p-2 bg-blue-500 text-white rounded mt-2"
              onClick={() => handleProceedToBilling(table.id)}
            >
              Proceed to Billing
            </button>
            <button
              className="p-2 bg-red-500 text-white rounded mt-2"
              onClick={() => handleClearOrders(table.id)}
            >
              Clear Orders
            </button>
          </div>
        ))}
      </div>

      {selectedTable && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold">Add Order for Table {selectedTable}</h2>
          {!phoneNumbers[selectedTable] && (
            <input
              type="text"
              placeholder="Phone Number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="p-2 border rounded mb-2 w-full"
            />
          )}
          <select
            value={selectedMenuItem || ""}
            onChange={(e) => setSelectedMenuItem(Number(e.target.value))}
            className="p-2 border rounded"
          >
            <option value="">Select Menu Item</option>
            {menu.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} - ${item.price}
              </option>
            ))}
          </select>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="p-2 border rounded ml-2 w-20"
          />
          <button
            onClick={handleOrderSubmit}
            className="ml-4 p-2 bg-green-500 text-white rounded"
          >
            Submit
          </button>
          <button
            onClick={resetOrderForm}
            className="ml-2 p-2 bg-gray-500 text-white rounded"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

export default WaiterPage;