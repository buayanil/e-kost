import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RequireAuth() {
    const { user, ready } = useAuth();
    const location = useLocation();

    if (!ready) return <div>Loading…</div>;

    if (!user) {
        // keep this state small & serializable
        const from =
            location.pathname + (location.search || "") + (location.hash || "");
        return <Navigate to="/login" replace state={{ from }} />;
    }

    return <Outlet />;
}
