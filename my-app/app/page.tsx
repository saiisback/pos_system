import Link from 'next/link';

const Home = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen space-y-4">
      <h1 className="text-3xl font-bold">Welcome to the POS System</h1>
      <div className="space-x-4">
        <Link href="/billing">
          Billing
        </Link>
        <Link href="/waiter">
          Waiter
        </Link>
        <Link href="/kitchen">Kitchen
        </Link>
      </div>
    </div>
  );
};

export default Home;