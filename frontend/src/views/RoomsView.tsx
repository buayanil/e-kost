import { useEffect, useState } from "react";
import { fetchRooms, type Room } from "../services/roomService";
import {Link} from "react-router-dom";
import Layout from "../components/Layout.tsx";

export default function RoomsView() {
    const [rooms, setRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(true);

    const loadRooms = async () => {
        setLoading(true);
        const data = await fetchRooms();
        setRooms(data);
        setLoading(false);
    };

    useEffect(() => {
        loadRooms();
    }, []);

    const isVacant = (room: Room) => room.currentAssignment === null;

    return (
        <Layout>
            <div className="p-4">
                <h1 className="text-2xl font-semibold mb-4">Rooms</h1>

                {/* Link to create a new room */}
                <Link
                    to="/rooms/new"
                    className="inline-block mb-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                    + New Room
                </Link>

                {/* Room List */}
                {loading ? (
                    <p>Loading rooms...</p>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {rooms.map((room) => (
                            <div
                                key={room.id}
                                className={`border p-4 rounded shadow ${
                                    isVacant(room) ? "bg-green-100" : "bg-red-100"
                                }`}
                            >
                                <h2 className="text-xl font-bold">{room.name}</h2>
                                <p className="mt-2 font-semibold">
                                    {isVacant(room)
                                        ? "Vacant"
                                        : `Occupied by ${room.currentAssignment?.tenant.name}`}
                                </p>
                                {!isVacant(room) && (
                                    <p className="text-sm text-gray-600">
                                        Since:{" "}
                                        {new Date(
                                            room.currentAssignment!.startDate
                                        ).toLocaleDateString()}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Layout>
    );
}
