"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface BillingRecord {
    id: number;
    table_number: number;
    phone_number: string;
    orders: any[];
    total_amount: number;
    created_at: string;
    status: 'pending' | 'cleared';
}

export default function BillingPage() {
    const [billingRecords, setBillingRecords] = useState<BillingRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'pending' | 'cleared'>('pending');

    useEffect(() => {
        fetchBillingRecords();
    }, [activeTab]);

    const fetchBillingRecords = async () => {
        try {
            const { data, error } = await supabase
                .from('billing')
                .select('*')
                .eq('status', activeTab)
                .order('created_at', { ascending: false });

            if (error) throw error;
            if (data) setBillingRecords(data);
        } catch (error) {
            console.error('Error fetching billing records:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkCleared = async (recordId: number) => {
        try {
            const { error } = await supabase
                .from('billing')
                .update({ status: 'cleared' })
                .eq('id', recordId);

            if (error) throw error;
            fetchBillingRecords();
        } catch (error) {
            console.error('Error updating billing status:', error);
            alert('Failed to update status');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-white text-xl">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 p-6">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-semibold text-white">Billing Records</h1>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setActiveTab('pending')}
                            className={`px-4 py-2 rounded-lg ${
                                activeTab === 'pending'
                                    ? 'bg-[#2980b9] text-white'
                                    : 'bg-gray-700 text-gray-300'
                            }`}
                        >
                            Current Bills
                        </button>
                        <button
                            onClick={() => setActiveTab('cleared')}
                            className={`px-4 py-2 rounded-lg ${
                                activeTab === 'cleared'
                                    ? 'bg-[#2980b9] text-white'
                                    : 'bg-gray-700 text-gray-300'
                            }`}
                        >
                            Completed Bills
                        </button>
                    </div>
                </div>

                <div className="space-y-4">
                    {billingRecords.map((record) => (
                        <div key={record.id} className="bg-white rounded-lg p-6 shadow-lg">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold">
                                        Table {record.table_number}
                                    </h3>
                                    <p className="text-gray-600">
                                        Phone: {record.phone_number}
                                    </p>
                                    <p className="text-gray-600">
                                        {new Date(record.created_at).toLocaleString()}
                                    </p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-xl font-bold text-[#2980b9]">
                                        ₹{record.total_amount.toFixed(2)}
                                    </div>
                                    {activeTab === 'pending' && (
                                        <button
                                            onClick={() => handleMarkCleared(record.id)}
                                            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                                        >
                                            Mark Cleared
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="mt-4">
                                <table className="w-full">
                                    <thead className="text-sm text-gray-600 border-b">
                                        <tr>
                                            <th className="text-left py-2">Item</th>
                                            <th className="text-center py-2">Qty</th>
                                            <th className="text-right py-2">Price</th>
                                            <th className="text-right py-2">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {record.orders.flatMap(order => 
                                            order.items.map((item: any, idx: number) => (
                                                <tr key={`${order.id}-${idx}`} className="border-b">
                                                    <td className="py-2">{item.name}</td>
                                                    <td className="text-center">{item.quantity}</td>
                                                    <td className="text-right">₹{item.price}</td>
                                                    <td className="text-right">
                                                        ₹{(item.price * item.quantity).toFixed(2)}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                        <tr className="font-semibold bg-gray-50">
                                            <td colSpan={3} className="text-right py-2">Grand Total:</td>
                                            <td className="text-right py-2 text-[#2980b9]">
                                                ₹{record.total_amount.toFixed(2)}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}