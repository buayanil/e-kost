import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Layout from "../components/Layout";
import {
    fetchTenantById,
    updateTenant,
    type TenantDetail,
} from "../services/tenantService";

export default function TenantDetailView() {
    const { id } = useParams<{ id: string }>();
    const [tenant, setTenant] = useState<TenantDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState<{ name: string; notes: string | "" }>({
        name: "",
        notes: "",
    });

    const load = async () => {
        try {
            const data = await fetchTenantById(Number(id));
            setTenant(data);
            setForm({ name: data.name, notes: data.notes ?? "" });
            setError(null);
        } catch {
            setError("Failed to load tenant");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const onSave = async () => {
        if (!tenant) return;
        setSaving(true);
        try {
            const updated = await updateTenant(tenant.id, {
                name: form.name,
                notes: form.notes,
            });
            setTenant(updated);
            setEditing(false);
        } catch {
            setError("Failed to save changes");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Layout>
            {loading && <p>Loading…</p>}
            {error && <p className="text-red-600">{error}</p>}

            {tenant && (
                <>
                    <div className="mb-4 flex items-center justify-between">
                        <Link
                            to="/tenants"
                            className="inline-flex items-center rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50 focus:outline-none focus:ring"
                            aria-label="Back to Tenants"
                        >
                            ← Back
                        </Link>
                        {editing ? (
                            <input
                                className="text-2xl font-semibold focus:outline-none"
                                value={form.name}
                                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                            />
                        ) : (
                            <h1 className="text-2xl font-semibold">{tenant.name}</h1>
                        )}

                        <div className="flex gap-2">
                            {!editing ? (
                                <>
                                    <button
                                        onClick={() => setEditing(true)}
                                        className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
                                    >
                                        Edit
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={onSave}
                                        disabled={saving}
                                        className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        {saving ? "Saving…" : "Save"}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setEditing(false);
                                            setForm({ name: tenant.name, notes: tenant.notes ?? "" });
                                        }}
                                        className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-3">
                        <div className="rounded-xl border p-4 lg:col-span-full">
                            <h2 className="mb-2 text-lg font-medium">Notes</h2>
                            {editing ? (
                                <textarea
                                    className="w-full rounded-lg border p-2"
                                    rows={5}
                                    value={form.notes ?? ""}
                                    onChange={(e) =>
                                        setForm((f) => ({ ...f, notes: e.target.value }))
                                    }
                                />
                            ) : (
                                <p className="text-gray-700">
                                    {tenant.notes ? tenant.notes : <em>No notes</em>}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="mt-4 grid gap-4 lg:grid-cols-2">
                        <div className="rounded-xl border p-4">
                            <h3 className="mb-2 text-base font-medium">Assignment History</h3>
                            {tenant.assignments?.length ? (
                                <ul className="space-y-2">
                                    {tenant.assignments.map((a) => (
                                        <li key={a.id} className="text-sm">
                                            {a.room.name} — {new Date(a.startDate).toLocaleDateString()} →{" "}
                                            {a.endDate ? new Date(a.endDate).toLocaleDateString() : "present"}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-gray-600">No assignments</p>
                            )}
                        </div>

                        <div className="rounded-xl border p-4">
                            <h3 className="mb-2 text-base font-medium">Payments</h3>
                            {tenant.payments?.length ? (
                                <ul className="space-y-2">
                                    {tenant.payments.map((p) => (
                                        <li key={p.id} className="text-sm">
                                            {new Date(p.createdAt).toLocaleDateString()} — {p.amount}
                                            {p.note ? ` — ${p.note}` : ""}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-gray-600">No payments</p>
                            )}
                        </div>
                    </div>
                </>
            )}
        </Layout>
    );
}
