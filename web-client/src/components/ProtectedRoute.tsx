import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function ProtectedRoute() {
    const [loading, setLoading] = useState(true);
    const [authenticated, setAuthenticated] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                setAuthenticated(true);
            } else {
                setAuthenticated(false);
            }
            setLoading(false);
        };
        checkAuth();
    }, []);

    if (loading) {
        return <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }}>Loading...</div>;
    }

    // If not authenticated, redirect to /profile/skatsi07 (as per user request)
    // In future this will be /login
    if (!authenticated) {
        return <Navigate to="/profile/skatsi07" replace />;
    }

    // If authenticated, render child routes
    return <Outlet />;
}
