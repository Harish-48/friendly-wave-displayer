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
  
  const canClientApprove = (isClient: boolean) => {
    return isClient;
  };

  const canAdminProceed = (order: Order, stage: OrderStage): boolean => {
    switch (stage) {
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
        return order.production2?.inspectionNeeded === false;
      
      case OrderStage.Painting:
        return order.painting?.inspectionNeeded === false;
      
      case OrderStage.Delivery:
        return !!order.delivery?.successful;
      
      default:
        return false;
    }
  };

  const shouldShowStageButtons = (stageName: OrderStage) => {
    return order.currentStage === stageName;
  };

  const isStageCompleted = (checkStage: OrderStage): boolean => {
    return getStageValue(order.currentStage) > getStageValue(checkStage);
  };
  
  const getStageValue = (stage: OrderStage): number => {
    switch (stage) {
      case OrderStage.Quotation: return 1;
      case OrderStage.Material: return 2;
      case OrderStage.Production1: return 3;
      case OrderStage.Production2: return 4;
      case OrderStage.Painting: return 5;
      case OrderStage.Delivery: return 6;
      case OrderStage.Completed: return 7;
      default: return 0;
    }
  };

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

  const renderQuotationButtons = () => {
    if (shouldShowStageButtons(OrderStage.Quotation) && order.quotation?.link) {
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

  const renderMaterialNextButton = () => {
    if (shouldShowStageButtons(OrderStage.Material) && isAdmin) {
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

  const renderInspectionButtons = () => {
    if (shouldShowStageButtons(OrderStage.Production2)) {
      // For client: Show inspection buttons when production details are available
      if (isClient && order.production2?.fullWelding && order.production2?.surfaceFinishing) {
        // If no decision has been made yet, show Yes/No buttons
        if (order.production2?.inspectionNeeded === undefined) {
          return (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-gray-600">
                Do you want to request a welding inspection before proceeding?
              </p>
              <div className="flex gap-2">
                <Button 
                  variant="default"
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
                  onClick={() => {
                    requestInspection(order.id, false);
                    toast.success("Proceeding without welding inspection");
                    refreshOrder();
                  }}
                >
                  <CircleX className="mr-2" /> No
                </Button>
              </div>
            </div>
          );
        } else {
          // If decision has been made, show feedback
          return (
            <div className="flex flex-col items-center gap-2 p-4 border rounded-md bg-blue-50 border-blue-200">
              <p className="text-blue-600 font-medium">
                {order.production2.inspectionNeeded 
                  ? "You have requested a welding inspection" 
                  : "You have chosen to proceed without welding inspection"}
              </p>
              
              {order.production2.inspectionNeeded && (
                <Button 
                  variant="outline"
                  className="mt-2"
                  onClick={() => {
                    requestInspection(order.id, false);
                    toast.success("Proceeding without inspection");
                    refreshOrder();
                  }}
                >
                  <CircleX className="mr-2" /> Cancel Inspection Request
                </Button>
              )}
            </div>
          );
        }
      }
      
      // For admin: Always show the waiting message if no decision made
      if (isAdmin && order.production2?.inspectionNeeded === undefined) {
        return (
          <div className="flex flex-col items-center gap-2 p-4 border rounded-md bg-amber-50 border-amber-200">
            <p className="text-amber-600 font-medium">Waiting for client to decide on welding inspection</p>
            <p className="text-sm text-amber-600">The client needs to choose whether to request an inspection before proceeding</p>
          </div>
        );
      }
      
      // For admin: Show client's decision if made
      if (isAdmin && order.production2?.inspectionNeeded !== undefined) {
        return (
          <div className="flex flex-col items-center gap-2 p-4 border rounded-md bg-blue-50 border-blue-200">
            <p className="text-blue-600 font-medium">
              {order.production2.inspectionNeeded 
                ? "Client has requested a welding inspection" 
                : "Client has chosen to proceed without welding inspection"}
            </p>
          </div>
        );
      }
    }
    return null;
  };

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

  const renderPaintingInspectionButtons = () => {
    if (shouldShowStageButtons(OrderStage.Painting)) {
      // For client: Show inspection buttons when painting details are available
      if (isClient && order.painting?.primer && order.painting?.painting) {
        // If no decision has been made yet, show Yes/No buttons
        if (order.painting?.inspectionNeeded === undefined) {
          return (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-gray-600">
                Do you want to request a painting inspection before proceeding?
              </p>
              <div className="flex gap-2">
                <Button 
                  variant="default"
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
                  onClick={() => {
                    requestPaintingInspection(order.id, false);
                    toast.success("Proceeding without painting inspection");
                    refreshOrder();
                  }}
                >
                  <CircleX className="mr-2" /> No
                </Button>
              </div>
            </div>
          );
        } else {
          // If decision has been made, show feedback
          return (
            <div className="flex flex-col items-center gap-2 p-4 border rounded-md bg-blue-50 border-blue-200">
              <p className="text-blue-600 font-medium">
                {order.painting.inspectionNeeded 
                  ? "You have requested a painting inspection" 
                  : "You have chosen to proceed without painting inspection"}
              </p>
              
              {order.painting.inspectionNeeded && (
                <Button 
                  variant="outline"
                  className="mt-2"
                  onClick={() => {
                    requestPaintingInspection(order.id, false);
                    toast.success("Proceeding without painting inspection");
                    refreshOrder();
                  }}
                >
                  <CircleX className="mr-2" /> Cancel Inspection Request
                </Button>
              )}
            </div>
          );
        }
      }
      
      // For admin: Always show the waiting message if no decision made
      if (isAdmin && order.painting?.inspectionNeeded === undefined) {
        return (
          <div className="flex flex-col items-center gap-2 p-4 border rounded-md bg-amber-50 border-amber-200">
            <p className="text-amber-600 font-medium">Waiting for client to decide on painting inspection</p>
            <p className="text-sm text-amber-600">The client needs to choose whether to request an inspection before proceeding</p>
          </div>
        );
      }
      
      // For admin: Show client's decision if made
      if (isAdmin && order.painting?.inspectionNeeded !== undefined) {
        return (
          <div className="flex flex-col items-center gap-2 p-4 border rounded-md bg-blue-50 border-blue-200">
            <p className="text-blue-600 font-medium">
              {order.painting.inspectionNeeded 
                ? "Client has requested a painting inspection" 
                : "Client has chosen to proceed without painting inspection"}
            </p>
          </div>
        );
      }
    }
    return null;
  };

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

  const renderDeliveryConfirmButtons = () => {
    if (shouldShowStageButtons(OrderStage.Delivery) && order.delivery?.date) {
      const isDisabled = !canClientApprove(isClient);
      
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

  const renderDeliverySuccessButtons = () => {
    if (shouldShowStageButtons(OrderStage.Delivery) && 
        order.delivery?.confirmed && 
        order.delivery?.loading &&
        order.delivery?.vehicleNumber &&
        order.delivery?.driverNumber) {
      
      const isDisabled = !canClientApprove(isClient);
      
      if (order.delivery?.successful !== undefined) {
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

  return (
    <div className="space-y-6 mt-6">
      <div className="order-stage-indicator">
        <div className={`stage-item ${order.currentStage === OrderStage.Quotation ? 'stage-active' : isStageCompleted(OrderStage.Quotation) ? 'stage-completed' : ''}`}>
          <div className="stage-icon">
            {isStageCompleted(OrderStage.Quotation) ? <Check className="w-4 h-4" /> : '1'}
          </div>
          <span className="stage-text">Quotation</span>
        </div>
        
        <div className={`stage-item ${order.currentStage === OrderStage.Material ? 'stage-active' : isStageCompleted(OrderStage.Material) ? 'stage-completed' : ''}`}>
          <div className="stage-icon">
            {isStageCompleted(OrderStage.Material) ? <Check className="w-4 h-4" /> : '2'}
          </div>
          <span className="stage-text">Material</span>
        </div>
        
        <div className={`stage-item ${order.currentStage === OrderStage.Production1 ? 'stage-active' : isStageCompleted(OrderStage.Production1) ? 'stage-completed' : ''}`}>
          <div className="stage-icon">
            {isStageCompleted(OrderStage.Production1) ? <Check className="w-4 h-4" /> : '3'}
          </div>
          <span className="stage-text">Production 1</span>
        </div>
        
        <div className={`stage-item ${order.currentStage === OrderStage.Production2 ? 'stage-active' : isStageCompleted(OrderStage.Production2) ? 'stage-completed' : ''}`}>
          <div className="stage-icon">
            {isStageCompleted(OrderStage.Production2) ? <Check className="w-4 h-4" /> : '4'}
          </div>
          <span className="stage-text">Production 2</span>
        </div>
        
        <div className={`stage-item ${order.currentStage === OrderStage.Painting ? 'stage-active' : isStageCompleted(OrderStage.Painting) ? 'stage-completed' : ''}`}>
          <div className="stage-icon">
            {isStageCompleted(OrderStage.Painting) ? <Check className="w-4 h-4" /> : '5'}
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

      {renderQuotationButtons()}
      
      {renderMaterialNextButton()}
      
      {renderDesignApprovalButtons()}
      {renderProduction1NextButton()}
      
      {renderInspectionButtons()}
      {renderProduction2NextButton()}
      
      {renderPaintingInspectionButtons()}
      {renderPaintingNextButton()}
      
      {renderDeliveryConfirmButtons()}
      {renderDeliverySuccessButtons()}
      {renderCompleteOrderButton()}
      
      {order.currentStage === OrderStage.Completed && (
        <div className="flex flex-col items-center gap-2 p-4 border rounded-md bg-green-50 border-green-200">
          <p className="text-green-600 font-medium">Order has been completed successfully</p>
        </div>
      )}
    </div>
  );
};
