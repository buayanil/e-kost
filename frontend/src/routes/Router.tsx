import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginView from "../views/LoginView.tsx";
import DashboardView from "../views/DashboardView";
import RequireAuth from "./RequireAuth.tsx";

export default function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<LoginView />} />

                <Route
                    path="/"
                    element={
                        <RequireAuth>
                            <DashboardView />
                        </RequireAuth>
                    }
                />

                {/* Later: Add more protected routes here */}
            </Routes>
        </BrowserRouter>
    );
}
