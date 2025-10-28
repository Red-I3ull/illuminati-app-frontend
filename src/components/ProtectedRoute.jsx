import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const isEntryPasswordVerified =
    localStorage.getItem('entryPasswordVerified') === 'true';

  if (!isEntryPasswordVerified) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
