import { FormEvent, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { api, getErrorMessage } from "../api/client";
import StatusBadge from "../components/ui/StatusBadge";
import Modal from "../components/ui/Modal";

const CONDITIONS = ["Healthy", "Cavity", "Filled", "Crown", "Root Canal", "Missing", "Implant", "Bridge", "Sealant"];

export default function PatientDetail() {
  const { id } = useParams<{ id: string }>();
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview" | "chart" | "appointments" | "billing">("overview");
  const [showChartModal, setShowChartModal] = useState(false);
  const [chartForm, setChartForm] = useState({ toothNumber: 1, condition: "Healthy", surface: "", notes: "" });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get(`/patients/${id}`);
      setPatient(res.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleAddChartEntry(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post(`/patients/${id}/dental-chart`, chartForm);
      toast.success("Dental chart updated");
      setShowChartModal(false);
      setChartForm({ toothNumber: 1, condition: "Healthy", surface: "", notes: "" });
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="text-slate-500">Loading patient...</div>;
  if (!patient) return <div className="text-slate-500">Patient not found.</div>;

  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "chart", label: "Dental Chart" },
    { key: "appointments", label: "Appointments" },
    { key: "billing", label: "Billing" },
  ] as const;

  return (
    <div className="space-y-6">
      <div>
        <Link to="/patients" className="text-sm text-brand-600 hover:underline">
          &larr; Back to patients
        </Link>
        <div className="flex items-center justify-between mt-2">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {patient.firstName} {patient.lastName}
            </h1>
            <p className="text-sm text-slate-500">
              {patient.phone} {patient.email ? `· ${patient.email}` : ""}
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-slate-500">Balance</div>
            <div className={`text-xl font-semibold ${Number(patient.balance) > 0 ? "text-red-600" : "text-slate-900"}`}>
              ${Number(patient.balance).toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      <div className="border-b border-slate-200 flex gap-6">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`pb-3 text-sm font-medium border-b-2 -mb-px ${
              tab === t.key ? "border-brand-600 text-brand-600" : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card p-6 space-y-3">
            <h3 className="font-semibold text-slate-900">Personal Information</h3>
            <InfoRow label="Date of birth" value={patient.dateOfBirth ? format(new Date(patient.dateOfBirth), "MMM d, yyyy") : "-"} />
            <InfoRow label="Gender" value={patient.gender} />
            <InfoRow label="Address" value={[patient.address, patient.city, patient.state, patient.postalCode].filter(Boolean).join(", ") || "-"} />
            <InfoRow label="Emergency contact" value={patient.emergencyContactName ? `${patient.emergencyContactName} (${patient.emergencyContactPhone || "-"})` : "-"} />
          </div>
          <div className="card p-6 space-y-3">
            <h3 className="font-semibold text-slate-900">Medical & Insurance</h3>
            <InfoRow label="Insurance provider" value={patient.insuranceProvider || "-"} />
            <InfoRow label="Policy #" value={patient.insurancePolicyNo || "-"} />
            <InfoRow label="Allergies" value={patient.allergies || "None recorded"} />
            <InfoRow label="Medical history" value={patient.medicalHistory || "None recorded"} />
          </div>

          <div className="card p-6 md:col-span-2">
            <h3 className="font-semibold text-slate-900 mb-3">Recent Treatments</h3>
            {patient.treatmentRecords.length === 0 ? (
              <p className="text-sm text-slate-500">No treatments recorded yet.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {patient.treatmentRecords.map((r: any) => (
                  <li key={r.id} className="py-2 flex items-center justify-between text-sm">
                    <div>
                      <div className="font-medium text-slate-800">{r.treatment.name}</div>
                      <div className="text-slate-500">
                        {r.toothNumber ? `Tooth #${r.toothNumber} · ` : ""}
                        by {r.performedBy.firstName} {r.performedBy.lastName}
                      </div>
                    </div>
                    <div className="text-slate-500">{format(new Date(r.performedAt), "MMM d, yyyy")}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {tab === "chart" && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Dental Chart (Universal Numbering 1–32)</h3>
            <button className="btn-primary" onClick={() => setShowChartModal(true)}>
              + Add Entry
            </button>
          </div>
          {patient.dentalChartEntries.length === 0 ? (
            <p className="text-sm text-slate-500">No dental chart entries recorded yet.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
              {patient.dentalChartEntries.map((c: any) => (
                <div key={c.id} className="border border-slate-200 rounded-lg p-3 text-center">
                  <div className="text-xs text-slate-400">Tooth</div>
                  <div className="text-lg font-bold text-slate-900">{c.toothNumber}</div>
                  <div className="text-xs font-medium text-brand-600 mt-1">{c.condition}</div>
                  {c.surface && <div className="text-xs text-slate-400">{c.surface}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "appointments" && (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr className="text-left">
                <th className="py-3 px-4 font-medium">Date</th>
                <th className="py-3 px-4 font-medium">Dentist</th>
                <th className="py-3 px-4 font-medium">Treatment</th>
                <th className="py-3 px-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {patient.appointments.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-slate-400">No appointments yet.</td>
                </tr>
              ) : (
                patient.appointments.map((a: any) => (
                  <tr key={a.id} className="border-t border-slate-100">
                    <td className="py-3 px-4">{format(new Date(a.startTime), "MMM d, yyyy h:mm a")}</td>
                    <td className="py-3 px-4">Dr. {a.dentist.firstName} {a.dentist.lastName}</td>
                    <td className="py-3 px-4">{a.treatment?.name || "-"}</td>
                    <td className="py-3 px-4"><StatusBadge status={a.status} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === "billing" && (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr className="text-left">
                <th className="py-3 px-4 font-medium">Invoice #</th>
                <th className="py-3 px-4 font-medium">Date</th>
                <th className="py-3 px-4 font-medium">Total</th>
                <th className="py-3 px-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {patient.invoices.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-slate-400">No invoices yet.</td>
                </tr>
              ) : (
                patient.invoices.map((inv: any) => (
                  <tr key={inv.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <Link to={`/invoices/${inv.id}`} className="text-brand-600 font-medium hover:underline">
                        {inv.invoiceNumber}
                      </Link>
                    </td>
                    <td className="py-3 px-4">{format(new Date(inv.createdAt), "MMM d, yyyy")}</td>
                    <td className="py-3 px-4">${Number(inv.total).toFixed(2)}</td>
                    <td className="py-3 px-4"><StatusBadge status={inv.status} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showChartModal && (
        <Modal title="Add Dental Chart Entry" onClose={() => setShowChartModal(false)}>
          <form onSubmit={handleAddChartEntry} className="space-y-4">
            <div>
              <label className="label">Tooth number (1–32)</label>
              <input
                className="input"
                type="number"
                min={1}
                max={32}
                required
                value={chartForm.toothNumber}
                onChange={(e) => setChartForm({ ...chartForm, toothNumber: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="label">Condition</label>
              <select className="input" value={chartForm.condition} onChange={(e) => setChartForm({ ...chartForm, condition: e.target.value })}>
                {CONDITIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Surface (optional)</label>
              <input className="input" placeholder="e.g. Occlusal, Mesial" value={chartForm.surface} onChange={(e) => setChartForm({ ...chartForm, surface: e.target.value })} />
            </div>
            <div>
              <label className="label">Notes</label>
              <textarea className="input" rows={2} value={chartForm.notes} onChange={(e) => setChartForm({ ...chartForm, notes: e.target.value })} />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" className="btn-secondary" onClick={() => setShowChartModal(false)}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? "Saving..." : "Add entry"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-800 font-medium text-right">{value}</span>
    </div>
  );
}
