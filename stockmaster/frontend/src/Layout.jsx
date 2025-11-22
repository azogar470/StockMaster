import { Link, NavLink, Outlet, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import './App.css';

export function ProtectedRoute({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return children;
}

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-header">StockMaster</div>
        <nav>
          <NavLink to="/" end>Dashboard</NavLink>
          <NavLink to="/products">Products</NavLink>
          <div className="sidebar-section">Operations</div>
          <NavLink to="/operations/receipts">Receipts</NavLink>
          <NavLink to="/operations/deliveries">Deliveries</NavLink>
          <NavLink to="/operations/transfers">Internal Transfers</NavLink>
          <NavLink to="/operations/adjustments">Adjustments</NavLink>
          <NavLink to="/operations/moves">Move History</NavLink>
          <div className="sidebar-section">Settings</div>
          <NavLink to="/settings/warehouses">Warehouses</NavLink>
        </nav>
        <div className="sidebar-footer">
          {user && <div className="user-name">{user.name}</div>}
          <button onClick={handleLogout}>Logout</button>
          <Link to="/profile">My Profile</Link>
        </div>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
