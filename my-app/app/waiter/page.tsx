"use client"
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const WaiterPage = () => {
  const [tables, setTables] = useState<any[]>([]);
  const [menu, setMenu] = useState<any[]>([]);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [selectedMenuItem, setSelectedMenuItem] = useState<number | null>(null);
  const [quantity, setQuantity] = useState<number>(1);

  useEffect(() => {
    const fetchTables = async () => {
      const { data } = await supabase.from('tables').select('*');
      setTables(data || []);
    };
    const fetchMenu = async () => {
      const { data } = await supabase.from('menu_items').select('*');
      setMenu(data || []);
    };
    fetchTables();
    fetchMenu();
  }, []);

  const handleOrderSubmit = async () => {
    if (!selectedTable || !selectedMenuItem || quantity < 1) return;

    await supabase.from('orders').insert({
      table_id: selectedTable,
      menu_item_id: selectedMenuItem,
      quantity,
    });
    alert('Order placed!');
    setSelectedMenuItem(null);
    setQuantity(1);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Waiter Dashboard</h1>
      <div className="grid grid-cols-3 gap-4">
        {tables.map((table) => (
          <button
            key={table.id}
            className={`p-4 rounded bg-blue-500 text-white ${
              selectedTable === table.id && 'bg-green-500'
            }`}
            onClick={() => setSelectedTable(table.id)}
          >
            Table {table.number}
          </button>
        ))}
      </div>
      {selectedTable && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold">Place Order for Table {selectedTable}</h2>
          <select
            value={selectedMenuItem || ''}
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
        </div>
      )}
    </div>
  );
};

export default WaiterPage;