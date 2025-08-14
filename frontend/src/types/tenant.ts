export type TenantPayment = {
    id: number
    tenantId: number
    roomId: number
    managerId: number
    amount: string
    startMonth: string
    endMonth: string
    paymentDate: string
    notes?: string | null
    room?: {
        id: number
        name: string
        createdAt: string
        notes?: string | null
    }
    manager?: {
        id: number
        username: string
        createdAt: string
    }
}

export type TenantAssignment = {
    id: number
    tenantId: number
    roomId: number
    startDate: string
    endDate?: string | null
    room: {
        id: number
        name: string
        createdAt: string
        notes?: string | null
    }
}

export type Tenant = {
    id: number
    name: string
    createdAt: string
    notes?: string | null
    assignments: TenantAssignment[]
    payments: TenantPayment[]
}
