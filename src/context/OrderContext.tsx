import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';
import { db } from '@/integrations/firebase/client';
import { collection, getDocs, addDoc, doc, updateDoc, onSnapshot, query, where } from 'firebase/firestore';

// Order stage type
export enum OrderStage {
  Quotation = "quotation",
  Material = "material",
  Production1 = "production1",
  Production2 = "production2",
  Painting = "painting",
  Delivery = "delivery",
  Completed = "completed"
}

// Order status type
export enum OrderStatus {
  Pending = "pending",
  InProgress = "in-progress",
  Completed = "completed"
}

// Order type
export interface Order {
  id: string;
  clientId: string;
  createdAt: string;
  currentStage: OrderStage;
  status: OrderStatus;
  quotation?: {
    link: string;
    approved: boolean;
    timestamp: string;
  };
  material?: {
    estimation: string;
    purchaseBill: string;
    loading: string;
    arrival: string;
    timestamp: string;
  };
  production1?: {
    marking: string;
    cutting: string;
    edgePreparation: string;
    jointWelding: string;
    design: string;
    designApproved: boolean;
    timestamp: string;
  };
  production2?: {
    fullWelding: string;
    surfaceFinishing: string;
    inspectionNeeded: boolean;
    timestamp: string;
  };
  painting?: {
    primer: string;
    painting: string;
    inspectionNeeded: boolean;
    timestamp: string;
  };
  delivery?: {
    date: string;
    confirmed: boolean;
    loading: string;
    vehicleNumber: string;
    driverNumber: string;
    successful: boolean;
    timestamp: string;
  };
}

// User type
export interface User {
  id: string;
  email: string;
  password: string;
  role: 'admin' | 'client';
}

// Order context type
interface OrderContextType {
  orders: Order[];
  users: User[];
  getOrderById: (id: string) => Order | undefined;
  getOrdersByClientId: (clientId: string) => Order[];
  createOrder: (clientId: string) => Promise<Order>;
  updateQuotation: (orderId: string, link: string) => void;
  approveQuotation: (orderId: string, approved: boolean) => void;
  updateMaterial: (orderId: string, data: Partial<Order['material']>) => void;
  updateProduction1: (orderId: string, data: Partial<Order['production1']>) => void;
  approveDesign: (orderId: string, approved: boolean) => void;
  updateProduction2: (orderId: string, data: Partial<Order['production2']>) => void;
  requestInspection: (orderId: string, needed: boolean) => void;
  updatePainting: (orderId: string, data: Partial<Order['painting']>) => void;
  requestPaintingInspection: (orderId: string, needed: boolean) => void;
  updateDeliveryDate: (orderId: string, date: string) => void;
  confirmDeliveryDate: (orderId: string, confirmed: boolean) => void;
  updateDeliveryDetails: (orderId: string, data: Partial<Order['delivery']>) => void;
  confirmDelivery: (orderId: string, successful: boolean) => void;
  addUser: (email: string) => void;
  removeUser: (userId: string) => void;
  changePassword: (userId: string, newPassword: string) => void;
  moveToNextStage: (orderId: string) => void;
}

// Create the context
const OrderContext = createContext<OrderContextType | undefined>(undefined);

// Order provider component
export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const { user } = useAuth();
  
  // Initialize with default admin user if not present
  const initialUsers: User[] = [
    {
      id: 'admin-1',
      email: 'admin@pvt.com',
      password: '12345678',
      role: 'admin'
    }
  ];
  
  // Get stored users from localStorage or use default
  const storedUsers = JSON.parse(localStorage.getItem('users') || JSON.stringify(initialUsers));
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>(storedUsers);
  const [isLoading, setIsLoading] = useState(true);
  
  // Save users to localStorage when they change
  useEffect(() => {
    localStorage.setItem('users', JSON.stringify(users));
  }, [users]);
  
  // Fetch orders from Firebase when the user changes
  useEffect(() => {
    if (user) {
      fetchOrders();
      
      // Subscribe to realtime changes
      const ordersRef = collection(db, 'orders');
      const unsubscribe = onSnapshot(ordersRef, () => {
        fetchOrders();
      });
      
      return () => {
        unsubscribe();
      };
    }
  }, [user]);
  
  // Function to fetch orders from Firebase
  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      
      // Fetch orders from Firebase
      const ordersRef = collection(db, 'orders');
      const snapshot = await getDocs(ordersRef);
      
      if (snapshot.empty) {
        setOrders([]);
        return;
      }
      
      // Map Firebase data to Order objects
      const mappedOrders: Order[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          clientId: data.client_email,
          createdAt: data.created_at,
          currentStage: data.current_stage as OrderStage,
          status: data.status as OrderStatus,
          
          // Map quotation data if available
          quotation: data.quotation_link ? {
            link: data.quotation_link,
            approved: data.quotation_approved || false,
            timestamp: data.quotation_timestamp || new Date().toISOString()
          } : undefined,
          
          // Map material data if available
          material: data.material_estimation ? {
            estimation: data.material_estimation,
            purchaseBill: data.material_purchase_bill || '',
            loading: data.material_loading || '',
            arrival: data.material_arrival || '',
            timestamp: data.material_timestamp || new Date().toISOString()
          } : undefined,
          
          // Map production1 data if available
          production1: data.production1_marking ? {
            marking: data.production1_marking,
            cutting: data.production1_cutting || '',
            edgePreparation: data.production1_edge_preparation || '',
            jointWelding: data.production1_joint_welding || '',
            design: data.production1_design || '',
            designApproved: data.production1_design_approved || false,
            timestamp: data.production1_timestamp || new Date().toISOString()
          } : undefined,
          
          // Map production2 data if available
          production2: data.production2_full_welding ? {
            fullWelding: data.production2_full_welding,
            surfaceFinishing: data.production2_surface_finishing || '',
            inspectionNeeded: data.production2_inspection_needed || false,
            timestamp: data.production2_timestamp || new Date().toISOString()
          } : undefined,
          
          // Map painting data if available
          painting: data.painting_primer ? {
            primer: data.painting_primer,
            painting: data.painting_painting || '',
            inspectionNeeded: data.painting_inspection_needed || false,
            timestamp: data.painting_timestamp || new Date().toISOString()
          } : undefined,
          
          // Map delivery data if available
          delivery: data.delivery_date ? {
            date: data.delivery_date,
            confirmed: data.delivery_confirmed || false,
            loading: data.delivery_loading || '',
            vehicleNumber: data.delivery_vehicle_number || '',
            driverNumber: data.delivery_driver_number || '',
            successful: data.delivery_successful || false,
            timestamp: data.delivery_timestamp || new Date().toISOString()
          } : undefined
        };
      };
        
      setOrders(mappedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to fetch orders');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Get order by ID
  const getOrderById = (id: string) => {
    return orders.find(order => order.id === id);
  };
  
  // Get orders by client ID
  const getOrdersByClientId = (clientId: string) => {
    return orders.filter(order => order.clientId === clientId);
  };
  
  // Create a new order in Firebase and Google Sheet
  const createOrder = async (clientId: string): Promise<Order> => {
    const now = new Date().toISOString();
    
    const newOrder: Order = {
      id: `order-${Date.now()}`, // Temporary ID that will be replaced by Firebase ID
      clientId,
      createdAt: now,
      currentStage: OrderStage.Quotation,
      status: OrderStatus.Pending,
    };
    
    try {
      // Insert new order into Firebase
      const ordersRef = collection(db, 'orders');
      const orderData = {
        client_email: clientId,
        created_at: now,
        current_stage: OrderStage.Quotation,
        status: OrderStatus.Pending
      };
      
      const docRef = await addDoc(ordersRef, orderData);
      
      // Update the order with the Firebase-generated ID
      if (docRef) {
        newOrder.id = docRef.id;
        
        // Also store the order in Google Sheet
        try {
          // Use direct client info fetch rather than Firebase query to avoid TS errors
          // This is a simplified approach to get client name
          const API_URL = 'https://script.google.com/macros/s/AKfycbxqstONiuzpli9Rrp4dqk58j0iWNqdPKsgUOtul0ilF6-Z6A9P8cw1OLfIXTo4GCg5V/exec';
          
          // First fetch client info
          const clientResponse = await fetch(`${API_URL}?clientEmail=${encodeURIComponent(clientId)}`);
          const clientData = await clientResponse.json();
          
          const clientName = clientData?.client?.name || 'Unknown Client';
          
          // Then add the order to the sheet
          const sheetResponse = await fetch(`${API_URL}?action=addOrder`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              orderId: docRef.id,
              clientName: clientName,
              clientEmail: clientId,
              createdAt: now,
              currentStage: OrderStage.Quotation,
              status: OrderStatus.Pending
            }),
          });
          
          if (!sheetResponse.ok) {
            console.error('Failed to add order to Google Sheet:', await sheetResponse.text());
          }
        } catch (sheetError) {
          // Just log the error but don't fail the order creation
          console.error('Error adding order to Google Sheet:', sheetError);
        }
      }
      
      toast.success('Order created successfully');
      await fetchOrders(); // Refresh orders
      
      return newOrder;
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Failed to create order');
      return newOrder;
    }
  };
  
  // Update quotation in Firebase
  const updateQuotation = async (orderId: string, link: string) => {
    const now = new Date().toISOString();
    
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        quotation_link: link,
        quotation_approved: false,
        quotation_timestamp: now,
        status: OrderStatus.InProgress
      });
      
      // Update local state
      setOrders(prev => 
        prev.map(order => 
          order.id === orderId
            ? { 
                ...order, 
                quotation: { 
                  link, 
                  approved: false, 
                  timestamp: now 
                },
                status: OrderStatus.InProgress
              }
            : order
        )
      );
      
      toast.success('Quotation updated');
    } catch (error) {
      console.error('Error updating quotation:', error);
      toast.error('Failed to update quotation');
    }
  };
  
  // Approve quotation in Firebase
  const approveQuotation = async (orderId: string, approved: boolean) => {
    try {
      const updateData: Record<string, any> = {
        quotation_approved: approved
      };
      
      if (approved) {
        updateData.current_stage = OrderStage.Material;
      }
      
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, updateData);
      
      // Update local state
      setOrders(prev => 
        prev.map(order => {
          if (order.id === orderId) {
            const updatedOrder = { 
              ...order,
              quotation: order.quotation ? { 
                ...order.quotation, 
                approved 
              } : undefined
            };
            
            if (approved) {
              updatedOrder.currentStage = OrderStage.Material;
            }
            
            return updatedOrder;
          }
          return order;
        })
      );
      
      toast.success(approved ? 'Quotation approved' : 'Quotation rejected');
    } catch (error) {
      console.error('Error approving quotation:', error);
      toast.error('Failed to update quotation approval status');
    }
  };
  
  // Update material in Firebase
  const updateMaterial = async (orderId: string, data: Partial<Order['material']>) => {
    const now = new Date().toISOString();
    
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        material_estimation: data.estimation || null,
        material_purchase_bill: data.purchaseBill || null,
        material_loading: data.loading || null,
        material_arrival: data.arrival || null,
        material_timestamp: now
      });
      
      // Update local state
      setOrders(prev => 
        prev.map(order => {
          if (order.id === orderId) {
            return { 
              ...order, 
              material: { 
                ...order.material as Order['material'],
                ...data,
                timestamp: now
              }
            };
          }
          return order;
        })
      );
      
      toast.success('Material information updated');
    } catch (error) {
      console.error('Error updating material:', error);
      toast.error('Failed to update material information');
    }
  };
  
  // Update production (part 1) in Firebase
  const updateProduction1 = async (orderId: string, data: Partial<Order['production1']>) => {
    const now = new Date().toISOString();
    
    try {
      const order = getOrderById(orderId);
      const updateData: Record<string, any> = {
        production1_marking: data.marking || null,
        production1_cutting: data.cutting || null,
        production1_edge_preparation: data.edgePreparation || null,
        production1_joint_welding: data.jointWelding || null,
        production1_design: data.design || null,
        production1_timestamp: now
      };
      
      // If we're updating for the first time
      if (!order?.production1 && order?.currentStage === OrderStage.Material) {
        updateData.current_stage = OrderStage.Production1;
      }
      
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, updateData);
      
      // Update local state
      setOrders(prev => 
        prev.map(order => {
          if (order.id === orderId) {
            const updatedOrder = { 
              ...order, 
              production1: { 
                ...order.production1 as Order['production1'],
                ...data,
                timestamp: now
              }
            };
            
            // If we're updating for the first time
            if (!order.production1 && order.currentStage === OrderStage.Material) {
              updatedOrder.currentStage = OrderStage.Production1;
            }
            
            return updatedOrder;
          }
          return order;
        })
      );
      
      toast.success('Production information updated');
    } catch (error) {
      console.error('Error updating production1:', error);
      toast.error('Failed to update production information');
    }
  };
  
  // Approve design in Firebase
  const approveDesign = async (orderId: string, approved: boolean) => {
    try {
      const updateData: Record<string, any> = {
        production1_design_approved: approved
      };
      
      if (approved) {
        updateData.current_stage = OrderStage.Production2;
      }
      
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, updateData);
      
      // Update local state
      setOrders(prev => 
        prev.map(order => {
          if (order.id === orderId) {
            const updatedOrder = { 
              ...order,
              production1: order.production1 ? { 
                ...order.production1, 
                designApproved: approved 
              } : undefined
            };
            
            if (approved) {
              updatedOrder.currentStage = OrderStage.Production2;
            }
            
            return updatedOrder;
          }
          return order;
        })
      );
      
      toast.success(approved ? 'Design approved' : 'Design rejected');
    } catch (error) {
      console.error('Error approving design:', error);
      toast.error('Failed to update design approval status');
    }
  };
  
  // Update production (part 2) in Firebase
  const updateProduction2 = async (orderId: string, data: Partial<Order['production2']>) => {
    const now = new Date().toISOString();
    
    try {
      const order = getOrderById(orderId);
      const updateData: Record<string, any> = {
        production2_full_welding: data.fullWelding || null,
        production2_surface_finishing: data.surfaceFinishing || null,
        production2_timestamp: now
      };
      
      // If we're updating for the first time
      if (!order?.production2 && order?.currentStage === OrderStage.Production1) {
        updateData.current_stage = OrderStage.Production2;
      }
      
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, updateData);
      
      // Update local state
      setOrders(prev => 
        prev.map(order => {
          if (order.id === orderId) {
            const updatedOrder = { 
              ...order, 
              production2: { 
                ...order.production2 as Order['production2'],
                ...data,
                timestamp: now
              }
            };
            
            // If we're updating for the first time
            if (!order.production2 && order.currentStage === OrderStage.Production1) {
              updatedOrder.currentStage = OrderStage.Production2;
            }
            
            return updatedOrder;
          }
          return order;
        })
      );
      
      toast.success('Production information updated');
    } catch (error) {
      console.error('Error updating production2:', error);
      toast.error('Failed to update production information');
    }
  };
  
  // Request inspection in Firebase
  const requestInspection = async (orderId: string, needed: boolean) => {
    try {
      const updateData: Record<string, any> = {
        production2_inspection_needed: needed
      };
      
      // Only proceed to next stage if client specifically chose NOT to inspect
      if (!needed) {
        updateData.current_stage = OrderStage.Painting;
      }
      
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, updateData);
      
      // Update local state
      setOrders(prev => 
        prev.map(order => {
          if (order.id === orderId) {
            const updatedOrder = { 
              ...order,
              production2: order.production2 ? { 
                ...order.production2, 
                inspectionNeeded: needed 
              } : undefined
            };
            
            // Only proceed to next stage if client specifically chose NOT to inspect
            if (!needed) {
              updatedOrder.currentStage = OrderStage.Painting;
            }
            
            return updatedOrder;
          }
          return order;
        })
      );
      
      toast.success(needed ? 'Inspection requested' : 'Proceeding without inspection');
    } catch (error) {
      console.error('Error requesting inspection:', error);
      toast.error('Failed to update inspection status');
    }
  };
  
  // Update painting in Firebase
  const updatePainting = async (orderId: string, data: Partial<Order['painting']>) => {
    const now = new Date().toISOString();
    
    try {
      const order = getOrderById(orderId);
      const updateData: Record<string, any> = {
        painting_primer: data.primer || null,
        painting_painting: data.painting || null,
        painting_timestamp: now
      };
      
      // If we're updating for the first time
      if (!order?.painting && order?.currentStage === OrderStage.Production2) {
        updateData.current_stage = OrderStage.Painting;
      }
      
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, updateData);
      
      // Update local state
      setOrders(prev => 
        prev.map(order => {
          if (order.id === orderId) {
            const updatedOrder = { 
              ...order, 
              painting: { 
                ...order.painting as Order['painting'],
                ...data,
                timestamp: now
              }
            };
            
            // If we're updating for the first time
            if (!order.painting && order.currentStage === OrderStage.Production2) {
              updatedOrder.currentStage = OrderStage.Painting;
            }
            
            return updatedOrder;
          }
          return order;
        })
      );
      
      toast.success('Painting information updated');
    } catch (error) {
      console.error('Error updating painting:', error);
      toast.error('Failed to update painting information');
    }
  };
  
  // Request painting inspection in Firebase
  const requestPaintingInspection = async (orderId: string, needed: boolean) => {
    try {
      const updateData: Record<string, any> = {
        painting_inspection_needed: needed
      };
      
      // Only proceed to next stage if client specifically chose NOT to inspect
      if (!needed) {
        updateData.current_stage = OrderStage.Delivery;
      }
      
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, updateData);
      
      // Update local state
      setOrders(prev => 
        prev.map(order => {
          if (order.id === orderId) {
            const updatedOrder = { 
              ...order,
              painting: order.painting ? { 
                ...order.painting, 
                inspectionNeeded: needed 
              } : undefined
            };
            
            // Only proceed to next stage if client specifically chose NOT to inspect
            if (!needed) {
              updatedOrder.currentStage = OrderStage.Delivery;
            }
            
            return updatedOrder;
          }
          return order;
        })
      );
      
      toast.success(needed ? 'Painting inspection requested' : 'Proceeding without inspection');
    } catch (error) {
      console.error('Error requesting painting inspection:', error);
      toast.error('Failed to update inspection status');
    }
  };
  
  // Update delivery date in Firebase
  const updateDeliveryDate = async (orderId: string, date: string) => {
    const now = new Date().toISOString();
    
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        delivery_date: date,
        delivery_confirmed: false,
        delivery_timestamp: now,
        current_stage: OrderStage.Delivery
      });
      
      // Update local state
      setOrders(prev => 
        prev.map(order => {
          if (order.id === orderId) {
            return { 
              ...order, 
              delivery: { 
                ...order.delivery as Order['delivery'],
                date,
                confirmed: false,
                timestamp: now
              },
              currentStage: OrderStage.Delivery
            };
          }
          return order;
        })
      );
      
      toast.success('Delivery date updated');
    } catch (error) {
      console.error('Error updating delivery date:', error);
      toast.error('Failed to update delivery date');
    }
  };
  
  // Confirm delivery date in Firebase
  const confirmDeliveryDate = async (orderId: string, confirmed: boolean) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        delivery_confirmed: confirmed
      });
      
      // Update local state
      setOrders(prev => 
        prev.map(order => {
          if (order.id === orderId) {
            return { 
              ...order,
              delivery: order.delivery ? { 
                ...order.delivery, 
                confirmed
              } : undefined
            };
          }
          return order;
        })
      );
      
      toast.success(confirmed ? 'Delivery date confirmed' : 'Delivery date rejected');
    } catch (error) {
      console.error('Error confirming delivery date:', error);
      toast.error('Failed to update delivery confirmation');
    }
  };
  
  // Update delivery details in Firebase
  const updateDeliveryDetails = async (orderId: string, data: Partial<Order['delivery']>) => {
    const now = new Date().toISOString();
    
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        delivery_loading: data.loading || null,
        delivery_vehicle_number: data.vehicleNumber || null,
        delivery_driver_number: data.driverNumber || null,
        delivery_timestamp: now
      });
      
      // Update local state
      setOrders(prev => 
        prev.map(order => {
          if (order.id === orderId) {
            return { 
              ...order, 
              delivery: { 
                ...order.delivery as Order['delivery'],
                ...data,
                timestamp: now
              }
            };
          }
          return order;
        })
      );
      
      toast.success('Delivery details updated');
    } catch (error) {
      console.error('Error updating delivery details:', error);
      toast.error('Failed to update delivery details');
    }
  };
  
  // Confirm delivery in Firebase
  const confirmDelivery = async (orderId: string, successful: boolean) => {
    try {
      const updateData: Record<string, any> = {
        delivery_successful: successful
      };
      
      // Only mark as completed if successful
      if (successful) {
        updateData.current_stage = OrderStage.Completed;
        updateData.status = OrderStatus.Completed;
      }
      
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, updateData);
      
      // Update local state
      setOrders(prev => 
        prev.map(order => {
          if (order.id === orderId) {
            const updatedOrder = { 
              ...order,
              delivery: order.delivery ? { 
                ...order.delivery, 
                successful
              } : undefined
            };
            
            // Only mark as completed if successful
            if (successful) {
              updatedOrder.currentStage = OrderStage.Completed;
              updatedOrder.status = OrderStatus.Completed;
            }
            
            return updatedOrder;
          }
          return order;
        })
      );
      
      toast.success(successful ? 'Order received successfully' : 'Order receipt issues reported');
    } catch (error) {
      console.error('Error confirming delivery:', error);
      toast.error('Failed to update delivery status');
    }
  };
  
  // Add a new user (client)
  const addUser = (email: string) => {
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      toast.error('User with this email already exists');
      return;
    }
    
    const newUser: User = {
      id: `user-${Date.now()}`,
      email,
      password: '12345678', // Default password
      role: 'client'
    };
    
    setUsers(prev => [...prev, newUser]);
    toast.success('Client added successfully');
  };
  
  // Remove a user
  const removeUser = (userId: string) => {
    setUsers(prev => prev.filter(user => user.id !== userId));
    toast.success('User removed successfully');
  };
  
  // Change password
  const changePassword = (userId: string, newPassword: string) => {
    setUsers(prev => 
      prev.map(user => 
        user.id === userId
          ? { ...user, password: newPassword }
          : user
      )
    );
    toast.success('Password changed successfully');
  };
  
  // Function to check if an order can move to the next stage
  // This ensures client actions are required before admin can proceed
  const canMoveToNextStage = (order: Order): boolean => {
    switch (order.currentStage) {
      case OrderStage.Quotation:
        return !!order.quotation?.approved;
      
      case OrderStage.Material:
        return !!(order.material?.estimation && 
                order.material?.purchaseBill && 
                order.material?.loading && 
                order.material?.arrival);
      
      case OrderStage.Production1:
        return !!order.production1?.designApproved;
      
      case OrderStage.Production2:
        // Can only proceed if inspection is explicitly NOT needed
        return order.production2?.inspectionNeeded === false;
      
      case OrderStage.Painting:
        // Can only proceed if painting inspection is explicitly NOT needed
        return order.painting?.inspectionNeeded === false;
      
      case OrderStage.Delivery:
        return !!order.delivery?.successful;
      
      default:
        return false;
    }
  };
  
  // Move to next stage - updated to check if client actions are completed
  const moveToNextStage = async (orderId: string) => {
    try {
      const order = getOrderById(orderId);
      if (!order) {
        toast.error('Order not found');
        return;
      }
      
      // Check if client has completed required actions
      if (!canMoveToNextStage(order)) {
        toast.error('Cannot proceed - waiting for client action');
        return;
      }
      
      let nextStage = order.currentStage;
      
      // Determine the next stage based on current stage
      switch (order.currentStage) {
        case OrderStage.Quotation:
          nextStage = OrderStage.Material;
          break;
        case OrderStage.Material:
          nextStage = OrderStage.Production1;
          break;
        case OrderStage.Production1:
          nextStage = OrderStage.Production2;
          break;
        case OrderStage.Production2:
          nextStage = OrderStage.Painting;
          break;
        case OrderStage.Painting:
          nextStage = OrderStage.Delivery;
          break;
        case OrderStage.Delivery:
          nextStage = OrderStage.Completed;
          // Also update status to completed
          const updateRef = doc(db, 'orders', orderId);
          await updateDoc(updateRef, {
            current_stage: OrderStage.Completed,
            status: OrderStatus.Completed
          });
          break;
        default:
          break;
      }
      
      // Update in Firebase
      if (nextStage !== order.currentStage) {
        const orderRef = doc(db, 'orders', orderId);
        await updateDoc(orderRef, {
          current_stage: nextStage
        });
        
        // Update local state
        setOrders(prev => 
          prev.map(o => 
            o.id === orderId
              ? { ...o, currentStage: nextStage }
              : o
          )
        );
        
        toast.success(`Moved to ${nextStage.replace(/([A-Z])/g, ' $1').trim()} stage`);
      }
    } catch (error) {
      console.error('Error moving to next stage:', error);
      toast.error('Failed to move to next stage');
    }
  };
  
  // Context value
  const contextValue: OrderContextType = {
    orders,
    users,
    getOrderById,
    getOrdersByClientId,
    createOrder,
    updateQuotation,
    approveQuotation,
    updateMaterial,
    updateProduction1,
    approveDesign,
    updateProduction2,
    requestInspection,
    updatePainting,
    requestPaintingInspection,
    updateDeliveryDate,
    confirmDeliveryDate,
    updateDeliveryDetails,
    confirmDelivery,
    addUser,
    removeUser,
    changePassword,
    moveToNextStage
  };
  
  return (
    <OrderContext.Provider value={contextValue}>
      {children}
    </OrderContext.Provider>
  );
};

// Hook for using order context
export const useOrder = () => {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
};
