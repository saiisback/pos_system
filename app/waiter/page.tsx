"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

// Supabase Client Initialization
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Table {
    id: number;
    table_number: number;
    status: string;
    phone_number?: string;
}

export default function WaiterPage() {
    const [tables, setTables] = useState<Table[]>([]);
    const [selectedTable, setSelectedTable] = useState<number | null>(null);
    const [phoneNumber, setPhoneNumber] = useState("");
    const [modalVisible, setModalVisible] = useState(false);
    const router = useRouter();

    // Fetch tables from database
    useEffect(() => {
        const fetchTables = async () => {
            const { data, error } = await supabase
                .from("tables")
                .select("*")
                .order('table_number', { ascending: true });
            if (data) setTables(data);
            if (error) console.error("Error fetching tables:", error.message);
        };

        fetchTables();
    }, []);

    // Handle table click
    const handleTableClick = (table: Table) => {
        if (table.status === "available") {
            setSelectedTable(table.table_number);
            setModalVisible(true);
        } else {
            router.push(`/orders?table=${table.table_number}`);
        }
    };

    // Handle phone number submission
    const handlePhoneNumberSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const { error } = await supabase
                .from("tables")
                .update({ phone_number: phoneNumber, status: "occupied" })
                .eq("table_number", selectedTable);

            if (error) throw error;
            
            setModalVisible(false);
            // Pass the table number to menu page
            router.push(`/menu?table=${selectedTable}`);
        } catch (error) {
            console.error("Error updating table:", error);
            alert('Failed to update table status');
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 flex flex-col items-center p-6">
            <h1 className="text-3xl font-semibold text-white mb-6">Waiter Dashboard</h1>
            <div className="grid grid-cols-4 gap-4">
                {tables.map((table: Table) => (
                    <div
                        key={table.id}
                        className={`w-24 h-24 flex flex-col items-center justify-center rounded-md text-white font-semibold cursor-pointer ${
                            table.status === "available" ? "bg-green-500" : "bg-red-500"
                        }`}
                        onClick={() => handleTableClick(table)}
                    >
                        <div>Table {table.table_number}</div>
                        {table.status !== "available" && (
                            <div className="text-sm mt-1">View Orders</div>
                        )}
                    </div>
                ))}
            </div>

            {/* Modal */}
            {modalVisible && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-lg shadow-lg">
                        <h2 className="text-xl font-semibold mb-4">Enter Phone Number</h2>
                        <form onSubmit={handlePhoneNumberSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                                <input
                                    type="text"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 focus:outline-none"
                            >
                                Submit
                            </button>
                        </form>
                        <button
                            onClick={() => setModalVisible(false)}
                            className="mt-4 w-full bg-gray-600 text-white py-2 rounded-md hover:bg-gray-700 focus:outline-none"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}