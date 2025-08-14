import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchTenantById } from "../services/tenantService";
import type {Tenant} from "../types/tenant";
import Layout from "../components/Layout.tsx";

export default function TenantDetailView() {
    const { id } = useParams<{ id: string }>();
    const [tenant, setTenant] = useState<Tenant | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        fetchTenantById(Number(id))
            .then((data) => {
                setTenant(data);
                setError(null);
            })
            .catch(() => setError("Failed to load tenant"))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) return <p>Loading...</p>;
    if (error) return <p className="text-red-600">{error}</p>;
    if (!tenant) return <p>No tenant found.</p>;

    return (
        <Layout>
            <div className="space-y-6">
                <div className="rounded-xl border p-4">
                    <h2 className="text-xl font-semibold">{tenant.name}</h2>
                    {tenant.notes && <p className="text-gray-700">{tenant.notes}</p>}
                </div>

                {/* Assignments */}
                <div className="rounded-xl border p-4">
                    <h3 className="mb-2 text-base font-medium">Assignments</h3>
                    {tenant.assignments?.length ? (
                        <ul className="space-y-2">
                            {tenant.assignments.map((a) => (
                                <li key={a.id} className="text-sm">
                                    {a.room.name} — from{" "}
                                    {new Date(a.startDate).toLocaleDateString()}{" "}
                                    {a.endDate && `until ${new Date(a.endDate).toLocaleDateString()}`}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-gray-600">No assignments</p>
                    )}
                </div>

                {/* Payments */}
                <div className="rounded-xl border p-4">
                    <h3 className="mb-3 text-base font-medium">Payments</h3>
                    {tenant.payments?.length ? (
                        <ul className="space-y-3">
                            {tenant.payments.map((p) => {
                                const period = `${new Date(p.startMonth).toLocaleDateString()} – ${new Date(p.endMonth).toLocaleDateString()}`;
                                const paidOn = new Date(p.paymentDate).toLocaleDateString();
                                return (
                                    <li key={p.id} className="rounded-lg border p-3">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <div className="flex flex-col">
                                                <span className="text-sm text-gray-600">Period</span>
                                                <span className="font-medium">{period}</span>
                                            </div>

                                            <div className="flex flex-col">
                                                <span className="text-sm text-gray-600">Paid on</span>
                                                <span className="font-medium">{paidOn}</span>
                                            </div>

                                            <div className="flex flex-col text-right">
                                                <span className="text-sm text-gray-600">Amount</span>
                                                <span className="font-semibold">{p.amount} €</span>
                                            </div>
                                        </div>

                                        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                                            {p.room?.name && (
                                                <span className="rounded-full border px-2 py-0.5">
                            Room: {p.room.name}
                          </span>
                                            )}
                                            {p.manager?.username && (
                                                <span className="rounded-full border px-2 py-0.5">
                            Manager: {p.manager.username}
                          </span>
                                            )}
                                        </div>

                                        {p.notes && (
                                            <p className="mt-2 text-sm text-gray-700">{p.notes}</p>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    ) : (
                        <p className="text-sm text-gray-600">No payments</p>
                    )}
                </div>
            </div>
        </Layout>
    );
}
