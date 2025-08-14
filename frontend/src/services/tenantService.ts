import { api } from "./api";
import type {Tenant} from "../types/tenant";

export const fetchTenants = async (): Promise<Tenant[]> => {
    const { data } = await api.get("/tenants");
    return data;
};

export const fetchTenantById = async (id: number): Promise<Tenant> => {
    const { data } = await api.get(`/tenants/${id}`);
    return data;
};

export const createTenant = async (name: string, notes?: string) => {
    const { data } = await api.post("/tenants", { name, notes });
    return data;
};

export const updateTenant = async (
    id: number,
    payload: Partial<Pick<Tenant, "name" | "notes">>
): Promise<Tenant> => {
    const { data } = await api.put(`/tenants/${id}`, payload);
    return data;
};

export const deleteTenant = async (id: number): Promise<void> => {
    await api.delete(`/tenants/${id}`);
};
