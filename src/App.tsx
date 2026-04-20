import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { FileText, BarChart3, FolderOpen } from 'lucide-react';
import { OrderFilingSystem } from './components/OrderFilingSystem';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { FilesTab } from './components/FilesTab';
import { LoginPage } from './components/LoginPage';
import { SignUpPage } from './components/SignUpPage';
import { supabase } from './utils/supabase';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Order {
  id: string;
  orderNumber: string;
  customer: string;
  email: string;
  product: string;
  arrangement: string;
  occasion: string;
  deliveryType: 'standard' | 'express' | 'same-day' | 'collection';
  deliveryDate: string;
  recipientName: string;
  deliveryAddress: string;
  message: string;
  quantity: number;
  amount: number;
  status: 'pending' | 'processing' | 'arranged' | 'out-for-delivery' | 'delivered' | 'cancelled';
  date: string;
  priority: 'low' | 'medium' | 'high';
  // Extra notes the florist can add — e.g. "no strong scents" or "add extra ribbon"
  notes: string;
}

// This matches the column names in the Supabase database (snake_case)
type OrderRow = {
  id: string;
  order_number: string;
  customer: string;
  email: string;
  product: string;
  arrangement: string;
  occasion: string;
  delivery_type: string;
  delivery_date: string;
  recipient_name: string;
  delivery_address: string;
  message: string;
  quantity: number;
  amount: number;
  status: string;
  date: string;
  priority: string;
  notes: string;
};

// Converts a database row (snake_case) into the Order type the app uses (camelCase)
function rowToOrder(row: OrderRow): Order {
  return {
    id: row.id,
    orderNumber: row.order_number,
    customer: row.customer,
    email: row.email,
    product: row.product,
    arrangement: row.arrangement,
    occasion: row.occasion,
    deliveryType: row.delivery_type as Order['deliveryType'],
    deliveryDate: row.delivery_date,
    recipientName: row.recipient_name,
    deliveryAddress: row.delivery_address,
    message: row.message,
    quantity: row.quantity,
    amount: row.amount,
    status: row.status as Order['status'],
    date: row.date,
    priority: row.priority as Order['priority'],
    notes: row.notes,
  };
}

// ---------------------------------------------------------------------------
// Which page to show — we use a simple string instead of a router
// ---------------------------------------------------------------------------

type CurrentPage = 'checking-auth' | 'login' | 'signup' | 'app';

// ---------------------------------------------------------------------------
// Main App component
// ---------------------------------------------------------------------------

export default function App() {
  // Track which page to show
  const [currentPage, setCurrentPage] = useState<CurrentPage>('checking-auth');

  // Orders data and loading state
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // ---------------------------------------------------------------------------
  // Step 1: When the app first loads, check if the user is already logged in.
  // If they are, go straight to the app. If not, show the login page.
  // ---------------------------------------------------------------------------

  useEffect(() => {
    async function checkIfLoggedIn() {
      // getSession() returns the current user's session if they're logged in
      const { data } = await supabase.auth.getSession();

      if (data.session) {
        // User is already logged in — go straight to the app
        setCurrentPage('app');
      } else {
        // No session found — show the login page
        setCurrentPage('login');
      }
    }

    checkIfLoggedIn();

    // Also listen for auth changes — e.g. if the user logs out in another tab
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setCurrentPage('app');
      } else {
        setCurrentPage('login');
      }
    });

    // Clean up the listener when the component unmounts
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Step 2: When we switch to the app page, fetch the orders from Supabase
  // ---------------------------------------------------------------------------

  useEffect(() => {
    // Only fetch orders when we're on the main app page
    if (currentPage !== 'app') return;

    async function fetchOrders() {
      setLoadingOrders(true);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('date', { ascending: false });
      if (!error && data) setOrders(data.map(rowToOrder));
      setLoadingOrders(false);
    }

    fetchOrders();
  }, [currentPage]);

  // ---------------------------------------------------------------------------
  // Order handlers — these talk to Supabase and update local state
  // ---------------------------------------------------------------------------

  const handleUpdateOrder = async (updatedOrder: Order) => {
    const { error } = await supabase
      .from('orders')
      .update({
        customer: updatedOrder.customer,
        email: updatedOrder.email,
        product: updatedOrder.product,
        arrangement: updatedOrder.arrangement,
        occasion: updatedOrder.occasion,
        delivery_type: updatedOrder.deliveryType,
        delivery_date: updatedOrder.deliveryDate,
        recipient_name: updatedOrder.recipientName,
        delivery_address: updatedOrder.deliveryAddress,
        message: updatedOrder.message,
        quantity: updatedOrder.quantity,
        amount: updatedOrder.amount,
        status: updatedOrder.status,
        date: updatedOrder.date,
        priority: updatedOrder.priority,
        notes: updatedOrder.notes,
      })
      .eq('id', updatedOrder.id);
    if (!error) setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
  };

  const handleDeleteOrder = async (orderId: string) => {
    const { error } = await supabase.from('orders').delete().eq('id', orderId);
    if (!error) setOrders(prev => prev.filter(o => o.id !== orderId));
  };

  const handleAddOrder = async (newOrder: Omit<Order, 'id' | 'orderNumber'>) => {
    const orderNumber = `FLR-${String(Date.now()).slice(-5)}`;
    const { data, error } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer: newOrder.customer,
        email: newOrder.email,
        product: newOrder.product,
        arrangement: newOrder.arrangement,
        occasion: newOrder.occasion,
        delivery_type: newOrder.deliveryType,
        delivery_date: newOrder.deliveryDate,
        recipient_name: newOrder.recipientName,
        delivery_address: newOrder.deliveryAddress,
        message: newOrder.message,
        quantity: newOrder.quantity,
        amount: newOrder.amount,
        status: newOrder.status,
        date: newOrder.date,
        priority: newOrder.priority,
        notes: newOrder.notes,
      })
      .select()
      .single();
    if (!error && data) setOrders(prev => [rowToOrder(data), ...prev]);
  };

  // Log the user out and go back to the login page
  const handleLogOut = async () => {
    await supabase.auth.signOut();
    setOrders([]); // clear orders from memory when logging out
    setCurrentPage('login');
  };

  // ---------------------------------------------------------------------------
  // Render — show the right page based on currentPage
  // ---------------------------------------------------------------------------

  // Still checking if the user is logged in — show a blank loading screen
  if (currentPage === 'checking-auth') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500">Loading...</p>
      </div>
    );
  }

  // Show the login page
  if (currentPage === 'login') {
    return (
      <LoginPage
        onLoginSuccess={() => setCurrentPage('app')}
        onGoToSignUp={() => setCurrentPage('signup')}
      />
    );
  }

  // Show the sign up page
  if (currentPage === 'signup') {
    return (
      <SignUpPage
        onSignUpSuccess={() => setCurrentPage('app')}
        onGoToLogin={() => setCurrentPage('login')}
      />
    );
  }

  // Show the main app (user is logged in)
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-slate-900">The Bloom Room</h1>
            <p className="text-slate-600 mt-1">Flower order management and business analytics</p>
          </div>
          {/* Log out button in the top right corner */}
          <button
            onClick={handleLogOut}
            className="text-sm text-slate-500 hover:text-slate-900 underline"
          >
            Log out
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="filing" className="w-full">
          <TabsList className="grid w-full max-w-2xl grid-cols-3">
            <TabsTrigger value="filing" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4" />
              Files
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="filing" className="mt-6">
            {loadingOrders ? (
              <div className="text-center text-slate-500 py-12">Loading orders...</div>
            ) : (
              <OrderFilingSystem
                orders={orders}
                onUpdateOrder={handleUpdateOrder}
                onDeleteOrder={handleDeleteOrder}
                onAddOrder={handleAddOrder}
              />
            )}
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <AnalyticsDashboard orders={orders} />
          </TabsContent>

          <TabsContent value="templates" className="mt-6">
            <FilesTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
