"use client"
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Order {
  id: number;
  menu_items: {
    name: string;
  };
  tables: {
    number: number;
  };
  quantity: number;
  status: string;
}

const KitchenPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const fetchOrders = async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, menu_items(name), tables(number)')
        .eq('status', 'pending');
      if (error) {
        console.error('Error fetching orders:', error.message);
      } else {
        setOrders(data || []);
      }
    };

    fetchOrders();

    // Set up real-time listener
    const channel = supabase
      .channel('orders')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload: { new: Order }) => {
          setOrders((prevOrders) => [...prevOrders, payload.new]);
          alert(`New order added: ${payload.new.menu_items.name}`);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        (payload: { new: Order }) => {
          setOrders((prevOrders) =>
            prevOrders.map((order) =>
              order.id === payload.new.id ? payload.new : order
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const markAsCompleted = async (orderId: number) => {
    const { error } = await supabase.from('orders').update({ status: 'completed' }).eq('id', orderId);
    if (error) {
      console.error('Error marking order as completed:', error.message);
    } else {
      alert('Order marked as completed!');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Kitchen Dashboard</h1>
      <div className="grid grid-cols-1 gap-4">
        {orders.map((order) => (
          <div
            key={order.id}
            className="p-4 border rounded bg-white shadow flex justify-between"
          >
            <div>
              <h2 className="text-lg font-semibold">{order.menu_items.name}</h2>
              <p>Table: {order.tables.number}</p>
              <p>Quantity: {order.quantity}</p>
            </div>
            <button
              onClick={() => markAsCompleted(order.id)}
              className="p-2 bg-green-500 text-white rounded"
            >
              Mark as Completed
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default KitchenPage;