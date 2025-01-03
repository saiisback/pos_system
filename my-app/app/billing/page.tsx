"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface BillingRecord {
  id: number;
  table_id: number;
  phone_number: string;
  total_amount: number;
  ordered_items: string; // Plain text, comma-separated
  timestamp: string;
  payment_status: boolean;
}

const BillingPage = () => {
  const [currentBills, setCurrentBills] = useState<BillingRecord[]>([]);
  const [completedBills, setCompletedBills] = useState<BillingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"current" | "completed">("current");

  const fetchBills = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("billing")
        .select("*")
        .order("timestamp", { ascending: false });

      if (error) {
        console.error("Error fetching bills:", error);
        return;
      }

      const current = (data || []).filter((bill) => !bill.payment_status);
      const completed = (data || []).filter((bill) => bill.payment_status);

      setCurrentBills(current);
      setCompletedBills(completed);
    } catch (err) {
      console.error("Unexpected error:", err);
    } finally {
      setLoading(false);
    }
  };

  const markBillAsCleared = async (id: number) => {
    try {
      const { error } = await supabase
        .from("billing")
        .update({ payment_status: true })
        .eq("id", id);

      if (error) {
        console.error("Error updating bill status:", error);
        return;
      }

      // Update the state: move the bill from current to completed
      setCurrentBills((prevBills) => prevBills.filter((bill) => bill.id !== id));
      const clearedBill = currentBills.find((bill) => bill.id === id);
      if (clearedBill) {
        setCompletedBills((prevBills) => [clearedBill, ...prevBills]);
      }

      alert("Bill marked as cleared!");
    } catch (err) {
      console.error("Unexpected error:", err);
    }
  };

  const printBill = (bill: BillingRecord) => {
    // Placeholder for printing functionality
    alert(`Printing bill for Table ${bill.table_id}`);
    console.log(bill);
  };

  useEffect(() => {
    fetchBills();
  }, []);

  if (loading) {
    return <div>Loading bills...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Billing Records</h1>

      {/* Tabs */}
      <div className="mb-4 flex space-x-4">
        <button
          className={`px-4 py-2 rounded ${
            activeTab === "current" ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
          onClick={() => setActiveTab("current")}
        >
          Current Bills
        </button>
        <button
          className={`px-4 py-2 rounded ${
            activeTab === "completed" ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
          onClick={() => setActiveTab("completed")}
        >
          Completed Bills
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "current" && (
        <div>
          {currentBills.length === 0 ? (
            <p>No current bills available.</p>
          ) : (
            <div className="space-y-4">
              {currentBills.map((bill) => (
                <div key={bill.id} className="p-4 border rounded-lg bg-white">
                  <h3 className="text-lg font-semibold mb-2">
                    Table {bill.table_id}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Phone: {bill.phone_number}
                  </p>
                  <div className="mb-2">
                    <strong>Ordered Items:</strong>
                    <ul className="list-disc list-inside mt-2">
                      {bill.ordered_items.split(",").map((item, index) => (
                        <li key={index} className="text-sm text-gray-800">
                          {item.trim()}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <p className="text-sm">
                    <strong>Total Amount:</strong> $
                    {bill.total_amount.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500">
                    <strong>Timestamp:</strong>{" "}
                    {new Date(bill.timestamp).toLocaleString()}
                  </p>
                  <button
                    className="mt-4 px-4 py-2 bg-green-500 text-white rounded"
                    onClick={() => markBillAsCleared(bill.id)}
                  >
                    Mark as Cleared
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "completed" && (
        <div>
          {completedBills.length === 0 ? (
            <p>No completed bills available.</p>
          ) : (
            <div className="space-y-4">
              {completedBills.map((bill) => (
                <div
                  key={bill.id}
                  className="p-4 border rounded-lg bg-green-100"
                >
                  <h3 className="text-lg font-semibold mb-2">
                    Table {bill.table_id}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Phone: {bill.phone_number}
                  </p>
                  <div className="mb-2">
                    <strong>Ordered Items:</strong>
                    <ul className="list-disc list-inside mt-2">
                      {bill.ordered_items.split(",").map((item, index) => (
                        <li key={index} className="text-sm text-gray-800">
                          {item.trim()}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <p className="text-sm">
                    <strong>Total Amount:</strong> $
                    {bill.total_amount.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500">
                    <strong>Timestamp:</strong>{" "}
                    {new Date(bill.timestamp).toLocaleString()}
                  </p>
                  <button
                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
                    onClick={() => printBill(bill)}
                  >
                    Print Bill
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BillingPage;