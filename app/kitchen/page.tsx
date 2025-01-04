"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface OrderItem {
    id: number;
    name: string;
    quantity: number;
    price: number;
}

interface Order {
    id: number;
    table_number: number;
    items: OrderItem[];
    status: string;
    created_at: string;
}

export default function KitchenPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');

    // Real-time subscription for orders
    useEffect(() => {
        const channel = supabase
            .channel('orders-channel')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'orders'
            }, () => {
                fetchOrders();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    // Fetch orders based on active tab
    useEffect(() => {
        fetchOrders();
    }, [activeTab]);

    const fetchOrders = async () => {
        try {
            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .eq('status', activeTab === 'pending' ? 'pending' : 'completed')
                .order('created_at', { ascending: false });

            if (error) throw error;
            if (data) setOrders(data);
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (orderId: number) => {
        try {
            const { error } = await supabase
                .from('orders')
                .update({ status: 'completed' })
                .eq('id', orderId);

            if (error) throw error;
            fetchOrders();
        } catch (error) {
            console.error('Error updating order status:', error);
            alert('Failed to update order status');
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
                    <h1 className="text-3xl font-semibold text-white">Kitchen Orders</h1>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setActiveTab('pending')}
                            className={`px-4 py-2 rounded-lg ${
                                activeTab === 'pending'
                                    ? 'bg-[#2980b9] text-white'
                                    : 'bg-gray-700 text-gray-300'
                            }`}
                        >
                            Pending Orders
                        </button>
                        <button
                            onClick={() => setActiveTab('completed')}
                            className={`px-4 py-2 rounded-lg ${
                                activeTab === 'completed'
                                    ? 'bg-[#2980b9] text-white'
                                    : 'bg-gray-700 text-gray-300'
                            }`}
                        >
                            Completed Orders
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {orders.map((order) => (
                        <div 
                            key={order.id} 
                            className={`bg-white rounded-lg p-6 shadow-lg border-l-8 ${
                                activeTab === 'pending' 
                                    ? 'border-yellow-500 animate-pulse' 
                                    : 'border-green-500'
                            }`}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-lg font-semibold">
                                            Table {order.table_number}
                                        </h3>
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                            activeTab === 'pending'
                                                ? 'bg-yellow-100 text-yellow-800'
                                                : 'bg-green-100 text-green-800'
                                        }`}>
                                            {activeTab === 'pending' ? 'Pending' : 'Ready'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600">
                                        Order #{order.id}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        {new Date(order.created_at).toLocaleString()}
                                    </p>
                                </div>
                                {activeTab === 'pending' && (
                                    <button
                                        onClick={() => handleStatusUpdate(order.id)}
                                        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm transition-colors"
                                    >
                                        Mark Ready
                                    </button>
                                )}
                            </div>

                            <div className="mt-4">
                                <table className="w-full">
                                    <thead className="text-sm text-gray-600 border-b">
                                        <tr>
                                            <th className="text-left py-2">Item</th>
                                            <th className="text-center py-2">Qty</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {order.items.map((item, idx) => (
                                            <tr key={idx} className="border-b">
                                                <td className="py-2">{item.name}</td>
                                                <td className="text-center py-2">
                                                    <span className="bg-[#2980b9] text-white px-3 py-1 rounded-full">
                                                        {item.quantity}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}
                </div>

                {orders.length === 0 && (
                    <div className="text-white text-center py-8">
                        No {activeTab} orders found.
                    </div>
                )}
            </div>
        </div>
    );
}