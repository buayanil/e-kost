import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Layout({ children }: { children: React.ReactNode }) {
    const { logout } = useAuth();

    return (
        <div className="flex min-h-screen">
            {/* Sidebar */}
            <aside className="w-64 bg-gray-800 text-white p-4 space-y-4">
                <h2 className="text-xl font-bold mb-6">E-Kost</h2>
                <nav className="space-y-2">
                    <Link to="/" className="block hover:bg-gray-700 rounded px-2 py-1">Dashboard</Link>
                    <Link to="/tenants" className="block hover:bg-gray-700 rounded px-2 py-1">Tenants</Link>
                    <Link to="/rooms" className="block hover:bg-gray-700 rounded px-2 py-1">Rooms</Link>
                    <Link to="/payments" className="block hover:bg-gray-700 rounded px-2 py-1">Payments</Link>
                    <button
                        onClick={logout}
                        className="block text-left text-red-300 hover:bg-gray-700 rounded px-2 py-1 w-full"
                    >
                        Logout
                    </button>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-6 bg-gray-50">{children}</main>
        </div>
    );
}
