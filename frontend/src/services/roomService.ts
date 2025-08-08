import { api } from "./api";

export type Room = {
    id: number;
    name: string;
    createdAt: string;
    currentAssignment: {
        tenant: { id: number; name: string };
        startDate: string;
        endDate: string | null;
    } | null;
};

// Optional: detail type (includes fields editable on the detail page)
export type RoomDetail = Room & {
    notes?: string | null;
};

export const fetchRooms = async (): Promise<Room[]> => {
    const { data } = await api.get("/rooms");
    return data;
};

export const fetchRoomById = async (id: number): Promise<RoomDetail> => {
    const { data } = await api.get(`/rooms/${id}`);
    return data;
};

export const createRoom = async (name: string, notes?: string) => {
    const { data } = await api.post("/rooms", { name, notes });
    return data;
};

export const updateRoom = async (
    id: number,
    payload: Partial<Pick<RoomDetail, "name" | "notes">>
): Promise<RoomDetail> => {
    const { data } = await api.put(`/rooms/${id}`, payload);
    return data;
};
