
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import PageTransition from '@/components/layout/PageTransition';
import { ProfileMenu } from '@/components/dashboard/ProfileMenu';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/integrations/firebase/client';
import { collection, addDoc } from 'firebase/firestore';

// Constants for Google Sheets API
const SHEET_ID = '1VG9aL5As4Rw_STVqV-se02TJzbILabtEDW1CEJPNEqo';
const API_KEY = 'AIzaSyBX8K1rtDZMIhfn6-QN-Q05A8dYdKPrR8s';
const SHEETS_API_URL = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Sheet1?key=${API_KEY}`;

interface Client {
  id: string;
  name: string;
  email: string;
}

const CreateOrder = () => {
  const { user } = useAuth();
  const [selectedClientId, setSelectedClientId] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();

  // Redirect if not admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/dashboard');
      toast.error('Access denied. Admin privileges required.');
    }
  }, [user, navigate]);

  const fetchClients = async (): Promise<Client[]> => {
    try {
      const response = await fetch(SHEETS_API_URL);
      
      if (!response.ok) {
        throw new Error('Failed to fetch client data');
      }
      
      const data = await response.json();
      
      // Skip the header row (index 0) and map to client objects
      return data.values && data.values.slice(1).map((row: string[], index: number) => ({
        id: `client-${Date.now()}-${index}`,
        name: row[1] || 'Unnamed Client', // Client Name is in column B (index 1)
        email: row[2] || '', // Client Email is in column C (index 2)
      })).filter((client: Client) => client.email); // Filter out entries without email
    } catch (error) {
      console.error('Error fetching clients:', error);
      throw error;
    }
  };

  const { data: clients = [], isLoading, error } = useQuery({
    queryKey: ['clients'],
    queryFn: fetchClients,
  });

  const handleCreateOrder = async () => {
    if (!selectedClientId) {
      toast.error('Please select a client');
      return;
    }

    if (!user) {
      toast.error('You must be logged in to create orders');
      navigate('/login');
      return;
    }

    const selectedClient = clients.find(client => client.id === selectedClientId);
    if (!selectedClient) {
      toast.error('Invalid client selected');
      return;
    }

    try {
      setIsCreating(true);
      
      // Create order in Firebase
      const now = new Date().toISOString();
      
      console.log('Creating order for client:', selectedClient.email);
      
      // Add order to Firebase Firestore
      const ordersRef = collection(db, 'orders');
      const newOrder = {
        client_email: selectedClient.email,
        created_at: now,
        current_stage: 'quotation',
        status: 'pending'
      };
      
      const docRef = await addDoc(ordersRef, newOrder);
      
      console.log("Document written with ID: ", docRef.id);
      
      if (!docRef || !docRef.id) {
        throw new Error('Failed to create order - no document ID returned');
      }
      
      toast.success('Order created successfully');
      navigate(`/order/${docRef.id}`);
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Failed to create order. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <PageTransition>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Create New Order</h1>
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              Dashboard
            </Button>
            <ProfileMenu />
          </div>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>New Order</CardTitle>
            <CardDescription>Create a new order for a client</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="client" className="text-sm font-medium">Select Client</label>
              {isLoading ? (
                <div className="text-sm text-muted-foreground">Loading clients...</div>
              ) : error ? (
                <div className="text-sm text-red-500">Error loading clients. Please try again.</div>
              ) : clients.length === 0 ? (
                <div className="py-4">
                  <p className="text-muted-foreground">No clients available in the Google Sheet.</p>
                </div>
              ) : (
                <Select onValueChange={setSelectedClientId} value={selectedClientId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name} ({client.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateOrder} 
              disabled={!selectedClientId || isLoading || isCreating}
            >
              {isCreating ? 'Creating...' : 'Create Order'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </PageTransition>
  );
};

export default CreateOrder;
