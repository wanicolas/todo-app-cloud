import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

// Renders its children only for an authenticated user; otherwise redirects to
// the login page. Waits for the initial session restore before deciding.
export function ProtectedRoute({ children }: { children: ReactNode }) {
    const { user, loading } = useAuth();

    if (loading) return <p className="text-center mt-5">Loading...</p>;
    if (!user) return <Navigate to="/login" replace />;

    return <>{children}</>;
}
