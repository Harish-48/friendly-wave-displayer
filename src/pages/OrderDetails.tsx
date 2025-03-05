import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useOrder } from '@/context/OrderContext';
import { Button } from "@/components/ui/button";
import PageTransition from '@/components/layout/PageTransition';
import { StageCard } from '@/components/ui/StageCard';
import { LinkField } from '@/components/ui/LinkField';
import { OrderButtons } from '@/components/order/OrderButtons';
import { toast } from 'sonner';
import { OrderStage } from '@/context/OrderContext';

const OrderDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { 
    getOrderById, 
    updateQuotation, 
    updateMaterial,
    updateProduction1,
    updateProduction2,
    updatePainting,
    updateDeliveryDate,
    updateDeliveryDetails
  } = useOrder();
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);
  const [quotationLink, setQuotationLink] = useState('');
  
  const order = id ? getOrderById(id) : undefined;

  const [materialInputs, setMaterialInputs] = useState({
    estimation: order?.material?.estimation || '',
    purchaseBill: order?.material?.purchaseBill || '',
    loading: order?.material?.loading || '',
    arrival: order?.material?.arrival || ''
  });

  const [production1Inputs, setProduction1Inputs] = useState({
    marking: order?.production1?.marking || '',
    cutting: order?.production1?.cutting || '',
    edgePreparation: order?.production1?.edgePreparation || '',
    jointWelding: order?.production1?.jointWelding || '',
    design: order?.production1?.design || ''
  });

  const [production2Inputs, setProduction2Inputs] = useState({
    fullWelding: order?.production2?.fullWelding || '',
    surfaceFinishing: order?.production2?.surfaceFinishing || ''
  });

  const [paintingInputs, setPaintingInputs] = useState({
    primer: order?.painting?.primer || '',
    painting: order?.painting?.painting || ''
  });

  const [deliveryInputs, setDeliveryInputs] = useState({
    date: order?.delivery?.date || '',
    loading: order?.delivery?.loading || '',
    vehicleNumber: order?.delivery?.vehicleNumber || '',
    driverNumber: order?.delivery?.driverNumber || ''
  });

  useEffect(() => {
    if (order) {
      setQuotationLink(order.quotation?.link || '');
      
      setMaterialInputs({
        estimation: order.material?.estimation || '',
        purchaseBill: order.material?.purchaseBill || '',
        loading: order.material?.loading || '',
        arrival: order.material?.arrival || ''
      });
      
      setProduction1Inputs({
        marking: order.production1?.marking || '',
        cutting: order.production1?.cutting || '',
        edgePreparation: order.production1?.edgePreparation || '',
        jointWelding: order.production1?.jointWelding || '',
        design: order.production1?.design || ''
      });
      
      setProduction2Inputs({
        fullWelding: order.production2?.fullWelding || '',
        surfaceFinishing: order.production2?.surfaceFinishing || ''
      });
      
      setPaintingInputs({
        primer: order.painting?.primer || '',
        painting: order.painting?.painting || ''
      });
      
      setDeliveryInputs({
        date: order.delivery?.date || '',
        loading: order.delivery?.loading || '',
        vehicleNumber: order.delivery?.vehicleNumber || '',
        driverNumber: order.delivery?.driverNumber || ''
      });
    }
  }, [order, refreshKey]);

  useEffect(() => {
    console.log("OrderDetails - params:", id);
    console.log("OrderDetails - found order:", order);
    
    if (!user) {
      navigate('/login');
      return;
    }

    if (!id || !order) {
      console.log("Order not found, redirecting to dashboard");
      toast.error('Order not found');
      navigate('/dashboard');
      return;
    }

    if (user.role === 'client' && order.clientId !== user.email) {
      toast.error('You do not have permission to view this order');
      navigate('/dashboard');
      return;
    }
  }, [user, order, id, navigate]);

  const refreshOrder = () => {
    setRefreshKey(prevKey => prevKey + 1);
  };

  const shouldShowStage = (stageName: OrderStage) => {
    if (order?.currentStage === stageName) return true;
    
    const stageOrder = [
      OrderStage.Quotation,
      OrderStage.Material,
      OrderStage.Production1,
      OrderStage.Production2,
      OrderStage.Painting,
      OrderStage.Delivery,
      OrderStage.Completed
    ];
    
    const currentStageIndex = stageOrder.indexOf(order?.currentStage || OrderStage.Quotation);
    const stageIndex = stageOrder.indexOf(stageName);
    
    return stageIndex <= currentStageIndex;
  };

  const isStageAccessible = (stageName: OrderStage) => {
    if (!order) return false;
    
    if (user?.role === 'admin') {
      return order.currentStage === stageName;
    }
    
    return shouldShowStage(stageName);
  };

  const saveQuotation = () => {
    if (id && quotationLink) {
      updateQuotation(id, quotationLink);
      toast.success('Quotation link updated');
      refreshOrder();
    } else {
      toast.error('Please enter a valid quotation link');
    }
  };

  const saveMaterial = () => {
    if (id) {
      updateMaterial(id, materialInputs);
      toast.success('Material details updated');
      refreshOrder();
    }
  };

  const saveProduction1 = () => {
    if (id) {
      updateProduction1(id, production1Inputs);
      toast.success('Production (Part 1) details updated');
      refreshOrder();
    }
  };

  const saveProduction2 = () => {
    if (id) {
      updateProduction2(id, production2Inputs);
      toast.success('Production (Part 2) details updated');
      refreshOrder();
    }
  };

  const savePainting = () => {
    if (id) {
      updatePainting(id, paintingInputs);
      toast.success('Painting details updated');
      refreshOrder();
    }
  };

  const saveDeliveryDate = () => {
    if (id && deliveryInputs.date) {
      updateDeliveryDate(id, deliveryInputs.date);
      toast.success('Delivery date updated');
      refreshOrder();
    } else {
      toast.error('Please select a valid delivery date');
    }
  };

  const saveDeliveryDetails = () => {
    if (id) {
      updateDeliveryDetails(id, {
        loading: deliveryInputs.loading,
        vehicleNumber: deliveryInputs.vehicleNumber,
        driverNumber: deliveryInputs.driverNumber
      });
      toast.success('Delivery details updated');
      refreshOrder();
    }
  };

  if (!order) {
    return (
      <PageTransition>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Loading...</h1>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Order Details</h1>
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Order Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600">Order ID</p>
              <p className="font-medium">{order.id}</p>
            </div>
            <div>
              <p className="text-gray-600">Client</p>
              <p className="font-medium">{order.clientId}</p>
            </div>
            <div>
              <p className="text-gray-600">Created At</p>
              <p className="font-medium">{new Date(order.createdAt).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-gray-600">Status</p>
              <p className="font-medium capitalize">{order.status.replace('-', ' ')}</p>
            </div>
            <div>
              <p className="text-gray-600">Current Stage</p>
              <p className="font-medium capitalize">{order.currentStage.replace(/([A-Z])/g, ' $1').trim()}</p>
            </div>
          </div>
        </div>

        <OrderButtons order={order} refreshOrder={refreshOrder} />

        <div className="space-y-6 mt-6">
          {shouldShowStage(OrderStage.Quotation) && (
            <StageCard
              title="Quotation"
              active={order.currentStage === OrderStage.Quotation}
              completed={order.currentStage !== OrderStage.Quotation}
            >
              {user?.role === 'admin' && isStageAccessible(OrderStage.Quotation) ? (
                <div className="space-y-4">
                  <LinkField
                    label="Quotation Link"
                    value={quotationLink}
                    onEdit={setQuotationLink}
                    timestamp={order.quotation?.timestamp}
                  />
                  <Button onClick={saveQuotation}>Save Quotation Link</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {order.quotation?.link ? (
                    <LinkField
                      label="Quotation Link"
                      value={order.quotation.link}
                      readOnly
                      timestamp={order.quotation.timestamp}
                    />
                  ) : (
                    <p className="text-muted-foreground italic">Waiting for admin to add quotation link</p>
                  )}
                </div>
              )}
              
              {order.quotation?.approved && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-green-700">Quotation has been approved</p>
                </div>
              )}
            </StageCard>
          )}

          {shouldShowStage(OrderStage.Material) && (
            <StageCard
              title="Material Management"
              active={order.currentStage === OrderStage.Material}
              completed={['production1', 'production2', 'painting', 'delivery', 'completed'].includes(order.currentStage)}
            >
              {user?.role === 'admin' && isStageAccessible(OrderStage.Material) ? (
                <div className="space-y-4">
                  <LinkField
                    label="Material Estimation"
                    value={materialInputs.estimation}
                    onEdit={(val) => setMaterialInputs({...materialInputs, estimation: val})}
                    timestamp={order.material?.timestamp}
                  />
                  <LinkField
                    label="Purchase Bill"
                    value={materialInputs.purchaseBill}
                    onEdit={(val) => setMaterialInputs({...materialInputs, purchaseBill: val})}
                  />
                  <LinkField
                    label="Material Loading"
                    value={materialInputs.loading}
                    onEdit={(val) => setMaterialInputs({...materialInputs, loading: val})}
                  />
                  <LinkField
                    label="Material Arrival"
                    value={materialInputs.arrival}
                    onEdit={(val) => setMaterialInputs({...materialInputs, arrival: val})}
                  />
                  <Button onClick={saveMaterial}>Save Material Details</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {order.material ? (
                    <>
                      <LinkField
                        label="Material Estimation"
                        value={order.material.estimation}
                        readOnly
                        timestamp={order.material.timestamp}
                      />
                      <LinkField
                        label="Purchase Bill"
                        value={order.material.purchaseBill}
                        readOnly
                      />
                      <LinkField
                        label="Material Loading"
                        value={order.material.loading}
                        readOnly
                      />
                      <LinkField
                        label="Material Arrival"
                        value={order.material.arrival}
                        readOnly
                      />
                    </>
                  ) : (
                    <p className="text-muted-foreground italic">Waiting for admin to add material details</p>
                  )}
                </div>
              )}
            </StageCard>
          )}

          {shouldShowStage(OrderStage.Production1) && (
            <StageCard
              title="Production & Decoration Part 1"
              active={order.currentStage === OrderStage.Production1}
              completed={['production2', 'painting', 'delivery', 'completed'].includes(order.currentStage)}
            >
              {user?.role === 'admin' && isStageAccessible(OrderStage.Production1) ? (
                <div className="space-y-4">
                  <LinkField
                    label="Material Marking"
                    value={production1Inputs.marking}
                    onEdit={(val) => setProduction1Inputs({...production1Inputs, marking: val})}
                    timestamp={order.production1?.timestamp}
                  />
                  <LinkField
                    label="Material Cutting"
                    value={production1Inputs.cutting}
                    onEdit={(val) => setProduction1Inputs({...production1Inputs, cutting: val})}
                  />
                  <LinkField
                    label="Edge Preparation"
                    value={production1Inputs.edgePreparation}
                    onEdit={(val) => setProduction1Inputs({...production1Inputs, edgePreparation: val})}
                  />
                  <LinkField
                    label="Joint Welding"
                    value={production1Inputs.jointWelding}
                    onEdit={(val) => setProduction1Inputs({...production1Inputs, jointWelding: val})}
                  />
                  <LinkField
                    label="Design Promotion"
                    value={production1Inputs.design}
                    onEdit={(val) => setProduction1Inputs({...production1Inputs, design: val})}
                  />
                  <Button onClick={saveProduction1}>Save Production Details</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {order.production1 ? (
                    <>
                      <LinkField
                        label="Material Marking"
                        value={order.production1.marking}
                        readOnly
                        timestamp={order.production1.timestamp}
                      />
                      <LinkField
                        label="Material Cutting"
                        value={order.production1.cutting}
                        readOnly
                      />
                      <LinkField
                        label="Edge Preparation"
                        value={order.production1.edgePreparation}
                        readOnly
                      />
                      <LinkField
                        label="Joint Welding"
                        value={order.production1.jointWelding}
                        readOnly
                      />
                      <LinkField
                        label="Design Promotion"
                        value={order.production1.design}
                        readOnly
                      />
                    </>
                  ) : (
                    <p className="text-muted-foreground italic">Waiting for admin to add production details</p>
                  )}
                </div>
              )}
              
              {order.production1?.designApproved && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-green-700">Design has been approved</p>
                </div>
              )}
            </StageCard>
          )}

          {shouldShowStage(OrderStage.Production2) && (
            <StageCard
              title="Production & Decoration Part 2"
              active={order.currentStage === OrderStage.Production2}
              completed={['painting', 'delivery', 'completed'].includes(order.currentStage)}
            >
              {user?.role === 'admin' && isStageAccessible(OrderStage.Production2) ? (
                <div className="space-y-4">
                  <LinkField
                    label="Full Welding"
                    value={production2Inputs.fullWelding}
                    onEdit={(val) => setProduction2Inputs({...production2Inputs, fullWelding: val})}
                    timestamp={order.production2?.timestamp}
                  />
                  <LinkField
                    label="Surface Finishing"
                    value={production2Inputs.surfaceFinishing}
                    onEdit={(val) => setProduction2Inputs({...production2Inputs, surfaceFinishing: val})}
                  />
                  <Button onClick={saveProduction2}>Save Production Details</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {order.production2 ? (
                    <>
                      <LinkField
                        label="Full Welding"
                        value={order.production2.fullWelding}
                        readOnly
                        timestamp={order.production2.timestamp}
                      />
                      <LinkField
                        label="Surface Finishing"
                        value={order.production2.surfaceFinishing}
                        readOnly
                      />
                    </>
                  ) : (
                    <p className="text-muted-foreground italic">Waiting for admin to add production details</p>
                  )}
                </div>
              )}
              
              {order.production2?.inspectionNeeded !== undefined && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-blue-700">
                    {order.production2.inspectionNeeded 
                      ? "Welding inspection has been requested" 
                      : "Proceeding without welding inspection"}
                  </p>
                </div>
              )}
            </StageCard>
          )}

          {shouldShowStage(OrderStage.Painting) && (
            <StageCard
              title="Painting & Polishing"
              active={order.currentStage === OrderStage.Painting}
              completed={['delivery', 'completed'].includes(order.currentStage)}
            >
              {user?.role === 'admin' && isStageAccessible(OrderStage.Painting) ? (
                <div className="space-y-4">
                  <LinkField
                    label="Primer Coating"
                    value={paintingInputs.primer}
                    onEdit={(val) => setPaintingInputs({...paintingInputs, primer: val})}
                    timestamp={order.painting?.timestamp}
                  />
                  <LinkField
                    label="Painting"
                    value={paintingInputs.painting}
                    onEdit={(val) => setPaintingInputs({...paintingInputs, painting: val})}
                  />
                  <Button onClick={savePainting}>Save Painting Details</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {order.painting ? (
                    <>
                      <LinkField
                        label="Primer Coating"
                        value={order.painting.primer}
                        readOnly
                        timestamp={order.painting.timestamp}
                      />
                      <LinkField
                        label="Painting"
                        value={order.painting.painting}
                        readOnly
                      />
                    </>
                  ) : (
                    <p className="text-muted-foreground italic">Waiting for admin to add painting details</p>
                  )}
                </div>
              )}
              
              {order.painting?.inspectionNeeded !== undefined && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-blue-700">
                    {order.painting.inspectionNeeded 
                      ? "Painting inspection has been requested" 
                      : "Proceeding without painting inspection"}
                  </p>
                </div>
              )}
            </StageCard>
          )}

          {shouldShowStage(OrderStage.Delivery) && (
            <StageCard
              title="Delivery"
              active={order.currentStage === OrderStage.Delivery}
              completed={order.currentStage === OrderStage.Completed}
            >
              {user?.role === 'admin' && isStageAccessible(OrderStage.Delivery) ? (
                <div className="space-y-4">
                  <div className="flex flex-col space-y-2">
                    <label className="text-sm font-medium">Delivery Date</label>
                    <input
                      type="date"
                      value={deliveryInputs.date}
                      onChange={(e) => setDeliveryInputs({...deliveryInputs, date: e.target.value})}
                      className="border rounded p-2"
                    />
                    <Button onClick={saveDeliveryDate} className="mt-2">Set Delivery Date</Button>
                  </div>
                  
                  {order.delivery?.confirmed && (
                    <>
                      <LinkField
                        label="Loading Image"
                        value={deliveryInputs.loading}
                        onEdit={(val) => setDeliveryInputs({...deliveryInputs, loading: val})}
                      />
                      
                      <div className="flex flex-col space-y-2">
                        <label className="text-sm font-medium">Vehicle Number</label>
                        <input
                          type="text"
                          value={deliveryInputs.vehicleNumber}
                          onChange={(e) => setDeliveryInputs({...deliveryInputs, vehicleNumber: e.target.value})}
                          className="border rounded p-2"
                        />
                      </div>
                      
                      <div className="flex flex-col space-y-2">
                        <label className="text-sm font-medium">Driver Number</label>
                        <input
                          type="text"
                          value={deliveryInputs.driverNumber}
                          onChange={(e) => setDeliveryInputs({...deliveryInputs, driverNumber: e.target.value})}
                          className="border rounded p-2"
                        />
                      </div>
                      
                      <Button onClick={saveDeliveryDetails}>Save Delivery Details</Button>
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {order.delivery ? (
                    <>
                      <div className="mb-4">
                        <p className="text-sm font-medium mb-1">Delivery Date</p>
                        <p>{new Date(order.delivery.date).toLocaleDateString()}</p>
                      </div>
                      
                      {order.delivery.confirmed && (
                        <>
                          <LinkField
                            label="Loading Image"
                            value={order.delivery.loading}
                            readOnly
                          />
                          
                          <div className="mb-4">
                            <p className="text-sm font-medium mb-1">Vehicle Number</p>
                            <p>{order.delivery.vehicleNumber || 'Not provided yet'}</p>
                          </div>
                          
                          <div className="mb-4">
                            <p className="text-sm font-medium mb-1">Driver Number</p>
                            <p>{order.delivery.driverNumber || 'Not provided yet'}</p>
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <p className="text-muted-foreground italic">Waiting for admin to set delivery date</p>
                  )}
                </div>
              )}
              
              {order.delivery?.confirmed && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-green-700">Delivery date confirmed</p>
                </div>
              )}
              
              {order.delivery?.successful === false && (
                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-md">
                  <p className="text-amber-700">Order receipt issues reported</p>
                </div>
              )}
              
              {order.delivery?.successful === true && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-green-700">Order received successfully</p>
                </div>
              )}
            </StageCard>
          )}
          
          {order.currentStage === OrderStage.Completed && (
            <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-lg text-center">
              <h3 className="text-xl font-bold text-green-700 mb-2">Order Completed</h3>
              <p className="text-green-600">This order has been successfully completed.</p>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
};

export default OrderDetails;
