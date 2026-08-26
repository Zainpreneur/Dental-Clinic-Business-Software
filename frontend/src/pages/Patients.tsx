import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { api, getErrorMessage } from "../api/client";
import { Patient } from "../types";
import Modal from "../components/ui/Modal";

const emptyForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  dateOfBirth: "",
  gender: "UNSPECIFIED",
  insuranceProvider: "",
  allergies: "",
};

export default function Patients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  async function load(searchTerm = "") {
    setLoading(true);
    try {
      const res = await api.get("/patients", { params: { search: searchTerm || undefined, pageSize: 50 } });
      setPatients(res.data.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => load(search), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/patients", form);
      toast.success("Patient added");
      setShowModal(false);
      setForm(emptyForm);
      load(search);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Patients</h1>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          + New Patient
        </button>
      </div>

      <input
        className="input max-w-sm"
        placeholder="Search by name, phone, or email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr className="text-left">
              <th className="py-3 px-4 font-medium">Name</th>
              <th className="py-3 px-4 font-medium">Phone</th>
              <th className="py-3 px-4 font-medium">Email</th>
              <th className="py-3 px-4 font-medium">Balance</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="py-6 text-center text-slate-400">
                  Loading...
                </td>
              </tr>
            ) : patients.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-6 text-center text-slate-400">
                  No patients found.
                </td>
              </tr>
            ) : (
              patients.map((p) => (
                <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4">
                    <Link to={`/patients/${p.id}`} className="text-brand-600 font-medium hover:underline">
                      {p.firstName} {p.lastName}
                    </Link>
                  </td>
                  <td className="py-3 px-4">{p.phone}</td>
                  <td className="py-3 px-4">{p.email || "-"}</td>
                  <td className="py-3 px-4">
                    <span className={Number(p.balance) > 0 ? "text-red-600 font-medium" : "text-slate-500"}>
                      ${Number(p.balance).toFixed(2)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <Modal title="New Patient" onClose={() => setShowModal(false)} wide>
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
              <div>
                <label className="label">Phone</label>
                <input className="input" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div>
                <label className="label">Email</label>
                <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <label className="label">Date of birth</label>
                <input className="input" type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} />
              </div>
              <div>
                <label className="label">Gender</label>
                <select className="input" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                  <option value="UNSPECIFIED">Unspecified</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="label">Insurance provider</label>
                <input className="input" value={form.insuranceProvider} onChange={(e) => setForm({ ...form, insuranceProvider: e.target.value })} />
              </div>
              <div>
                <label className="label">Allergies</label>
                <input className="input" value={form.allergies} onChange={(e) => setForm({ ...form, allergies: e.target.value })} />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? "Saving..." : "Save patient"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
