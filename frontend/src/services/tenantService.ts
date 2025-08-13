import { api } from "./api";

export type Tenant = {
    id: number;
    name: string;
    createdAt: string;
    currentRoom?: { id: number; name: string } | null;
};

export type TenantDetail = Tenant & {
    notes?: string | null;
    assignments?: Array<{
        id: number;
        room: { id: number; name: string };
        startDate: string;
        endDate: string | null;
    }>;
    payments?: Array<{
        id: number;
        amount: number;
        createdAt: string;
        note?: string | null;
    }>;
};

export const fetchTenants = async (): Promise<Tenant[]> => {
    const { data } = await api.get("/tenants");
    return data;
};

export const fetchTenantById = async (id: number): Promise<TenantDetail> => {
    const { data } = await api.get(`/tenants/${id}`);
    return data;
};

export const createTenant = async (name: string, notes?: string) => {
    const { data } = await api.post("/tenants", { name, notes });
    return data;
};

export const updateTenant = async (
    id: number,
    payload: Partial<Pick<TenantDetail, "name" | "notes">>
): Promise<TenantDetail> => {
    const { data } = await api.put(`/tenants/${id}`, payload);
    return data;
};

export const deleteTenant = async (id: number): Promise<void> => {
    await api.delete(`/tenants/${id}`);
};
