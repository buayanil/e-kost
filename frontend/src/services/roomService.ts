import { api } from "./api";
import type {Room, RoomDetail} from "../types/room.ts";

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

export const deleteRoom = async (id: number): Promise<RoomDetail> => {
    const { data } = await api.delete(`/rooms/${id}`);
    return data;
};
