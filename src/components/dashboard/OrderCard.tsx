
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Order, OrderStage, OrderStatus } from "@/context/OrderContext";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { Trash2, ArrowRight, Clock } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/integrations/firebase/client";
import { deleteDoc, doc } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface OrderCardProps {
  order: Order;
  clientName?: string;
  onDelete?: () => void;
}

export function OrderCard({ order, clientName, onDelete }: OrderCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  
  const handleClick = () => {
    navigate(`/order/${order.id}`);
  };
  
  const handleDelete = async (e: React.MouseEvent) => {
    // Prevent navigating to order details
    e.stopPropagation();
    
    try {
      setIsDeleting(true);
      
      // Delete document from Firestore
      await deleteDoc(doc(db, 'orders', order.id));
      
      toast.success("Order deleted successfully");
      
      // Call onDelete callback to refresh the orders list
      if (onDelete) {
        onDelete();
      }
    } catch (error) {
      console.error("Error deleting order:", error);
      toast.error("Failed to delete order");
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Format date nicely
  const formattedDate = new Date(order.createdAt).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });

  // Get stage name for display
  const getStageName = (stage: OrderStage) => {
    switch(stage) {
      case "quotation": return "Quotation";
      case "material": return "Material Management";
      case "production1": return "Production (Part 1)";
      case "production2": return "Production (Part 2)";
      case "painting": return "Painting & Polishing";
      case "delivery": return "Delivery Planning";
      case "completed": return "Completed";
      default: return stage;
    }
  };
  
  // Get status badge color
  const getStatusColor = (status: OrderStatus) => {
    switch(status) {
      case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "in-progress": return "bg-blue-100 text-blue-800 border-blue-200";
      case "completed": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Calculate progress percentage
  const getProgressPercentage = () => {
    switch (order.currentStage) {
      case "quotation": return 10;
      case "material": return 30;
      case "production1": return 45;
      case "production2": return 60;
      case "painting": return 75;
      case "delivery": return 90;
      case "completed": return 100;
      default: return 0;
    }
  };

  // Determine progress bar color
  const getProgressBarColor = () => {
    if (order.status === "completed") return "bg-gradient-success";
    if (getProgressPercentage() > 60) return "bg-gradient-info";
    if (getProgressPercentage() > 30) return "bg-gradient-warning";
    return "bg-gradient-blue";
  };

  return (
    <motion.div
      whileHover={{ y: -5 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "rounded-xl border bg-white overflow-hidden shadow-sm cursor-pointer card-hover transition-all duration-300",
        order.status === "completed" ? "border-green-200" : "hover:border-primary/50"
      )}
      onClick={handleClick}
    >
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-semibold text-lg">Order #{order.id.substring(0, 6)}</h3>
            <div className="flex items-center text-sm text-muted-foreground mt-1">
              <Clock className="w-3.5 h-3.5 mr-1" />
              {formattedDate}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge className={cn("border px-2.5 py-1", getStatusColor(order.status))}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1).replace("-", " ")}
            </Badge>
            
            {user?.role === "admin" && (
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className={cn(
                  "p-1.5 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors",
                  isDeleting && "opacity-50 cursor-not-allowed"
                )}
                aria-label="Delete order"
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>
        </div>
        
        <div className="mb-4">
          <div className="flex justify-between mb-1.5">
            <div className="text-sm font-medium">Current Stage</div>
            <div className="text-sm">{getProgressPercentage()}%</div>
          </div>
          
          <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
            <div 
              className={cn("h-full rounded-full progress-bar-animated", getProgressBarColor())}
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>
          
          <div className="mt-2.5 text-primary font-medium flex items-center">
            {getStageName(order.currentStage)}
          </div>
        </div>
        
        {user?.role === "admin" && clientName && (
          <div className="pt-4 border-t border-border/50">
            <div className="text-sm font-medium text-muted-foreground">Client</div>
            <div className="font-medium">{clientName}</div>
          </div>
        )}
      </div>
      
      <div className="bg-secondary/30 px-6 py-3 flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          {order.status === "completed" ? "Completed" : "In Progress"}
        </div>
        <ArrowRight size={16} className="text-muted-foreground" />
      </div>
    </motion.div>
  );
}
