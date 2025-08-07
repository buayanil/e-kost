import { api } from "./api";

export type Room = {
    id: number;
    name: string;
    createdAt: string;
    currentAssignment: {
        tenant: {
            id: number;
            name: string;
        };
        startDate: string;
        endDate: string | null;
    } | null;
};

export const fetchRooms = async (): Promise<Room[]> => {
    const response = await api.get("/rooms");
    return response.data;
};

export const createRoom = async (name: string, notes?: string) => {
    const response = await api.post("/rooms", { name, notes });
    return response.data;
};
