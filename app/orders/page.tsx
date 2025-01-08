"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { Suspense } from "react";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
    total_amount: number;
    status: string;
    created_at: string;
}

function OrdersContent() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPhoneNumber, setCurrentPhoneNumber] = useState<string | null>(null);
    const router = useRouter();
    const searchParams = useSearchParams();
    const tableNumber = searchParams.get('table');

    useEffect(() => {
        const fetchTableInfo = async () => {
            if (!tableNumber) return;

            try {
                const { data, error } = await supabase
                    .from('tables')
                    .select('phone_number')
                    .eq('table_number', tableNumber)
                    .single();

                if (error) throw error;
                if (data) setCurrentPhoneNumber(data.phone_number);
            } catch (error) {
                console.error('Error fetching table info:', error);
            }
        };

        fetchTableInfo();
    }, [tableNumber]);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const { data, error } = await supabase
                    .from("orders")
                    .select("*")
                    .eq("table_number", tableNumber)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                if (data) setOrders(data);
            } catch (error) {
                console.error("Error fetching orders:", error);
            } finally {
                setLoading(false);
            }
        };

        if (tableNumber) fetchOrders();
    }, [tableNumber]);

    const calculateTotal = (items: OrderItem[]) => {
        return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    };

    const calculateGrandTotal = () => {
        return orders.reduce((sum, order) => sum + order.total_amount, 0);
    };

    const handleSendToBilling = async () => {
        const confirmed = window.confirm('Are you sure you want to send this order to billing?');
        
        if (!confirmed) return;

        try {
            const { data: tableData, error: tableError } = await supabase
                .from('tables')
                .select('phone_number')
                .eq('table_number', tableNumber)
                .single();

            if (tableError) throw tableError;

            const { error: billingError } = await supabase
                .from('billing')
                .insert({
                    table_number: tableNumber,
                    phone_number: tableData.phone_number,
                    orders: orders,
                    total_amount: calculateGrandTotal(),
                    status: 'pending'
                });

            if (billingError) throw billingError;

            const { error: updateError } = await supabase
                .from('tables')
                .update({ 
                    status: 'available',
                    phone_number: null 
                })
                .eq('table_number', tableNumber);

            if (updateError) throw updateError;

            const { error: deleteError } = await supabase
                .from('orders')
                .delete()
                .eq('table_number', tableNumber);

            if (deleteError) throw deleteError;

            router.push('/waiter');
            
        } catch (error) {
            console.error('Error processing billing:', error);
            alert('Failed to process billing. Please try again.');
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
       
         <div className="min-h-screen bg-gray-900 flex flex-col items-center p-6">
            <div className="w-full max-w-4xl">
                <div className="flex justify-between items-center mb-6">
                    
                    <div>
                        <h1 className="text-3xl font-semibold text-white">
                            Orders for Table {tableNumber}
                        </h1>
                        {currentPhoneNumber && (
                            <p className="text-gray-400 mt-2">
                                Customer Phone: {currentPhoneNumber}
                            </p>
                        )}
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={() => router.push('/waiter')}
                            className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700"
                        >
                            Go Back
                        </button>
                        <button
                            onClick={() => router.push(`/menu?table=${tableNumber}`)}
                            className="bg-[#2980b9] text-white px-6 py-2 rounded-md hover:bg-blue-700"
                        >
                            Add More Items
                        </button>
                    </div>
                </div>

                {orders.length === 0 ? (
                    <div className="text-white text-center py-8">
                        No orders found for this table.
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="bg-white rounded-lg p-6 shadow-lg mb-6">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-xl font-semibold text-[#2980b9]">Total Bill Amount</h3>
                                    <p className="text-2xl font-bold">₹{calculateGrandTotal().toFixed(2)}</p>
                                </div>
                                <button
                                    onClick={handleSendToBilling}
                                    className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 font-semibold"
                                >
                                    Send to Billing
                                </button>
                            </div>
                        </div>

                        {orders.map((order) => (
                            <div key={order.id} className="bg-white rounded-lg p-6 shadow-lg">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-lg font-semibold">
                                            Order #{order.id}
                                        </h3>
                                        <p className="text-gray-600">
                                            {new Date(order.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-sm ${
                                        order.status === 'completed' 
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-[#2980b9] bg-opacity-10 text-[#2980b9]'
                                    }`}>
                                        {order.status}
                                    </span>
                                </div>

                                <div className="mt-4">
                                    <table className="min-w-full">
                                        <thead>
                                            <tr className="border-b">
                                                <th className="text-left py-2 text-[#2980b9]">Item</th>
                                                <th className="text-center py-2 text-[#2980b9]">Quantity</th>
                                                <th className="text-right py-2 text-[#2980b9]">Price</th>
                                                <th className="text-right py-2 text-[#2980b9]">Subtotal</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {order.items.map((item, index) => (
                                                <tr key={index} className="border-b hover:bg-blue-50">
                                                    <td className="py-2">{item.name}</td>
                                                    <td className="text-center py-2">{item.quantity}</td>
                                                    <td className="text-right py-2">₹{item.price}</td>
                                                    <td className="text-right py-2 font-medium text-[#2980b9]">
                                                        ₹{item.price * item.quantity}
                                                    </td>
                                                </tr>
                                            ))}
                                            <tr className="font-semibold bg-blue-50">
                                                <td colSpan={3} className="text-right py-2">Total:</td>
                                                <td className="text-right py-2 text-[#2980b9]">
                                                    ₹{calculateTotal(order.items)}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function OrdersPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-white text-xl">Loading...</div>
            </div>
        }>
            <OrdersContent />
        </Suspense>
    );
}
