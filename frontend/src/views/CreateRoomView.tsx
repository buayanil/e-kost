import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createRoom } from "../services/roomService";
import Layout from "../components/Layout";

const schema = z.object({
    name: z.string().min(1, "Room name is required"),
    notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function CreateRoomView() {
    const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
    });

    const [error, setError] = useState("");
    const navigate = useNavigate();

    const onSubmit = async (data: FormData) => {
        try {
            await createRoom(data.name, data.notes);
            navigate("/rooms");
        } catch (err: any) {
            if (err.response?.status === 409) {
                setError("Room name already exists");
            } else {
                setError("Failed to create room");
            }
        }
    };

    return (
        <Layout>
            <div className="max-w-xl mx-auto p-6 bg-white rounded shadow mt-8">
                <h1 className="text-2xl font-semibold mb-4">Create New Room</h1>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label className="block font-medium mb-1">Room Name</label>
                        <input
                            type="text"
                            {...register("name")}
                            className="w-full border px-3 py-2 rounded"
                        />
                        {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
                    </div>

                    <div>
                        <label className="block font-medium mb-1">Notes (optional)</label>
                        <textarea
                            {...register("notes")}
                            className="w-full border px-3 py-2 rounded"
                            rows={4}
                        />
                    </div>

                    {error && <p className="text-red-600 text-sm">{error}</p>}

                    <div className="flex justify-between">
                        <button
                            type="button"
                            onClick={() => navigate("/rooms")}
                            className="px-4 py-2 border rounded hover:bg-gray-100"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                        >
                            Create Room
                        </button>
                    </div>
                </form>
            </div>
        </Layout>
    );
}
