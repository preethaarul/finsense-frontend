import { Navigate } from "react-router-dom";
import { getToken } from "../utils/auth";

function PrivateRoute({ children }) {
  const token = getToken();

  // If not logged in, redirect to login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default PrivateRoute;