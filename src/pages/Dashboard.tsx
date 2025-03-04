
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useOrder, Order, OrderStage, OrderStatus } from '@/context/OrderContext';
import { Button } from "@/components/ui/button";
import PageTransition from '@/components/layout/PageTransition';
import { OrderCard } from '@/components/dashboard/OrderCard';
import { ProfileMenu } from '@/components/dashboard/ProfileMenu';
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from '@tanstack/react-query';
import { db } from '@/integrations/firebase/client';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { PlusCircle, FileText, RefreshCw } from 'lucide-react';

// Define the Firestore document type
interface OrderDocument {
  client_email: string;
  created_at: string;
  current_stage: OrderStage;
  status: OrderStatus;
  // Add other fields as needed
}

const Dashboard = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch client data for admin view
  const fetchClientData = async () => {
    try {
      // Fetch client data from Google Sheets API
      const SHEET_ID = '1VG9aL5As4Rw_STVqV-se02TJzbILabtEDW1CEJPNEqo';
      const API_KEY = 'AIzaSyBX8K1rtDZMIhfn6-QN-Q05A8dYdKPrR8s';
      const SHEETS_API_URL = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Sheet1?key=${API_KEY}`;
      
      const response = await fetch(SHEETS_API_URL);
      
      if (!response.ok) {
        throw new Error('Failed to fetch client data');
      }
      
      const data = await response.json();
      
      // Create a map of email to client name
      const clientsMap: Record<string, string> = {};
      
      if (data.values && data.values.length > 1) {
        // Skip header row (index 0)
        data.values.slice(1).forEach((row: string[]) => {
          const email = row[2]; // Client Email is in column C (index 2)
          const name = row[1]; // Client Name is in column B (index 1)
          if (email) {
            clientsMap[email] = name || 'Unknown';
          }
        });
      }
      
      return clientsMap;
    } catch (error) {
      console.error('Error fetching client data:', error);
      return {};
    }
  };

  const { data: clientsMap = {}, isLoading: isClientDataLoading } = useQuery({
    queryKey: ['clientsMap'],
    queryFn: fetchClientData,
    enabled: user?.role === 'admin',
  });

  // Fetch orders from Firestore based on user role
  const fetchOrders = async () => {
    if (!user) return [];
    
    try {
      setIsLoading(true);
      const ordersRef = collection(db, 'orders');
      let ordersQuery;
      
      // If client, only fetch their orders
      if (user.role === 'client') {
        ordersQuery = query(ordersRef, where("client_email", "==", user.email));
      } else {
        // If admin, fetch all orders
        ordersQuery = ordersRef;
      }
      
      const querySnapshot = await getDocs(ordersQuery);
      
      const fetchedOrders: Order[] = querySnapshot.docs.map(doc => {
        const data = doc.data() as OrderDocument;
        const order = {
          id: doc.id,
          clientId: data.client_email,
          createdAt: data.created_at,
          currentStage: data.current_stage,
          status: data.status,
          // Add other order fields as needed
        };
        console.log("Fetched order:", order);
        return order;
      });
      
      console.log("All fetched orders:", fetchedOrders);
      return fetchedOrders;
    } catch (error) {
      console.error('Error fetching orders:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };
  
  const { data: fetchedOrders = [], refetch, isRefetching } = useQuery({
    queryKey: ['orders', user?.email],
    queryFn: fetchOrders,
    enabled: !!user,
  });
  
  useEffect(() => {
    if (fetchedOrders) {
      console.log("Setting orders in state:", fetchedOrders);
      setOrders(fetchedOrders);
      setIsLoading(false);
    }
  }, [fetchedOrders]);

  // Get client name for an order
  const getClientName = (clientEmail: string) => {
    return clientsMap[clientEmail] || clientEmail;
  };

  // Handle order deletion
  const handleOrderDeleted = () => {
    refetch();
  };

  return (
    <PageTransition>
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-700 bg-clip-text text-transparent">
                Dashboard
              </h1>
              <p className="text-muted-foreground mt-1">
                {user?.role === 'admin' 
                  ? 'Manage and track all customer orders' 
                  : 'Track the progress of your orders'}
              </p>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => refetch()} 
                disabled={isRefetching}
                className="flex items-center gap-1"
              >
                <RefreshCw size={16} className={isRefetching ? "animate-spin" : ""} />
                Refresh
              </Button>
              
              {user?.role === 'admin' && (
                <Button asChild size="sm" className="flex items-center gap-1 bg-gradient-blue">
                  <Link to="/create-order">
                    <PlusCircle size={16} />
                    Create Order
                  </Link>
                </Button>
              )}
              <ProfileMenu />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((_, index) => (
              <div key={index} className="border rounded-xl p-6 space-y-4 bg-white shadow-sm">
                <Skeleton className="h-8 w-2/3" />
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orders.length > 0 ? (
              orders.map((order) => (
                <OrderCard 
                  key={order.id} 
                  order={order} 
                  clientName={user?.role === 'admin' ? getClientName(order.clientId) : undefined} 
                  onDelete={handleOrderDeleted}
                />
              ))
            ) : (
              <div className="col-span-full bg-white rounded-xl border p-8 text-center flex flex-col items-center">
                <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4">
                  <FileText size={24} className="text-muted-foreground" />
                </div>
                <h3 className="text-xl font-medium">No orders found</h3>
                <p className="text-muted-foreground mt-1 mb-6">
                  {user?.role === 'admin' 
                    ? 'Create your first order to get started' 
                    : 'You don\'t have any orders yet'}
                </p>
                {user?.role === 'admin' && (
                  <Button asChild className="bg-gradient-blue">
                    <Link to="/create-order" className="flex items-center gap-1">
                      <PlusCircle size={16} />
                      Create your first order
                    </Link>
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </PageTransition>
  );
};

export default Dashboard;
