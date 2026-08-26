import { FormEvent, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api, getErrorMessage } from "../api/client";
import { Treatment } from "../types";
import Modal from "../components/ui/Modal";
import { useAuth } from "../context/AuthContext";

const emptyForm = { name: "", description: "", category: "", price: "", durationMin: "30" };

export default function Treatments() {
  const { user } = useAuth();
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const canManage = user?.role === "ADMIN";

  async function load() {
    setLoading(true);
    try {
      const res = await api.get("/treatments");
      setTreatments(res.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/treatments", { ...form, price: Number(form.price), durationMin: Number(form.durationMin) });
      toast.success("Treatment added");
      setShowModal(false);
      setForm(emptyForm);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(t: Treatment) {
    try {
      await api.put(`/treatments/${t.id}`, { isActive: !t.isActive } as any);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  const categories = Array.from(new Set(treatments.map((t) => t.category || "Other")));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Treatments &amp; Procedures</h1>
        {canManage && (
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            + New Treatment
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-slate-500">Loading...</div>
      ) : (
        categories.map((cat) => (
          <div key={cat} className="card p-6">
            <h3 className="font-semibold text-slate-900 mb-3">{cat}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {treatments
                .filter((t) => (t.category || "Other") === cat)
                .map((t) => (
                  <div key={t.id} className={`border rounded-lg p-4 ${t.isActive ? "border-slate-200" : "border-slate-100 opacity-50"}`}>
                    <div className="flex justify-between items-start">
                      <div className="font-medium text-slate-900">{t.name}</div>
                      <div className="text-brand-700 font-semibold">${Number(t.price).toFixed(0)}</div>
                    </div>
                    {t.description && <p className="text-xs text-slate-500 mt-1">{t.description}</p>}
                    <div className="text-xs text-slate-400 mt-2">{t.durationMin} min</div>
                    {canManage && (
                      <button className="text-xs text-brand-600 hover:underline mt-2" onClick={() => toggleActive(t)}>
                        {t.isActive ? "Deactivate" : "Activate"}
                      </button>
                    )}
                  </div>
                ))}
            </div>
          </div>
        ))
      )}

      {showModal && (
        <Modal title="New Treatment" onClose={() => setShowModal(false)}>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="label">Name</label>
              <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="label">Category</label>
              <input className="input" placeholder="e.g. Preventive, Restorative" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Price ($)</label>
                <input className="input" type="number" min={0} step="0.01" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              </div>
              <div>
                <label className="label">Duration (min)</label>
                <input className="input" type="number" min={5} required value={form.durationMin} onChange={(e) => setForm({ ...form, durationMin: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="label">Description</label>
              <textarea className="input" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? "Saving..." : "Save treatment"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
