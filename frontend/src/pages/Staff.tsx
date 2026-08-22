import { FormEvent, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api, getErrorMessage } from "../api/client";
import { Role, User } from "../types";
import Modal from "../components/ui/Modal";

const emptyForm = { firstName: "", lastName: "", email: "", password: "", role: "RECEPTIONIST" as Role, phone: "", specialty: "" };

export default function Staff() {
  const [staff, setStaff] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get("/staff");
      setStaff(res.data);
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
      await api.post("/staff", form);
      toast.success("Staff member added");
      setShowModal(false);
      setForm(emptyForm);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate(id: string) {
    if (!confirm("Deactivate this staff member?")) return;
    try {
      await api.delete(`/staff/${id}`);
      toast.success("Staff member deactivated");
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Staff</h1>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          + New Staff Member
        </button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr className="text-left">
              <th className="py-3 px-4 font-medium">Name</th>
              <th className="py-3 px-4 font-medium">Role</th>
              <th className="py-3 px-4 font-medium">Email</th>
              <th className="py-3 px-4 font-medium">Status</th>
              <th className="py-3 px-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="py-6 text-center text-slate-400">Loading...</td></tr>
            ) : (
              staff.map((s) => (
                <tr key={s.id} className="border-t border-slate-100">
                  <td className="py-3 px-4 font-medium text-slate-800">
                    {s.firstName} {s.lastName}
                    {s.specialty && <div className="text-xs text-slate-400 font-normal">{s.specialty}</div>}
                  </td>
                  <td className="py-3 px-4">{s.role}</td>
                  <td className="py-3 px-4">{s.email}</td>
                  <td className="py-3 px-4">
                    <span className={`badge ${s.isActive ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-500"}`}>
                      {s.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {s.isActive && (
                      <button className="text-xs text-red-600 hover:underline" onClick={() => handleDeactivate(s.id)}>
                        Deactivate
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <Modal title="New Staff Member" onClose={() => setShowModal(false)}>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">First name</label>
                <input className="input" required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
              </div>
              <div>
                <label className="label">Last name</label>
                <input className="input" required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="label">Temporary password</label>
              <input className="input" type="password" required minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <div>
              <label className="label">Role</label>
              <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
                <option value="ADMIN">Admin</option>
                <option value="DENTIST">Dentist</option>
                <option value="RECEPTIONIST">Receptionist</option>
                <option value="ASSISTANT">Assistant</option>
              </select>
            </div>
            {form.role === "DENTIST" && (
              <div>
                <label className="label">Specialty</label>
                <input className="input" value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} />
              </div>
            )}
            <div>
              <label className="label">Phone</label>
              <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? "Saving..." : "Add staff member"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
