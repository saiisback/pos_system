import React from 'react';
import Link from 'next/link';

const Navbar = () => {
  return (
    <nav className="p-4 bg-blue-600 text-white">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold"><Link href="/">POS System</Link></h1>
        <div className="space-x-4">
          <Link href="/billing">Billing
          </Link>
          <Link href="/waiter">Waiter
          </Link>
          <Link href="/kitchen">Kitchen
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;