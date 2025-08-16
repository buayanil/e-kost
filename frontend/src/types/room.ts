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