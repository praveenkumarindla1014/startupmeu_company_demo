import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from './Loader';

// Renders children only for logged-in users; otherwise redirects to /login
const ProtectedRoute = ({ children }) => {
  const { user, initializing } = useAuth();
  const location = useLocation();

  if (initializing) return <Loader text="Restoring your session..." fullPage />;

  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;

  return children;
};

export default ProtectedRoute;
