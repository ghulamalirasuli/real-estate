import { Routes, Route, Navigate } from 'react-router-dom';
import AdminOverview from './AdminOverview';
import AdminCustomers from './AdminCustomers';
import AdminAgents from './AdminAgents';
import AdminProperties from './AdminProperties';
import AdminPricing from './AdminPricing';
import AdminRevenue from './AdminRevenue';
import AdminAccounting from './AdminAccounting';
import AdminCashboxCurrencyDetail from './AdminCashboxCurrencyDetail';
import AdminLedgerPartyDetail from './AdminLedgerPartyDetail';

export default function AdminRoutes() {
  return (
    <Routes>
      <Route index element={<AdminOverview />} />
      <Route path="customers" element={<AdminCustomers />} />
      <Route path="agents" element={<AdminAgents />} />
      <Route path="properties" element={<AdminProperties />} />
      <Route path="pricing" element={<AdminPricing />} />
      <Route path="revenue" element={<AdminRevenue />} />
      <Route path="accounting" element={<AdminAccounting />} />
      <Route path="accounting/cashboxes/:currencyId" element={<AdminCashboxCurrencyDetail />} />
      <Route path="accounting/ledger/parties/:userId" element={<AdminLedgerPartyDetail />} />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}
