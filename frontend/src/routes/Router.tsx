import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginView from "../views/LoginView";
import DashboardView from "../views/DashboardView";
import RoomsView from "../views/RoomsView";
import RequireAuth from "./RequireAuth";
import CreateRoomView from "../views/CreateRoomView.tsx";
import RoomDetailView from "../views/RoomDetailView.tsx";

export default function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<LoginView />} />

                {/* All protected routes grouped here */}
                <Route element={<RequireAuth />}>
                    <Route path="/" element={<DashboardView />} />
                    <Route path="/rooms" element={<RoomsView />} />
                    <Route path="/rooms/new" element={<CreateRoomView />} />
                    <Route path="/rooms/:id" element={<RoomDetailView />} />
                    {/* Add more protected routes here */}
                </Route>
            </Routes>
        </BrowserRouter>
    );
}
