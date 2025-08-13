import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { createTenant } from "../services/tenantService";

export default function CreateTenantView() {
    const navigate = useNavigate();
    const [name, setName] = useState("");
    const [notes, setNotes] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const created = await createTenant(name, notes || undefined);
            navigate(`/tenants/${created.id}`);
        } catch {
            setError("Failed to create tenant");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Layout>
            <h1 className="mb-4 text-2xl font-semibold">Create Tenant</h1>
            {error && <p className="mb-3 text-red-600">{error}</p>}
            <form onSubmit={onSubmit} className="space-y-4 max-w-lg">
                <div>
                    <label className="mb-1 block text-sm font-medium">Name</label>
                    <input
                        className="w-full rounded-lg border px-3 py-2"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        autoFocus
                    />
                </div>
                <div>
                    <label className="mb-1 block text-sm font-medium">Notes</label>
                    <textarea
                        className="w-full rounded-lg border px-3 py-2"
                        rows={4}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <button
                        type="submit"
                        disabled={saving}
                        className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
                    >
                        {saving ? "Creating…" : "Create"}
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate("/tenants")}
                        className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </Layout>
    );
}
