import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { fetchTenants } from "../services/tenantService";
import type {Tenant} from "../types/tenant.ts";

export default function TenantsView() {
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [q, setQ] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        (async () => {
            try {
                const data = await fetchTenants();
                setTenants(data);
            } catch {
                setError("Failed to load tenants");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const filtered = useMemo(
        () =>
            q.trim()
                ? tenants.filter((t) =>
                    t.name.toLowerCase().includes(q.trim().toLowerCase())
                )
                : tenants,
        [tenants, q]
    );

    return (
        <Layout>
            <div className="mb-4 flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Tenants</h1>
                <button
                    onClick={() => navigate("/tenants/new")}
                    className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50 focus:outline-none focus:ring"
                >
                    + New Tenant
                </button>
            </div>

            <div className="mb-4">
                <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search tenants…"
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring"
                />
            </div>

            {loading && <p>Loading…</p>}
            {error && <p className="text-red-600">{error}</p>}
            {!loading && !error && filtered.length === 0 && (
                <p className="text-gray-600">No tenants found.</p>
            )}

            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((t) => (
                    <li key={t.id} className="rounded-xl border p-4 hover:bg-gray-50">
                        <Link to={`/tenants/${t.id}`} className="block focus:outline-none">
                            <p className="text-lg font-medium">{t.name}</p>

                            {(() => {
                                const current = t.assignments?.find(a => !a.endDate) ?? t.assignments?.[0];

                                return current ? (
                                    <p className="text-sm text-gray-600">
                                        Room: {current.room?.name ?? "Unknown"}
                                    </p>
                                ) : (
                                    <p className="text-sm text-gray-600">Unassigned</p>
                                );
                            })()}
                        </Link>
                    </li>
                ))}
            </ul>
        </Layout>
    );
}
