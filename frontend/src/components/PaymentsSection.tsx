import type {TenantPayment} from "../types/tenant"

type Props = {
    payments?: TenantPayment[]
}

export default function PaymentsSection({ payments }: Props) {
    if (!payments || payments.length === 0) {
        return (
            <div className="rounded-xl border p-4">
                <h3 className="mb-2 text-base font-medium">Payments</h3>
                <p className="text-sm text-gray-600">No payments</p>
            </div>
        )
    }

    return (
        <div className="rounded-xl border p-4">
            <h3 className="mb-3 text-base font-medium">Payments</h3>
            <ul className="space-y-3">
                {payments.map((p) => (
                    <li key={p.id} className="rounded-lg border p-3">
                        <div className="flex justify-between">
                            <span>{new Date(p.paymentDate).toLocaleDateString()}</span>
                            <span>{p.amount} EUR</span>
                        </div>
                        {p.notes && <p className="mt-1 text-sm">{p.notes}</p>}
                    </li>
                ))}
            </ul>
        </div>
    )
}
