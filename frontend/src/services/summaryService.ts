import { api } from "./api";

// Adjust fields to exactly match what your /summary endpoint returns.
export type Summary = {
    totalRooms: number;
    totalTenants: number;
    totalPayments: number;
    // add more fields as needed (e.g., vacantRooms, occupiedRooms, monthlyTotals, etc.)
};

export const fetchSummary = async (): Promise<Summary> => {
    const { data } = await api.get<Summary>("/summary");
    return data;
};
