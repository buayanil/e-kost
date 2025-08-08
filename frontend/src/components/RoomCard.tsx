import { Link } from "react-router-dom";
import type { Room } from "../services/roomService";

export default function RoomCard({ room }: { room: Room }) {
    const vacant = room.currentAssignment === null;

    return (
        <Link
            to={`/rooms/${room.id}`}
            className={`block border p-4 rounded shadow transition 
                  hover:shadow-lg hover:-translate-y-0.5 focus:outline-none 
                  focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 
                  ${vacant ? "bg-green-100" : "bg-red-100"} cursor-pointer`}
            aria-label={`Open details for room ${room.name}`}
        >
            <h2 className="text-xl font-bold">{room.name}</h2>
            <p className="mt-2 font-semibold">
                {vacant ? "Vacant" : `Occupied by ${room.currentAssignment?.tenant.name}`}
            </p>
            {!vacant && (
                <p className="text-sm text-gray-700">
                    Since: {new Date(room.currentAssignment!.startDate).toLocaleDateString()}
                </p>
            )}
        </Link>
    );
}
