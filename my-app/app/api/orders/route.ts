import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const { data, error } = await supabase
    .from('orders')
    .select('*, menu_items(name, price), tables(number)');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { table_id, menu_item_id, quantity } = body;

  const { error } = await supabase
    .from('orders')
    .insert([{ table_id, menu_item_id, quantity }]);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ message: 'Order created successfully!' });
}