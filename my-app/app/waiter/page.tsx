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
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [phoneNumbers, setPhoneNumbers] = useState<Record<number, string>>({});

  useEffect(() => {
    const fetchData = async () => {
      const [tablesRes, ordersRes] = await Promise.all([
        supabase.from("tables").select("*"),
        supabase
          .from("orders")
          .select("*, menu_items(name, price)")
          .order("id", { ascending: true }),
      ]);

      setTables(tablesRes.data || []);
      setOrders(ordersRes.data || []);
    };

    fetchData();
  }, []);

  const handleredirect = (path: string) => {
    window.location.assign(path);
  };

  const handleOrderSubmit = async () => {
    if (!selectedTable || phoneNumber.trim() === "") {
      alert("Please select a table and provide a phone number.");
      return;
    }

    const table = tables.find((t) => t.id === selectedTable);
    const currentPhoneNumber = phoneNumbers[selectedTable] || phoneNumber;

    if (table.status !== "available" && table.phone_number !== currentPhoneNumber) {
      alert("This table is already engaged with a different phone number.");
      return;
    }

    await supabase.from("tables").update({
      status: "engaged",
      phone_number: currentPhoneNumber,
    }).eq("id", selectedTable);

    setPhoneNumbers((prev) => ({ ...prev, [selectedTable]: currentPhoneNumber }));
    alert("Phone number added to the table!");

    resetOrderForm();
    refreshOrders();
  };

  const handleSendToBilling = async (tableId: number) => {
    const tableOrders = orders.filter((order) => order.table_id === tableId);
    const totalAmount = tableOrders.reduce(
      (total, order) => total + (order.menu_items?.price || 0) * order.quantity,
      0
    );
  
    const phone = tables.find((table) => table.id === tableId)?.phone_number;
    const orderedItems = tableOrders
      .map((order) => `${order.menu_items?.name} x ${order.quantity}`)
      .join(", ");
  
    // Insert billing details
    await supabase.from("billing").insert({
      table_id: tableId,
      phone_number: phone,
      total_amount: totalAmount,
      ordered_items: orderedItems,
    });
  
    // Delete the orders for the table
    await supabase.from("orders").delete().eq("table_id", tableId);
  
    // Reset table to "available" and clear the phone number
    await supabase.from("tables").update({
      status: "available",
      phone_number: null,
    }).eq("id", tableId);
  
    // Clear phone number from state
    setPhoneNumbers((prev) => {
      const updated = { ...prev };
      delete updated[tableId];
      return updated;
    });
  
    // Notify and refresh
    alert(`Bill processed: $${totalAmount.toFixed(2)} with items: ${orderedItems}`);
    refreshOrders();
  };

  const resetOrderForm = () => {
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
            <p>Phone: {phoneNumbers[table.id] || table.phone_number || "N/A"}</p>
            <div>
              <h3 className="font-bold mt-2">Orders:</h3>
              {orders
                .filter((order) => order.table_id === table.id)
                .map((order) => {
                  if (!order.menu_items) return null;
                  return (
                    <p key={order.id}>
                      {order.menu_items.name} x {order.quantity} - $
                      {(order.menu_items.price * order.quantity).toFixed(2)}
                    </p>
                  );
                })}
            </div>
            <button
              className="p-2 bg-green-500 text-white rounded mt-2"
              onClick={() => setSelectedTable(table.id)}
            >
              Add Phone Number
            </button>
            <button
              className="p-2 bg-blue-500 text-white rounded mt-2"
              onClick={() => handleredirect("/menu")}
            >
              Add Order
            </button>
            <button
              className="p-2 bg-yellow-500 text-white rounded mt-2"
              onClick={() => handleSendToBilling(table.id)}
            >
              Send to Billing
            </button>
          </div>
        ))}
      </div>

      {selectedTable && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold">
            Add Phone Number for Table {selectedTable}
          </h2>
          <input
            type="text"
            placeholder="Phone Number"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="p-2 border rounded mb-2 w-full"
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