import { FormEvent, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api, getErrorMessage } from "../api/client";
import { InventoryItem } from "../types";
import Modal from "../components/ui/Modal";
import { useAuth } from "../context/AuthContext";

const emptyForm = { name: "", sku: "", category: "", quantity: "0", reorderLevel: "10", unit: "unit", unitCost: "0", supplier: "" };

export default function Inventory() {
  const { user } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [movementItem, setMovementItem] = useState<InventoryItem | null>(null);
  const [movementForm, setMovementForm] = useState({ type: "RESTOCK", quantity: "1", note: "" });

  const canManage = user?.role === "ADMIN" || user?.role === "ASSISTANT";

  async function load() {
    setLoading(true);
    try {
      const res = await api.get("/inventory", { params: { lowStock: lowStockOnly || undefined } });
      setItems(res.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lowStockOnly]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/inventory", {
        ...form,
        quantity: Number(form.quantity),
        reorderLevel: Number(form.reorderLevel),
        unitCost: Number(form.unitCost),
      });
      toast.success("Item added");
      setShowModal(false);
      setForm(emptyForm);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleMovement(e: FormEvent) {
    e.preventDefault();
    if (!movementItem) return;
    setSaving(true);
    try {
      await api.post(`/inventory/${movementItem.id}/movements`, {
        type: movementForm.type,
        quantity: Number(movementForm.quantity),
        note: movementForm.note || undefined,
      });
      toast.success("Stock updated");
      setMovementItem(null);
      setMovementForm({ type: "RESTOCK", quantity: "1", note: "" });
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-slate-900">Inventory</h1>
        {canManage && (
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            + New Item
          </button>
        )}
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-600">
        <input type="checkbox" checked={lowStockOnly} onChange={(e) => setLowStockOnly(e.target.checked)} />
        Show low stock only
      </label>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr className="text-left">
              <th className="py-3 px-4 font-medium">Item</th>
              <th className="py-3 px-4 font-medium">Category</th>
              <th className="py-3 px-4 font-medium">Quantity</th>
              <th className="py-3 px-4 font-medium">Reorder level</th>
              <th className="py-3 px-4 font-medium">Unit cost</th>
              {canManage && <th className="py-3 px-4 font-medium">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="py-6 text-center text-slate-400">Loading...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={6} className="py-6 text-center text-slate-400">No items found.</td></tr>
            ) : (
              items.map((it) => {
                const low = it.quantity <= it.reorderLevel;
                return (
                  <tr key={it.id} className="border-t border-slate-100">
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{it.name}</div>
                      {it.sku && <div className="text-xs text-slate-400">{it.sku}</div>}
                    </td>
                    <td className="py-3 px-4">{it.category || "-"}</td>
                    <td className="py-3 px-4">
                      <span className={low ? "text-red-600 font-semibold" : ""}>{it.quantity}</span> {it.unit}
                      {low && <span className="badge bg-red-100 text-red-700 ml-2">Low</span>}
                    </td>
                    <td className="py-3 px-4">{it.reorderLevel}</td>
                    <td className="py-3 px-4">${Number(it.unitCost).toFixed(2)}</td>
                    {canManage && (
                      <td className="py-3 px-4">
                        <button className="text-xs text-brand-600 hover:underline" onClick={() => setMovementItem(it)}>
                          Adjust stock
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <Modal title="New Inventory Item" onClose={() => setShowModal(false)}>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="label">Name</label>
              <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">SKU</label>
                <input className="input" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
              </div>
              <div>
                <label className="label">Category</label>
                <input className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
              </div>
              <div>
                <label className="label">Quantity</label>
                <input className="input" type="number" min={0} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
              </div>
              <div>
                <label className="label">Reorder level</label>
                <input className="input" type="number" min={0} value={form.reorderLevel} onChange={(e) => setForm({ ...form, reorderLevel: e.target.value })} />
              </div>
              <div>
                <label className="label">Unit</label>
                <input className="input" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
              </div>
              <div>
                <label className="label">Unit cost ($)</label>
                <input className="input" type="number" min={0} step="0.01" value={form.unitCost} onChange={(e) => setForm({ ...form, unitCost: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="label">Supplier</label>
              <input className="input" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? "Saving..." : "Save item"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {movementItem && (
        <Modal title={`Adjust Stock · ${movementItem.name}`} onClose={() => setMovementItem(null)}>
          <form onSubmit={handleMovement} className="space-y-4">
            <div>
              <label className="label">Movement type</label>
              <select className="input" value={movementForm.type} onChange={(e) => setMovementForm({ ...movementForm, type: e.target.value })}>
                <option value="RESTOCK">Restock (+)</option>
                <option value="USAGE">Usage (-)</option>
                <option value="ADJUSTMENT">Adjustment (-)</option>
                <option value="WASTE">Waste (-)</option>
              </select>
            </div>
            <div>
              <label className="label">Quantity</label>
              <input className="input" type="number" min={1} required value={movementForm.quantity} onChange={(e) => setMovementForm({ ...movementForm, quantity: e.target.value })} />
            </div>
            <div>
              <label className="label">Note</label>
              <input className="input" value={movementForm.note} onChange={(e) => setMovementForm({ ...movementForm, note: e.target.value })} />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" className="btn-secondary" onClick={() => setMovementItem(null)}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? "Saving..." : "Apply"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
