'use client';
import { useState, useEffect } from 'react';
import { menu } from '@/lib/menu';
import { createClient } from '@supabase/supabase-js';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function MenuContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tableNum = searchParams.get('table');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [orderItems, setOrderItems] = useState<{[key: number]: number}>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [tableNumber, setTableNumber] = useState<number>(Number(tableNum) || 1);
  const [availableTables, setAvailableTables] = useState<number[]>([]);

  useEffect(() => {
    // Redirect if no table number or table not occupied
    const checkTableStatus = async () => {
      if (!tableNum) {
        router.push('/waiter');
        return;
      }

      const { data, error } = await supabase
        .from('tables')
        .select('status')
        .eq('table_number', tableNum)
        .single();

      if (error || !data || data.status !== 'occupied') {
        router.push('/waiter');
      }
    };

    checkTableStatus();
  }, [tableNum, router]);

  // Fetch tables from database
  useEffect(() => {
    const fetchTables = async () => {
      try {
        const { data, error } = await supabase
          .from('tables')
          .select('table_number')
          .order('table_number');

        if (error) throw error;
        if (data) {
          const tableNumbers = data.map(table => table.table_number);
          setAvailableTables(tableNumbers);
        }
      } catch (error) {
        console.error('Error fetching tables:', error);
      }
    };

    fetchTables();
  }, []);

  // Get unique categories from menu
  const categories = Array.from(new Set(menu.map(item => item.category)));

  const handleQuantityChange = (itemId: number, action: 'add' | 'subtract') => {
    setOrderItems(prev => {
      const currentQuantity = prev[itemId] || 0;
      const newQuantity = action === 'add' ? currentQuantity + 1 : Math.max(0, currentQuantity - 1);
      
      if (newQuantity === 0) {
        const { [itemId]: _, ...rest } = prev;
        return rest;
      }
      
      return {
        ...prev,
        [itemId]: newQuantity
      };
    });
  };

  const calculateTotal = () => {
    return Object.entries(orderItems).reduce((total, [itemId, quantity]) => {
      const item = menu.find(item => item.id === parseInt(itemId));
      return total + (item?.price || 0) * quantity;
    }, 0);
  };

  const filteredItems = selectedCategory
    ? menu.filter(item => item.category === selectedCategory)
    : menu;

  const searchedItems = searchQuery
    ? filteredItems.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : filteredItems;

  return (
    <div className="container mx-auto px-4 pb-20">
      {/* Header */}
      <header className="sticky top-0 bg-white z-10 py-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Menu selection</h1>
          <div className="flex items-center gap-4">
            <div className="px-6 py-3 border rounded-lg text-lg font-semibold min-w-[150px] bg-gray-50">
              Table: {tableNumber}
            </div>
            <input
              type="search"
              placeholder="Search for dishes..."
              className="px-4 py-2 border rounded-lg w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-lg whitespace-nowrap 
              ${!selectedCategory ? 'bg-[#2980b9] text-white' : 'bg-gray-100'}`}
          >
            All Items
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap
                ${selectedCategory === category ? 'bg-[#2980b9] text-white' : 'bg-gray-100'}`}
            >
              {category.toUpperCase()}
            </button>
          ))}
        </div>
      </header>

      {/* Menu Items */}
      <div className="mt-4">
        {searchedItems.map((item) => (
          <div key={item.id} className="flex items-center justify-between py-4 border-b">
            <div>
              <h3 className="font-semibold">{item.name}</h3>
              <p className="text-lg">₹{item.price.toFixed(2)}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleQuantityChange(item.id, 'subtract')}
                className="w-8 h-8 bg-[#2980b9] text-white rounded-lg"
              >
                -
              </button>
              <span className="w-8 text-center">{orderItems[item.id] || 0}</span>
              <button
                onClick={() => handleQuantityChange(item.id, 'add')}
                className="w-8 h-8 bg-[#2980b9] text-white rounded-lg"
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Payment Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#2980b9] text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <span className="text-lg font-semibold">
            Pay ₹{calculateTotal().toFixed(2)}
          </span>
          <button 
            className="bg-white text-[#2980b9] px-6 py-2 rounded-lg font-semibold"
            onClick={async () => {
              // Add confirmation dialog
              const confirmed = window.confirm('Are you sure you want to place this order?');
              
              if (!confirmed) return;

              try {
                const supabase = createClient(
                    process.env.NEXT_PUBLIC_SUPABASE_URL!,
                    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
                );
                
                // Format order items to match the jsonb structure
                const formattedItems = Object.entries(orderItems)
                  .filter(([_, quantity]) => quantity > 0)
                  .map(([itemId, quantity]) => {
                    const menuItem = menu.find(item => item.id === parseInt(itemId));
                    return {
                      id: parseInt(itemId),
                      name: menuItem?.name,
                      quantity: quantity,
                      price: menuItem?.price
                    };
                  });

                if (formattedItems.length === 0) {
                  alert('Please add items to your order');
                  return;
                }

                const { error } = await supabase
                  .from('orders')
                  .insert({
                    table_number: tableNumber,
                    items: formattedItems,
                    total_amount: calculateTotal(),
                  });

                if (error) throw error;

                // Clear the order after successful submission
                setOrderItems({});
                alert('Order placed successfully!');
                router.push(`/orders?table=${tableNumber}`);

              } catch (error) {
                console.error('Error placing order:', error);
                alert('Failed to place order. Please try again.');
              }
            }}
          >
            Place Order
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MenuPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading menu...</div>
      </div>
    }>
      <MenuContent />
    </Suspense>
  );
}