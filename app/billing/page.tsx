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
    phone_number: string | null;
    orders: string[];
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
            console.log('Fetching billing records for status:', activeTab);
            const { data, error } = await supabase
                .from('billing')
                .select('*')
                .eq('status', activeTab)
                .order('created_at', { ascending: false });

            if (error) throw error;
            
            if (data) {
                console.log('Raw billing data:', JSON.stringify(data, null, 2));
                const formattedData = data.map(record => {
                    console.log('Processing record:', record);
                    try {
                        // Handle orders array more carefully
                        let processedOrders = [];
                        if (record.orders && Array.isArray(record.orders)) {
                            processedOrders = record.orders.map(order => {
                                try {
                                    // If order is a string, parse it
                                    if (typeof order === 'string') {
                                        return JSON.parse(order);
                                    }
                                    return order;
                                } catch (e) {
                                    console.error('Error parsing individual order:', order, e);
                                    return null;
                                }
                            }).filter(Boolean); // Remove any null values
                        }

                        return {
                            ...record,
                            phone_number: record.phone_number ? String(record.phone_number) : null,
                            orders: processedOrders
                        };
                    } catch (e) {
                        console.error('Error processing record:', record, e);
                        return record;
                    }
                });
                
                console.log('Formatted billing data:', formattedData);
                setBillingRecords(formattedData);
            }
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
                                        {record.orders && Array.isArray(record.orders) && record.orders.length > 0 ? (
                                            record.orders.map((order, orderIndex) => {
                                                if (!order) return null;
                                                
                                                let items = [];
                                                try {
                                                    if (typeof order === 'string') {
                                                        const parsedOrder = JSON.parse(order);
                                                        items = parsedOrder.items || [];
                                                    } else if (order.items) {
                                                        items = order.items;
                                                    }
                                                } catch (e) {
                                                    console.error('Error parsing order:', e);
                                                    return null;
                                                }

                                                return items.map((item: any, itemIndex: number) => (
                                                    <tr key={`${orderIndex}-${itemIndex}`} className="border-b">
                                                        <td className="py-2">{item?.name || 'Unknown'}</td>
                                                        <td className="text-center">{item?.quantity || 0}</td>
                                                        <td className="text-right">₹{item?.price || 0}</td>
                                                        <td className="text-right">
                                                            ₹{((item?.price || 0) * (item?.quantity || 0)).toFixed(2)}
                                                        </td>
                                                    </tr>
                                                ));
                                            }).filter(Boolean).flat()
                                        ) : (
                                            <tr>
                                                <td colSpan={4} className="text-center py-2 text-gray-500">
                                                    No items in this bill
                                                </td>
                                            </tr>
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