import { Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import MainLayout from './layouts/MainLayout';
import { brands as mockBrands } from './data/mock';
import { orders as mockOrders } from './data/mock';
import { BrandContext } from './data/BrandContext';
import { OrderContext } from './data/OrderContext';
import Login from './pages/Login';
import ProfilePage from './pages/ProfilePage';
import ChangePasswordPage from './pages/ChangePasswordPage';

// Brand pages
import BrandDashboard from './pages/BrandDashboard';
import BrandTemplates from './pages/BrandTemplates';
import TemplateDesigner from './pages/TemplateDesigner';
import BrandOrderCreate from './pages/BrandOrderCreate';
import BrandOrderList from './pages/BrandOrderList';
import BrandOrderDetail from './pages/BrandOrderDetail';
import BrandFactories from './pages/BrandFactories';
import BrandBillings from './pages/BrandBillings';
import OpsFactories from './pages/OpsFactories';

// Ops pages
import OpsDashboard from './pages/OpsDashboard';
import OpsOrderAudit from './pages/OpsOrderAudit';
import OpsBrands from './pages/OpsBrands';
import OpsSuppliers from './pages/OpsSuppliers';
import OpsEpcRules from './pages/OpsEpcRules';
import OpsCustomerCompanies from "./pages/OpsCustomerCompanies";
import OpsOrderDetail from "./pages/OpsOrderDetail";
import OpsBillings from './pages/OpsBillings';

// Supplier pages
import SupplierDashboard from './pages/SupplierDashboard';
import SupplierOrders from './pages/SupplierOrders';
import SupplierOrderDetail from './pages/SupplierOrderDetail';
import SupplierEpcUpload from './pages/SupplierEpcUpload';
import SupplierShipment from './pages/SupplierShipment';
import SupplierDeliveryNote from './pages/SupplierDeliveryNote';
import SupplierLabels from './pages/SupplierLabels';
import SupplierBillings from './pages/SupplierBillings';

function BrandLayoutWrapper() {
  const [currentBrandId, setCurrentBrandId] = useState(0);
  const currentBrand = currentBrandId === 0 ? null : mockBrands.find(b => b.id === currentBrandId);
  const allowSwitch = true;

  return (
    <BrandContext.Provider value={{
      currentBrandId,
      currentBrandName: currentBrandId === 0 ? '全部' : (currentBrand?.name ?? '全部'),
    }}>
      <MainLayout
        role="brand"
        roleName="品牌方"
        brands={allowSwitch ? mockBrands : undefined}
        currentBrandId={currentBrandId}
        allowBrandSwitch={allowSwitch}
        onBrandChange={setCurrentBrandId}
      />
    </BrandContext.Provider>
  );
}

function OpsLayoutWrapper() {
  const [orders, setOrders] = useState(mockOrders);

  return (
    <OrderContext.Provider value={{ orders, setOrders }}>
      <MainLayout role="ops" roleName="平台运营中心" />
    </OrderContext.Provider>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />

      {/* Brand */}
      <Route path="/brand" element={<BrandLayoutWrapper />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<BrandDashboard />} />
        <Route path="templates" element={<BrandTemplates />} />
        <Route path="templates/designer" element={<TemplateDesigner />} />
        <Route path="order-create" element={<BrandOrderCreate />} />
        <Route path="orders" element={<BrandOrderList />} />
        <Route path="orders/:id" element={<BrandOrderDetail />} />
        <Route path="factories" element={<BrandFactories />} />
        <Route path="billings" element={<BrandBillings />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="change-password" element={<ChangePasswordPage />} />
      </Route>

      {/* Ops */}
      <Route path="/ops" element={<OpsLayoutWrapper />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<OpsDashboard />} />
        <Route path="customers" element={<OpsCustomerCompanies />} />
        <Route path="audit" element={<OpsOrderAudit />} />
        <Route path="orders/:id" element={<OpsOrderDetail />} />
        <Route path="brands" element={<OpsBrands />} />
        <Route path="suppliers" element={<OpsSuppliers />} />
        <Route path="factories" element={<OpsFactories />} />
        <Route path="epc-rules" element={<OpsEpcRules />} />
        <Route path="billings" element={<OpsBillings />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="change-password" element={<ChangePasswordPage />} />
      </Route>

      {/* Supplier */}
      <Route path="/supplier" element={<MainLayout role="supplier" roleName="供应商 — 供应商甲" />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<SupplierDashboard />} />
        <Route path="orders" element={<SupplierOrders />} />
        <Route path="detail" element={<SupplierOrderDetail />} />
        <Route path="epc" element={<SupplierEpcUpload />} />
        <Route path="shipment" element={<SupplierShipment />} />
        <Route path="delivery-note" element={<SupplierDeliveryNote />} />
        <Route path="labels" element={<SupplierLabels />} />
        <Route path="billings" element={<SupplierBillings />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="change-password" element={<ChangePasswordPage />} />
      </Route>
    </Routes>
  );
}
