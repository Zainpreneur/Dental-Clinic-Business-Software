import { FormEvent, useEffect, useState } from "react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { api, getErrorMessage } from "../api/client";
import { Appointment, Patient, Treatment, User } from "../types";
import Modal from "../components/ui/Modal";
import StatusBadge from "../components/ui/StatusBadge";

const STATUS_OPTIONS: Appointment["status"][] = [
  "SCHEDULED",
  "CONFIRMED",
  "CHECKED_IN",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
];

function todayISO() {
  return format(new Date(), "yyyy-MM-dd");
}

export default function Appointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [dentists, setDentists] = useState<User[]>([]);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState(todayISO());
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [patientQuery, setPatientQuery] = useState("");
  const [patientResults, setPatientResults] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const [form, setForm] = useState({
    dentistId: "",
    treatmentId: "",
    date: todayISO(),
    startTime: "09:00",
    durationMin: 30,
    reason: "",
  });

  async function loadAppointments(date: string) {
    setLoading(true);
    try {
      const from = new Date(date);
      from.setHours(0, 0, 0, 0);
      const to = new Date(date);
      to.setHours(23, 59, 59, 999);
      const res = await api.get("/appointments", { params: { from: from.toISOString(), to: to.toISOString() } });
      setAppointments(res.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAppointments(dateFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFilter]);

  useEffect(() => {
    api.get("/staff/dentists").then((res) => setDentists(res.data));
    api.get("/treatments", { params: { activeOnly: true } }).then((res) => setTreatments(res.data));
  }, []);

  useEffect(() => {
    if (!patientQuery) {
      setPatientResults([]);
      return;
    }
    const t = setTimeout(() => {
      api.get("/patients", { params: { search: patientQuery, pageSize: 8 } }).then((res) => setPatientResults(res.data.data));
    }, 250);
    return () => clearTimeout(t);
  }, [patientQuery]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!selectedPatient) {
      toast.error("Select a patient first");
      return;
    }
    if (!form.dentistId) {
      toast.error("Select a dentist");
      return;
    }
    setSaving(true);
    try {
      const startTime = new Date(`${form.date}T${form.startTime}:00`);
      const endTime = new Date(startTime.getTime() + form.durationMin * 60000);
      await api.post("/appointments", {
        patientId: selectedPatient.id,
        dentistId: form.dentistId,
        treatmentId: form.treatmentId || undefined,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        reason: form.reason || undefined,
      });
      toast.success("Appointment scheduled");
      setShowModal(false);
      setSelectedPatient(null);
      setPatientQuery("");
      setForm({ dentistId: "", treatmentId: "", date: todayISO(), startTime: "09:00", durationMin: 30, reason: "" });
      loadAppointments(dateFilter);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(id: string, status: Appointment["status"]) {
    try {
      await api.patch(`/appointments/${id}/status`, { status });
      toast.success("Status updated");
      loadAppointments(dateFilter);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  function handleTreatmentSelect(treatmentId: string) {
    const t = treatments.find((tr) => tr.id === treatmentId);
    setForm({ ...form, treatmentId, durationMin: t?.durationMin || form.durationMin });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-slate-900">Appointments</h1>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          + New Appointment
        </button>
      </div>

      <div className="flex items-center gap-3">
        <label className="label mb-0">Date</label>
        <input type="date" className="input max-w-[180px]" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr className="text-left">
              <th className="py-3 px-4 font-medium">Time</th>
              <th className="py-3 px-4 font-medium">Patient</th>
              <th className="py-3 px-4 font-medium">Dentist</th>
              <th className="py-3 px-4 font-medium">Treatment</th>
              <th className="py-3 px-4 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="py-6 text-center text-slate-400">Loading...</td>
              </tr>
            ) : appointments.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-6 text-center text-slate-400">No appointments for this date.</td>
              </tr>
            ) : (
              appointments.map((a) => (
                <tr key={a.id} className="border-t border-slate-100">
                  <td className="py-3 px-4 whitespace-nowrap">
                    {format(new Date(a.startTime), "h:mm a")} – {format(new Date(a.endTime), "h:mm a")}
                  </td>
                  <td className="py-3 px-4">
                    {a.patient ? (
                      <Link to={`/patients/${a.patient.id}`} className="text-brand-600 hover:underline">
                        {a.patient.firstName} {a.patient.lastName}
                      </Link>
                    ) : "-"}
                  </td>
                  <td className="py-3 px-4">{a.dentist ? `Dr. ${a.dentist.firstName} ${a.dentist.lastName}` : "-"}</td>
                  <td className="py-3 px-4">{a.treatment?.name || "-"}</td>
                  <td className="py-3 px-4">
                    <select
                      className="text-xs border border-slate-300 rounded-md px-2 py-1 bg-white"
                      value={a.status}
                      onChange={(e) => handleStatusChange(a.id, e.target.value as Appointment["status"])}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s.replace(/_/g, " ")}
                        </option>
                      ))}
                    </select>
                    <span className="ml-2 align-middle">
                      <StatusBadge status={a.status} />
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <Modal title="New Appointment" onClose={() => setShowModal(false)} wide>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="label">Patient</label>
              {selectedPatient ? (
                <div className="flex items-center justify-between border border-slate-300 rounded-lg px-3 py-2">
                  <span>{selectedPatient.firstName} {selectedPatient.lastName} · {selectedPatient.phone}</span>
                  <button type="button" className="text-xs text-brand-600 hover:underline" onClick={() => setSelectedPatient(null)}>
                    Change
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <input
                    className="input"
                    placeholder="Search patient by name or phone..."
                    value={patientQuery}
                    onChange={(e) => setPatientQuery(e.target.value)}
                  />
                  {patientResults.length > 0 && (
                    <div className="absolute z-10 w-full bg-white border border-slate-200 rounded-lg mt-1 shadow-lg max-h-52 overflow-y-auto">
                      {patientResults.map((p) => (
                        <button
                          type="button"
                          key={p.id}
                          className="w-full text-left px-3 py-2 hover:bg-slate-50 text-sm"
                          onClick={() => {
                            setSelectedPatient(p);
                            setPatientResults([]);
                          }}
                        >
                          {p.firstName} {p.lastName} · {p.phone}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Dentist</label>
                <select className="input" required value={form.dentistId} onChange={(e) => setForm({ ...form, dentistId: e.target.value })}>
                  <option value="">Select dentist</option>
                  {dentists.map((d) => (
                    <option key={d.id} value={d.id}>
                      Dr. {d.firstName} {d.lastName} {d.specialty ? `(${d.specialty})` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Treatment</label>
                <select className="input" value={form.treatmentId} onChange={(e) => handleTreatmentSelect(e.target.value)}>
                  <option value="">None / TBD</option>
                  {treatments.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} (${Number(t.price).toFixed(0)})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Date</label>
                <input type="date" className="input" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              <div>
                <label className="label">Start time</label>
                <input type="time" className="input" required value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
              </div>
              <div>
                <label className="label">Duration (minutes)</label>
                <input
                  type="number"
                  min={15}
                  step={5}
                  className="input"
                  required
                  value={form.durationMin}
                  onChange={(e) => setForm({ ...form, durationMin: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="label">Reason</label>
                <input className="input" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? "Scheduling..." : "Schedule appointment"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
