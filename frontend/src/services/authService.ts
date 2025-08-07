import { api } from "./api";

type LoginPayload = {
    username: string;
    password: string;
};

export const loginRequest = async (data: LoginPayload) => {
    const response = await api.post("/auth/login", data);
    return response.data; // expects { token: string }
};