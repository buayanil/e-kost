import { useEffect, useState } from "react";
import { fetchRooms, type Room } from "../services/roomService";
import { Link } from "react-router-dom";
import Layout from "../components/Layout.tsx";
import RoomCard from "../components/RoomCard.tsx";

export default function RoomsView() {
    const [rooms, setRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadRooms = async () => {
        setLoading(true);
        setError(null); // ⟵ reset previous error
        try {
            const data = await fetchRooms();
            setRooms(data);
        } catch (e) {
            setError("Couldn’t load rooms. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const [statusFilter, setStatusFilter] = useState<"all" | "occupied" | "vacant">("all");

    const filteredRooms = rooms.filter((room) => {
        if (statusFilter === "all") return true;
        const vacant = room.currentAssignment === null;
        return statusFilter === "vacant" ? vacant : !vacant;
    });

    useEffect(() => {
        loadRooms();
    }, []);

    return (
        <Layout>
            <div className="p-4">
                <h1 className="text-2xl font-semibold mb-4">Rooms</h1>

                <Link
                    to="/rooms/new"
                    className="inline-block mb-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                    + New Room
                </Link>

                {/* Error banner */}
                {error && (
                    <div
                        className="mb-4 rounded border border-red-300 bg-red-50 p-3 text-sm"
                        role="alert"
                        aria-live="polite"
                    >
                        {error}{" "}
                        <button onClick={loadRooms} className="underline">
                            Retry
                        </button>
                    </div>
                )}

                <div className="flex gap-2 m-2">
                    <button
                        onClick={() => setStatusFilter("all")}
                        className={`px-3 py-1.5 rounded transition-colors 
                      hover:bg-gray-100
                        ${statusFilter === "all" ? "bg-gray-200 font-semibold" : ""}`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setStatusFilter("occupied")}
                        className={`px-3 py-1.5 rounded transition-colors 
                      hover:bg-gray-100
                        ${statusFilter === "occupied" ? "bg-gray-200 font-semibold" : ""}`}
                    >
                        Occupied
                    </button>
                    <button
                        onClick={() => setStatusFilter("vacant")}
                        className={`px-3 py-1.5 rounded transition-colors 
                      hover:bg-gray-100
                        ${statusFilter === "vacant" ? "bg-gray-200 font-semibold" : ""}`}
                    >
                        Vacant
                    </button>
                </div>


                {/* Room List */}
                {loading ? (
                    <p>Loading rooms...</p>
                ) : rooms.length === 0 ? (
                    <p className="text-gray-500">No rooms found. Create one above.</p>
                ) : (
                    <div className="grid gap-4">
                        {filteredRooms.map((room) => (
                            <RoomCard key={room.id} room={room} />
                        ))}
                    </div>
                )}
            </div>
        </Layout>
    );
}
