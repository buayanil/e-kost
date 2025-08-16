import { useState } from "react";
import { updateTenant } from "../services/tenantService";
import type { Tenant } from "../types/tenant";

type TenantCardProps = {
    tenant: Tenant;
    onUpdated?: (tenant: Tenant) => void; // optional callback to notify parent
};

export default function TenantCard({ tenant, onUpdated }: TenantCardProps) {
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({
        name: tenant.name,
        notes: tenant.notes ?? "",
    });

    const handleSave = async () => {
        try {
            const updated = await updateTenant(tenant.id, {
                name: form.name,
                notes: form.notes,
            });
            setEditing(false);
            onUpdated?.(updated); // bubble up to parent
        } catch (err) {
            console.error("Failed to update tenant", err);
        }
    };

    const handleCancel = () => {
        setEditing(false);
        setForm({ name: tenant.name, notes: tenant.notes ?? "" });
    };

    return (
        <div
            className="rounded-xl border p-4 cursor-pointer hover:bg-gray-50"
            onClick={() => !editing && setEditing(true)}
        >
            {editing ? (
                <div className="flex flex-col gap-2">
                    <input
                        className="rounded border p-2"
                        value={form.name}
                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    />
                    <textarea
                        className="rounded border p-2"
                        rows={3}
                        value={form.notes}
                        onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                    />
                    <div className="flex gap-2">
                        <button
                            className="rounded bg-blue-600 px-3 py-1 text-white"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleSave();
                            }}
                        >
                            Save
                        </button>
                        <button
                            className="rounded bg-gray-300 px-3 py-1"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleCancel();
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    <h2 className="text-xl font-semibold">{tenant.name}</h2>
                    {tenant.notes && <p className="text-gray-700">{tenant.notes}</p>}
                </>
            )}
        </div>
    );
}
