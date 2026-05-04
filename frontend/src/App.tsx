import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import Layout from './components/Layout';
import HelpLayout from './components/HelpLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import Upgrade from './pages/Upgrade';
import { usePlan } from './hooks/usePlan';
import ToastContainer from './components/ToastContainer';

// Páginas PF / Comum
import Income from './pages/Income';
import Expenses from './pages/Expenses';
import Patrimony from './pages/Patrimony';
import Goals from './pages/Goals';
import PlanPage from './pages/Plan';
import Vehicles from './pages/Vehicles';
import Properties from './pages/Properties';
import Streams from './pages/Streams';
import Catalog from './pages/Catalog';
import Simulator from './pages/Simulator';
import Hybrid from './pages/Hybrid';
import Saved from './pages/Saved';
import Compare from './pages/Compare';
import Ranking from './pages/Ranking';
import Where from './pages/Where';
import Taxes from './pages/Taxes';
import Glossary from './pages/Glossary';
import CustomFields from './pages/CustomFields';
import Help from './pages/Help';

// Páginas PJ
import Employees from './pages/pj/Employees';
import Departments from './pages/pj/Departments';
import CostCenters from './pages/pj/CostCenters';
import Payroll from './pages/pj/Payroll';
import Invoices from './pages/pj/Invoices';
import BusinessTaxes from './pages/pj/Taxes';
import DRE from './pages/pj/DRE';
import CashFlow from './pages/pj/CashFlow';
import Company from './pages/pj/Company';
import Contacts from './pages/pj/Contacts';

// Admin
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminPlans from './pages/admin/AdminPlans';

function PlanGate({ children, path }: { children: React.ReactNode, path: string }) {
  const { hasPage } = usePlan();
  if (!hasPage(path)) return <Navigate to="/upgrade" replace state={{ from: path }} />;
  return <>{children}</>;
}

const PROTECTED: Array<[string, React.ComponentType, boolean]> = [
  // [path, Component, gateByPlan]
  ['/income', Income, true],
  ['/expenses', Expenses, true],
  ['/patrimony', Patrimony, true],
  ['/goals', Goals, true],
  ['/plan', PlanPage, true],
  ['/vehicles', Vehicles, true],
  ['/properties', Properties, true],
  ['/streams', Streams, true],
  ['/catalog', Catalog, true],
  ['/simulator', Simulator, true],
  ['/hybrid', Hybrid, true],
  ['/saved', Saved, true],
  ['/compare', Compare, true],
  ['/ranking', Ranking, true],
  ['/where', Where, true],
  ['/taxes', Taxes, true],
  ['/glossary', Glossary, true],
  // PJ
  ['/employees', Employees, true],
  ['/departments', Departments, true],
  ['/cost-centers', CostCenters, true],
  ['/payroll', Payroll, true],
  ['/invoices', Invoices, true],
  ['/business-taxes', BusinessTaxes, true],
  ['/dre', DRE, true],
  ['/cashflow', CashFlow, true],
  ['/company', Company, true],
  ['/contacts', Contacts, true],
];

export default function App() {
  return (
    <HashRouter>
      <ToastContainer />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/upgrade" element={<Upgrade />} />
            <Route path="/custom-fields" element={<CustomFields />} />
            {PROTECTED.map(([p, C, gate]) => (
              <Route key={p} path={p} element={gate ? <PlanGate path={p}><C/></PlanGate> : <C/>} />
            ))}
          </Route>
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<HelpLayout />}>
            <Route path="/help" element={<Help />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute adminOnly />}>
          <Route element={<Layout />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/plans" element={<AdminPlans />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </HashRouter>
  );
}
