
import React from 'react';
import { Button } from "@/components/ui/button";
import { 
  Check, 
  X, 
  ArrowRight, 
  Calendar, 
  ThumbsUp, 
  ThumbsDown, 
  CircleCheck,
  CircleX,
  AlertTriangle,
  Eye,
  EyeOff
} from "lucide-react";
import { useAuth } from '@/context/AuthContext';
import { Order, OrderStage, useOrder } from '@/context/OrderContext';
import { toast } from 'sonner';

interface OrderButtonsProps {
  order: Order;
  refreshOrder: () => void;
}

export const OrderButtons: React.FC<OrderButtonsProps> = ({ order, refreshOrder }) => {
  const { user } = useAuth();
  const { 
    approveQuotation, 
    approveDesign, 
    requestInspection, 
    requestPaintingInspection,
    confirmDeliveryDate,
    confirmDelivery,
    moveToNextStage,
    updateDeliveryDate
  } = useOrder();

  const isAdmin = user?.role === 'admin';
  const isClient = user?.role === 'client';
  
  // Helper function to check if the client can approve something
  const canClientApprove = (isClient: boolean) => {
    return isClient;
  };

  // Helper function to check if admin can proceed to next stage
  const canAdminProceed = (order: Order, stage: OrderStage): boolean => {
    switch (stage) {
      case OrderStage.Quotation:
        // Admin can proceed only if quotation is approved
        return !!order.quotation?.approved;
      
      case OrderStage.Material:
        // Admin can proceed only if all material fields are filled
        return !!(order.material?.estimation && 
                order.material?.purchaseBill && 
                order.material?.loading && 
                order.material?.arrival);
      
      case OrderStage.Production1:
        // Admin can proceed only if design is approved
        return !!order.production1?.designApproved;
      
      case OrderStage.Production2:
        // Admin can proceed only if inspection decision is made AND client chose not to inspect
        return order.production2?.inspectionNeeded === false;
      
      case OrderStage.Painting:
        // Admin can proceed only if painting inspection decision is made AND client chose not to inspect
        return order.painting?.inspectionNeeded === false;
      
      case OrderStage.Delivery:
        // Admin can mark order as completed only if delivery is confirmed successful
        return !!order.delivery?.successful;
      
      default:
        return false;
    }
  };

  // Only show buttons for the current stage
  const shouldShowStageButtons = (stageName: OrderStage) => {
    return order.currentStage === stageName;
  };

  // =========================================================
  // Admin Override - allows admin to bypass client approval steps
  // =========================================================
  const handleAdminOverride = (orderId: string, action: string) => {
    switch (action) {
      case 'approveQuotation':
        approveQuotation(orderId, true);
        toast.success("Admin override: Quotation approved");
        break;
      case 'approveDesign':
        approveDesign(orderId, true);
        toast.success("Admin override: Design approved");
        break;
      case 'skipInspection':
        requestInspection(orderId, false);
        toast.success("Admin override: Proceeding without inspection");
        break;
      case 'skipPaintingInspection':
        requestPaintingInspection(orderId, false);
        toast.success("Admin override: Proceeding without painting inspection");
        break;
      case 'confirmDeliveryDate':
        confirmDeliveryDate(orderId, true);
        toast.success("Admin override: Delivery date confirmed");
        break;
      case 'confirmDelivery':
        confirmDelivery(orderId, true);
        toast.success("Admin override: Delivery confirmed as successful");
        break;
    }
    refreshOrder();
  };

  // =========================================================
  // Step 1: Quotation Approval (Client Only)
  // =========================================================
  const renderQuotationButtons = () => {
    // Only show if we're in quotation stage and there's a quotation link
    if (shouldShowStageButtons(OrderStage.Quotation) && order.quotation?.link) {
      // For client: enable buttons
      // For admin: disable buttons (client must approve)
      const isDisabled = !canClientApprove(isClient);
      const isApproved = order.quotation?.approved;

      if (isApproved) {
        return (
          <div className="flex flex-col items-center gap-2 p-4 border rounded-md bg-green-50 border-green-200">
            <p className="text-green-600 font-medium">Quotation has been approved</p>
            <p className="text-sm text-green-500">Thanks for your approval!</p>
          </div>
        );
      }

      return (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-gray-600">
            {isAdmin 
              ? "Waiting for client approval" 
              : "Please review and approve the quotation to proceed"}
          </p>
          <div className="flex gap-2">
            <Button 
              variant="default"
              disabled={isDisabled}
              onClick={() => {
                approveQuotation(order.id, true);
                toast.success("Quotation approved successfully");
                refreshOrder();
              }}
            >
              <ThumbsUp className="mr-2" /> Approve
            </Button>
            <Button 
              variant="destructive"
              disabled={isDisabled}
              onClick={() => {
                approveQuotation(order.id, false);
                toast.error("Quotation has been rejected");
                refreshOrder();
              }}
            >
              <ThumbsDown className="mr-2" /> Deny
            </Button>
          </div>
          
          {/* Admin override */}
          {isAdmin && (
            <div className="mt-4 p-3 border border-amber-200 bg-amber-50 rounded-md">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="text-amber-500 w-5 h-5" />
                <p className="text-amber-700 text-sm font-medium">Admin Override</p>
              </div>
              <p className="text-sm text-amber-600 mb-2">You can bypass client approval if needed:</p>
              <Button 
                variant="outline"
                size="sm"
                className="border-amber-200 text-amber-700 hover:bg-amber-100"
                onClick={() => handleAdminOverride(order.id, 'approveQuotation')}
              >
                <ArrowRight className="mr-1 w-3 h-3" /> Force Approve & Continue
              </Button>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // =========================================================
  // Step 2: Material Management - Next Stage Button (Admin Only)
  // =========================================================
  const renderMaterialNextButton = () => {
    if (shouldShowStageButtons(OrderStage.Material) && isAdmin) {
      // Check if material data is added
      const materialDataExists = order.material?.estimation && 
                                order.material?.purchaseBill && 
                                order.material?.loading && 
                                order.material?.arrival;
      
      const canProceed = canAdminProceed(order, OrderStage.Material);
      
      return (
        <div className="mt-4">
          <Button 
            variant="default" 
            className={`w-full ${!canProceed ? 'opacity-50' : ''}`}
            disabled={!canProceed}
            onClick={() => {
              moveToNextStage(order.id);
              toast.success("Proceeding to Production Part 1");
              refreshOrder();
            }}
          >
            <ArrowRight className="mr-2" /> Proceed to Production Part 1
          </Button>
          
          {!materialDataExists && (
            <p className="text-sm text-amber-600 mt-2">
              Please complete all material details before proceeding
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // =========================================================
  // Step 3: Production Part 1 - Design Approval (Client Only)
  // =========================================================
  const renderDesignApprovalButtons = () => {
    if (shouldShowStageButtons(OrderStage.Production1) && order.production1?.design) {
      const isDisabled = !canClientApprove(isClient);
      const isApproved = order.production1?.designApproved;

      if (isApproved) {
        return (
          <div className="flex flex-col items-center gap-2 p-4 border rounded-md bg-green-50 border-green-200">
            <p className="text-green-600 font-medium">Design has been approved</p>
            <p className="text-sm text-green-500">Thanks for your approval!</p>
          </div>
        );
      }

      return (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-gray-600">
            {isAdmin 
              ? "Waiting for client to approve the design" 
              : "Please review and approve the design to proceed"}
          </p>
          <div className="flex gap-2">
            <Button 
              variant="default"
              disabled={isDisabled}
              onClick={() => {
                approveDesign(order.id, true);
                toast.success("Design approved successfully");
                refreshOrder();
              }}
            >
              <ThumbsUp className="mr-2" /> Approve
            </Button>
            <Button 
              variant="destructive"
              disabled={isDisabled}
              onClick={() => {
                approveDesign(order.id, false);
                toast.error("Design has been rejected");
                refreshOrder();
              }}
            >
              <ThumbsDown className="mr-2" /> Deny
            </Button>
          </div>
          
          {/* Admin override */}
          {isAdmin && (
            <div className="mt-4 p-3 border border-amber-200 bg-amber-50 rounded-md">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="text-amber-500 w-5 h-5" />
                <p className="text-amber-700 text-sm font-medium">Admin Override</p>
              </div>
              <p className="text-sm text-amber-600 mb-2">You can bypass client approval if needed:</p>
              <Button 
                variant="outline"
                size="sm"
                className="border-amber-200 text-amber-700 hover:bg-amber-100"
                onClick={() => handleAdminOverride(order.id, 'approveDesign')}
              >
                <ArrowRight className="mr-1 w-3 h-3" /> Force Approve & Continue
              </Button>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // =========================================================
  // Step 3: Production Part 1 - Next Button (Admin Only, after Design Approval)
  // =========================================================
  const renderProduction1NextButton = () => {
    if (shouldShowStageButtons(OrderStage.Production1) && 
        order.production1?.designApproved && 
        isAdmin) {
      
      return (
        <div className="mt-4">
          <Button 
            variant="default" 
            className="w-full"
            onClick={() => {
              moveToNextStage(order.id);
              toast.success("Proceeding to Production Part 2");
              refreshOrder();
            }}
          >
            <ArrowRight className="mr-2" /> Proceed to Production Part 2
          </Button>
        </div>
      );
    }
    return null;
  };

  // =========================================================
  // Step 4: Production Part 2 - Inspection Request (Client Only)
  // =========================================================
  const renderInspectionButtons = () => {
    if (shouldShowStageButtons(OrderStage.Production2) && 
        order.production2?.fullWelding && 
        order.production2?.surfaceFinishing) {
      
      const isDisabled = !canClientApprove(isClient);
      
      // If inspection status is already set
      if (order.production2?.inspectionNeeded !== undefined) {
        return (
          <div className="flex flex-col items-center gap-2 p-4 border rounded-md bg-blue-50 border-blue-200">
            <p className="text-blue-600 font-medium">
              {order.production2.inspectionNeeded 
                ? "Welding inspection has been requested. Please click 'No' when ready to proceed." 
                : "Proceeding without welding inspection"}
            </p>
            
            {/* Add a "No" button if inspection was requested and client is viewing */}
            {order.production2.inspectionNeeded && isClient && (
              <Button 
                variant="outline"
                className="mt-2"
                onClick={() => {
                  requestInspection(order.id, false);
                  toast.success("Proceeding without inspection");
                  refreshOrder();
                }}
              >
                <CircleX className="mr-2" /> No Inspection Needed
              </Button>
            )}
          </div>
        );
      }

      return (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-gray-600">
            {isAdmin 
              ? "Waiting for client to decide on welding inspection" 
              : "Do you want to request a welding inspection before proceeding?"}
          </p>
          <div className="flex gap-2">
            <Button 
              variant="default"
              disabled={isDisabled}
              onClick={() => {
                requestInspection(order.id, true);
                toast.success("Welding inspection requested");
                refreshOrder();
              }}
            >
              <CircleCheck className="mr-2" /> Yes
            </Button>
            <Button 
              variant="outline"
              disabled={isDisabled}
              onClick={() => {
                requestInspection(order.id, false);
                toast.success("Proceeding without welding inspection");
                refreshOrder();
              }}
            >
              <CircleX className="mr-2" /> No
            </Button>
          </div>
          
          {/* Admin override */}
          {isAdmin && (
            <div className="mt-4 p-3 border border-amber-200 bg-amber-50 rounded-md">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="text-amber-500 w-5 h-5" />
                <p className="text-amber-700 text-sm font-medium">Admin Override</p>
              </div>
              <p className="text-sm text-amber-600 mb-2">You can bypass client decision if needed:</p>
              <Button 
                variant="outline"
                size="sm"
                className="border-amber-200 text-amber-700 hover:bg-amber-100"
                onClick={() => handleAdminOverride(order.id, 'skipInspection')}
              >
                <ArrowRight className="mr-1 w-3 h-3" /> Skip Inspection & Continue
              </Button>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // =========================================================
  // Step 4: Production Part 2 - Next Button (Admin Only, after Inspection Decision)
  // =========================================================
  const renderProduction2NextButton = () => {
    if (shouldShowStageButtons(OrderStage.Production2) && 
        order.production2?.inspectionNeeded === false && 
        isAdmin) {
      
      return (
        <div className="mt-4">
          <Button 
            variant="default" 
            className="w-full"
            onClick={() => {
              moveToNextStage(order.id);
              toast.success("Proceeding to Painting");
              refreshOrder();
            }}
          >
            <ArrowRight className="mr-2" /> Proceed to Painting
          </Button>
        </div>
      );
    }
    return null;
  };

  // =========================================================
  // Step 5: Painting - Painting Inspection Request (Client Only)
  // =========================================================
  const renderPaintingInspectionButtons = () => {
    if (shouldShowStageButtons(OrderStage.Painting) && 
        order.painting?.primer && 
        order.painting?.painting) {
      
      const isDisabled = !canClientApprove(isClient);
      
      // If inspection status is already set
      if (order.painting?.inspectionNeeded !== undefined) {
        return (
          <div className="flex flex-col items-center gap-2 p-4 border rounded-md bg-blue-50 border-blue-200">
            <p className="text-blue-600 font-medium">
              {order.painting.inspectionNeeded 
                ? "Painting inspection has been requested. Please click 'No' when ready to proceed." 
                : "Proceeding without painting inspection"}
            </p>
            
            {/* Add a "No" button if inspection was requested and client is viewing */}
            {order.painting.inspectionNeeded && isClient && (
              <Button 
                variant="outline"
                className="mt-2"
                onClick={() => {
                  requestPaintingInspection(order.id, false);
                  toast.success("Proceeding without painting inspection");
                  refreshOrder();
                }}
              >
                <CircleX className="mr-2" /> No Inspection Needed
              </Button>
            )}
          </div>
        );
      }

      return (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-gray-600">
            {isAdmin 
              ? "Waiting for client to decide on painting inspection" 
              : "Do you want to request a painting inspection before proceeding?"}
          </p>
          <div className="flex gap-2">
            <Button 
              variant="default"
              disabled={isDisabled}
              onClick={() => {
                requestPaintingInspection(order.id, true);
                toast.success("Painting inspection requested");
                refreshOrder();
              }}
            >
              <CircleCheck className="mr-2" /> Yes
            </Button>
            <Button 
              variant="outline"
              disabled={isDisabled}
              onClick={() => {
                requestPaintingInspection(order.id, false);
                toast.success("Proceeding without painting inspection");
                refreshOrder();
              }}
            >
              <CircleX className="mr-2" /> No
            </Button>
          </div>
          
          {/* Admin override */}
          {isAdmin && (
            <div className="mt-4 p-3 border border-amber-200 bg-amber-50 rounded-md">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="text-amber-500 w-5 h-5" />
                <p className="text-amber-700 text-sm font-medium">Admin Override</p>
              </div>
              <p className="text-sm text-amber-600 mb-2">You can bypass client decision if needed:</p>
              <Button 
                variant="outline"
                size="sm"
                className="border-amber-200 text-amber-700 hover:bg-amber-100"
                onClick={() => handleAdminOverride(order.id, 'skipPaintingInspection')}
              >
                <ArrowRight className="mr-1 w-3 h-3" /> Skip Inspection & Continue
              </Button>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // =========================================================
  // Step 5: Painting - Next Button (Admin Only, after Painting Inspection Decision)
  // =========================================================
  const renderPaintingNextButton = () => {
    if (shouldShowStageButtons(OrderStage.Painting) && 
        order.painting?.inspectionNeeded === false && 
        isAdmin) {
      
      return (
        <div className="mt-4">
          <Button 
            variant="default" 
            className="w-full"
            onClick={() => {
              moveToNextStage(order.id);
              toast.success("Proceeding to Delivery");
              refreshOrder();
            }}
          >
            <ArrowRight className="mr-2" /> Proceed to Delivery
          </Button>
        </div>
      );
    }
    return null;
  };

  // =========================================================
  // Step 6: Delivery - Confirm Delivery Date (Client Only)
  // =========================================================
  const renderDeliveryConfirmButtons = () => {
    if (shouldShowStageButtons(OrderStage.Delivery) && order.delivery?.date) {
      const isDisabled = !canClientApprove(isClient);
      
      // If delivery date is already confirmed
      if (order.delivery?.confirmed) {
        return (
          <div className="flex flex-col items-center gap-2 p-4 border rounded-md bg-green-50 border-green-200">
            <p className="text-green-600 font-medium">Delivery date confirmed</p>
            <p className="text-sm text-green-500">
              Delivery date: {new Date(order.delivery.date).toLocaleDateString()}
            </p>
          </div>
        );
      }
      
      // If delivery date was rejected, show date change for client
      if (order.delivery?.confirmed === false && isClient) {
        return (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-gray-600">
              Please suggest a new delivery date:
            </p>
            <div className="flex flex-col space-y-2">
              <input
                type="date"
                id="new-delivery-date"
                className="border rounded p-2"
                min={new Date().toISOString().split('T')[0]}
              />
              <Button 
                onClick={() => {
                  const newDate = (document.getElementById("new-delivery-date") as HTMLInputElement).value;
                  if (newDate) {
                    updateDeliveryDate(order.id, newDate);
                    confirmDeliveryDate(order.id, true);
                    toast.success("New delivery date suggested and confirmed");
                    refreshOrder();
                  } else {
                    toast.error("Please select a valid date");
                  }
                }}
              >
                <Calendar className="mr-2" /> Confirm New Date
              </Button>
            </div>
          </div>
        );
      }

      return (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-gray-600">
            {isAdmin 
              ? "Waiting for client to confirm delivery date" 
              : `Please confirm the delivery date: ${new Date(order.delivery.date).toLocaleDateString()}`}
          </p>
          <div className="flex gap-2">
            <Button 
              variant="default"
              disabled={isDisabled}
              onClick={() => {
                confirmDeliveryDate(order.id, true);
                toast.success("Delivery date confirmed");
                refreshOrder();
              }}
            >
              <Calendar className="mr-2" /> Confirm
            </Button>
            <Button 
              variant="destructive"
              disabled={isDisabled}
              onClick={() => {
                confirmDeliveryDate(order.id, false);
                toast.error("Delivery date rejected");
                refreshOrder();
              }}
            >
              <X className="mr-2" /> No
            </Button>
          </div>
          
          {/* Admin override */}
          {isAdmin && (
            <div className="mt-4 p-3 border border-amber-200 bg-amber-50 rounded-md">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="text-amber-500 w-5 h-5" />
                <p className="text-amber-700 text-sm font-medium">Admin Override</p>
              </div>
              <p className="text-sm text-amber-600 mb-2">You can bypass client confirmation if needed:</p>
              <Button 
                variant="outline"
                size="sm"
                className="border-amber-200 text-amber-700 hover:bg-amber-100"
                onClick={() => handleAdminOverride(order.id, 'confirmDeliveryDate')}
              >
                <ArrowRight className="mr-1 w-3 h-3" /> Force Confirm & Continue
              </Button>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // =========================================================
  // Step 6: Delivery - Confirm Successful Delivery (Client Only)
  // =========================================================
  const renderDeliverySuccessButtons = () => {
    if (shouldShowStageButtons(OrderStage.Delivery) && 
        order.delivery?.confirmed && 
        order.delivery?.loading &&
        order.delivery?.vehicleNumber &&
        order.delivery?.driverNumber) {
      
      const isDisabled = !canClientApprove(isClient);
      
      // If delivery is already marked
      if (order.delivery?.successful !== undefined) {
        // If delivery was unsuccessful but client is viewing, show "Order Received" button
        if (order.delivery.successful === false && isClient) {
          return (
            <div className="flex flex-col gap-3">
              <div className="p-4 border rounded-md bg-amber-50 border-amber-200">
                <p className="text-amber-600 font-medium">You previously reported issues with this delivery</p>
              </div>
              <Button 
                variant="default"
                onClick={() => {
                  confirmDelivery(order.id, true);
                  toast.success("Order marked as received successfully");
                  refreshOrder();
                }}
              >
                <Check className="mr-2" /> Order Received Successfully
              </Button>
            </div>
          );
        }
        
        return (
          <div className="flex flex-col items-center gap-2 p-4 border rounded-md bg-green-50 border-green-200">
            <p className="text-green-600 font-medium">
              {order.delivery.successful 
                ? "Order has been received successfully" 
                : "Delivery issues have been reported"}
            </p>
          </div>
        );
      }

      return (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-gray-600">
            {isAdmin 
              ? "Waiting for client to confirm order receipt" 
              : "Have you received the order successfully?"}
          </p>
          <div className="flex gap-2">
            <Button 
              variant="default"
              disabled={isDisabled}
              onClick={() => {
                confirmDelivery(order.id, true);
                toast.success("Order received successfully");
                refreshOrder();
              }}
            >
              <Check className="mr-2" /> Order Received
            </Button>
            <Button 
              variant="destructive"
              disabled={isDisabled}
              onClick={() => {
                confirmDelivery(order.id, false);
                toast.error("Order not received properly");
                refreshOrder();
              }}
            >
              <X className="mr-2" /> Not Received
            </Button>
          </div>
          
          {/* Admin override */}
          {isAdmin && (
            <div className="mt-4 p-3 border border-amber-200 bg-amber-50 rounded-md">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="text-amber-500 w-5 h-5" />
                <p className="text-amber-700 text-sm font-medium">Admin Override</p>
              </div>
              <p className="text-sm text-amber-600 mb-2">You can bypass client confirmation if needed:</p>
              <Button 
                variant="outline"
                size="sm"
                className="border-amber-200 text-amber-700 hover:bg-amber-100"
                onClick={() => handleAdminOverride(order.id, 'confirmDelivery')}
              >
                <ArrowRight className="mr-1 w-3 h-3" /> Force Complete Order
              </Button>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // =========================================================
  // Step 6: Delivery - Complete Order Button (Admin Only, after successful delivery confirmation)
  // =========================================================
  const renderCompleteOrderButton = () => {
    if (shouldShowStageButtons(OrderStage.Delivery) && 
        order.delivery?.successful && 
        isAdmin) {
      
      return (
        <div className="mt-4">
          <Button 
            variant="default" 
            className="w-full"
            onClick={() => {
              moveToNextStage(order.id);
              toast.success("Order marked as completed");
              refreshOrder();
            }}
          >
            <Check className="mr-2" /> Mark Order as Completed
          </Button>
        </div>
      );
    }
    return null;
  };

  // Rendered UI based on current stage
  return (
    <div className="space-y-6 mt-6">
      {/* Progress visual indicator showing current stage */}
      <div className="order-stage-indicator">
        <div className={`stage-item ${order.currentStage === OrderStage.Quotation ? 'stage-active' : order.currentStage !== OrderStage.Quotation ? 'stage-completed' : ''}`}>
          <div className="stage-icon">
            {order.currentStage !== OrderStage.Quotation ? <Check className="w-4 h-4" /> : '1'}
          </div>
          <span className="stage-text">Quotation</span>
        </div>
        
        <div className={`stage-item ${order.currentStage === OrderStage.Material ? 'stage-active' : ['production1', 'production2', 'painting', 'delivery', 'completed'].includes(order.currentStage) ? 'stage-completed' : ''}`}>
          <div className="stage-icon">
            {['production1', 'production2', 'painting', 'delivery', 'completed'].includes(order.currentStage) ? <Check className="w-4 h-4" /> : '2'}
          </div>
          <span className="stage-text">Material</span>
        </div>
        
        <div className={`stage-item ${order.currentStage === OrderStage.Production1 ? 'stage-active' : ['production2', 'painting', 'delivery', 'completed'].includes(order.currentStage) ? 'stage-completed' : ''}`}>
          <div className="stage-icon">
            {['production2', 'painting', 'delivery', 'completed'].includes(order.currentStage) ? <Check className="w-4 h-4" /> : '3'}
          </div>
          <span className="stage-text">Production 1</span>
        </div>
        
        <div className={`stage-item ${order.currentStage === OrderStage.Production2 ? 'stage-active' : ['painting', 'delivery', 'completed'].includes(order.currentStage) ? 'stage-completed' : ''}`}>
          <div className="stage-icon">
            {['painting', 'delivery', 'completed'].includes(order.currentStage) ? <Check className="w-4 h-4" /> : '4'}
          </div>
          <span className="stage-text">Production 2</span>
        </div>
        
        <div className={`stage-item ${order.currentStage === OrderStage.Painting ? 'stage-active' : ['delivery', 'completed'].includes(order.currentStage) ? 'stage-completed' : ''}`}>
          <div className="stage-icon">
            {['delivery', 'completed'].includes(order.currentStage) ? <Check className="w-4 h-4" /> : '5'}
          </div>
          <span className="stage-text">Painting</span>
        </div>
        
        <div className={`stage-item ${order.currentStage === OrderStage.Delivery ? 'stage-active' : order.currentStage === OrderStage.Completed ? 'stage-completed' : ''}`}>
          <div className="stage-icon">
            {order.currentStage === OrderStage.Completed ? <Check className="w-4 h-4" /> : '6'}
          </div>
          <span className="stage-text">Delivery</span>
        </div>
      </div>

      {/* Step 1: Quotation Approval */}
      {renderQuotationButtons()}
      
      {/* Step 2: Material Management - Next Stage */}
      {renderMaterialNextButton()}
      
      {/* Step 3: Production Part 1 - Design Approval */}
      {renderDesignApprovalButtons()}
      {renderProduction1NextButton()}
      
      {/* Step 4: Production Part 2 - Inspection Request */}
      {renderInspectionButtons()}
      {renderProduction2NextButton()}
      
      {/* Step 5: Painting - Painting Inspection */}
      {renderPaintingInspectionButtons()}
      {renderPaintingNextButton()}
      
      {/* Step 6: Delivery - Confirm Date & Success */}
      {renderDeliveryConfirmButtons()}
      {renderDeliverySuccessButtons()}
      {renderCompleteOrderButton()}
      
      {/* Completed Order */}
      {order.currentStage === OrderStage.Completed && (
        <div className="flex flex-col items-center gap-2 p-4 border rounded-md bg-green-50 border-green-200">
          <p className="text-green-600 font-medium">Order has been completed successfully</p>
        </div>
      )}
    </div>
  );
};
