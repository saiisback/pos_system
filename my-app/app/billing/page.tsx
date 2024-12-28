"use client"
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const BillingPage = () => {
  const [tables, setTables] = useState<any[]>([]);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    const fetchTables = async () => {
      const { data } = await supabase.from('tables').select('*');
      setTables(data || []);
    };
    fetchTables();
  }, []);

  const fetchOrders = async (tableId: number) => {
    const { data } = await supabase
      .from('orders')
      .select('*, menu_items(name, price)')
      .eq('table_id', tableId);
    setOrders(data || []);
  };

  const handleSelectTable = (id: number) => {
    setSelectedTable(id);
    fetchOrders(id);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Billing</h1>
      <div className="grid grid-cols-3 gap-4">
        {tables.map((table) => (
          <button
            key={table.id}
            className={`p-4 rounded bg-blue-500 text-white ${
              selectedTable === table.id && 'bg-green-500'
            }`}
            onClick={() => handleSelectTable(table.id)}
          >
            Table {table.number}
          </button>
        ))}
      </div>
      {selectedTable && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold">Orders for Table {selectedTable}</h2>
          <ul className="mt-4">
            {orders.map((order) => (
              <li key={order.id} className="p-2 border-b">
                {order.menu_items.name} - {order.quantity} x ${order.menu_items.price} = $
                {order.quantity * order.menu_items.price}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default BillingPage;