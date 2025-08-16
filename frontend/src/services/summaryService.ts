import { api } from "./api";
import type {Summary} from "../types/summary.ts";

export const fetchSummary = async (): Promise<Summary> => {
    const { data } = await api.get<Summary>("/summary");
    return data;
};
