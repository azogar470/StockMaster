import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import { AppLayout, ProtectedRoute } from './Layout';
import { LoginPage, SignupPage, ForgotPasswordPage } from './authPages';
import {
  DashboardPage,
  ProductsPage,
  ProductDetailPage,
  ReceiptsPage,
  DeliveriesPage,
  TransfersPage,
  AdjustmentsPage,
  MovesPage,
  WarehousesPage,
  ProfilePage,
} from './pages';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="products/:id" element={<ProductDetailPage />} />
            <Route path="operations/receipts" element={<ReceiptsPage />} />
            <Route path="operations/deliveries" element={<DeliveriesPage />} />
            <Route path="operations/transfers" element={<TransfersPage />} />
            <Route path="operations/adjustments" element={<AdjustmentsPage />} />
            <Route path="operations/moves" element={<MovesPage />} />
            <Route path="settings/warehouses" element={<WarehousesPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
