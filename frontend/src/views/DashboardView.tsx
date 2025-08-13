import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { fetchSummary, type Summary } from "../services/summaryService";

export default function DashboardView() {
    const [summary, setSummary] = useState<Summary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const s = await fetchSummary();
                setSummary(s);
            } catch {
                setError("Failed to load summary");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    return (
        <Layout>
            <h1 className="mb-4 text-2xl font-semibold">Dashboard Overview</h1>

            {loading && <p>Loading…</p>}
            {error && <p className="text-red-600">{error}</p>}

            {summary && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="rounded-xl border p-4">
                        <h2 className="text-sm font-medium text-gray-600">Rooms</h2>
                        <p className="text-3xl font-semibold">{summary.totalRooms}</p>
                    </div>
                    <div className="rounded-xl border p-4">
                        <h2 className="text-sm font-medium text-gray-600">Tenants</h2>
                        <p className="text-3xl font-semibold">{summary.totalTenants}</p>
                    </div>
                    <div className="rounded-xl border p-4">
                        <h2 className="text-sm font-medium text-gray-600">Payments</h2>
                        <p className="text-3xl font-semibold">{summary.totalPayments}</p>
                    </div>
                </div>
            )}
        </Layout>
    );
}
