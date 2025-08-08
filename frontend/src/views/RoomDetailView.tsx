// src/views/RoomDetailView.tsx
import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import {
    fetchRoomById,
    updateRoom,
    type RoomDetail,
} from "../services/roomService";

export default function RoomDetailView() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const roomId = Number(id);

    const [room, setRoom] = useState<RoomDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [editMode, setEditMode] = useState(false);
    const [form, setForm] = useState<{ name: string; notes: string }>({
        name: "",
        notes: "",
    });

    useEffect(() => {
        if (!roomId || Number.isNaN(roomId)) {
            navigate("/rooms");
            return;
        }

        let mounted = true;
        (async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await fetchRoomById(roomId);
                if (!mounted) return;
                setRoom(data);
                setForm({ name: data.name, notes: data.notes ?? "" });
            } catch {
                if (!mounted) return;
                setError("Couldn’t load room.");
            } finally {
                if (mounted) setLoading(false);
            }
        })();

        return () => {
            mounted = false;
        };
    }, [roomId, navigate]);

    const onSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSaving(true);
            await updateRoom(roomId, { name: form.name, notes: form.notes });
            const fresh = await fetchRoomById(roomId);
            setRoom(fresh);
            setEditMode(false);
        } catch {
            setError("Update failed. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Layout>
                <div className="p-4">Loading room…</div>
            </Layout>
        );
    }

    if (!room) {
        return (
            <Layout>
                <div className="p-4">
                    {error ?? "Room not found."}{" "}
                    <button onClick={() => navigate(-1)} className="underline">
                        Go back
                    </button>
                </div>
            </Layout>
        );
    }

    const vacant = room.currentAssignment === null;
    const since =
        room.currentAssignment?.startDate &&
        new Date(room.currentAssignment.startDate).toLocaleDateString();

    return (
        <Layout>
            <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold">Room {room.name}</h1>
                    <div className="flex gap-2">
                        <Link to="/rooms" className="underline">
                            Back to Rooms
                        </Link>
                        <button
                            onClick={() => setEditMode((v) => !v)}
                            className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700"
                        >
                            {editMode ? "Cancel" : "Edit"}
                        </button>
                    </div>
                </div>

                {error && (
                    <div
                        className="rounded border border-red-300 bg-red-50 p-3 text-sm"
                        role="alert"
                    >
                        {error}
                    </div>
                )}

                {/* Summary */}
                <div
                    className={`rounded border p-4 ${
                        vacant ? "bg-green-50" : "bg-red-50"
                    }`}
                >
                    <p className="font-semibold">
                        Status:{" "}
                        {vacant
                            ? "Vacant"
                            : `Occupied by ${room.currentAssignment?.tenant.name}`}
                    </p>
                    {!vacant && since && (
                        <p className="text-sm text-gray-700">Since: {since}</p>
                    )}

                    {room.notes ? (
                        <p className="mt-2">Notes: {room.notes}</p>
                    ) : (
                        <p className="mt-2 text-gray-500 italic">No notes yet.</p>
                    )}
                </div>

                {/* Edit form */}
                {editMode && (
                    <form onSubmit={onSave} className="space-y-3 max-w-lg">
                        <div>
                            <label className="block text-sm font-medium">Name</label>
                            <input
                                className="mt-1 w-full rounded border p-2"
                                value={form.name}
                                onChange={(e) =>
                                    setForm((f) => ({ ...f, name: e.target.value }))
                                }
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium">Notes</label>
                            <textarea
                                className="mt-1 w-full rounded border p-2"
                                rows={4}
                                value={form.notes}
                                onChange={(e) =>
                                    setForm((f) => ({ ...f, notes: e.target.value }))
                                }
                            />
                        </div>

                        <div className="flex gap-2">
                            <button
                                type="submit"
                                disabled={saving}
                                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-60"
                            >
                                {saving ? "Saving…" : "Save"}
                            </button>
                            <button
                                type="button"
                                onClick={() => setEditMode(false)}
                                className="px-4 py-2 rounded border"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </Layout>
    );
}
