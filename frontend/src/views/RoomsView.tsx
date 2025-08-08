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

                {/* Room List */}
                {loading ? (
                    <p>Loading rooms...</p>
                ) : rooms.length === 0 ? (
                    <p className="text-gray-500">No rooms found. Create one above.</p>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {rooms.map((room) => (
                            <RoomCard key={room.id} room={room} />
                        ))}
                    </div>
                )}
            </div>
        </Layout>
    );
}
