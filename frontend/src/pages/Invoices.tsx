import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { api, getErrorMessage } from "../api/client";
import { Invoice, Patient, Treatment } from "../types";
import Modal from "../components/ui/Modal";
import StatusBadge from "../components/ui/StatusBadge";

interface LineItem {
  treatmentId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export default function Invoices() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [treatments, setTreatments] = useState<Treatment[]>([]);

  const [patientQuery, setPatientQuery] = useState("");
  const [patientResults, setPatientResults] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [items, setItems] = useState<LineItem[]>([{ description: "", quantity: 1, unitPrice: 0 }]);
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get("/invoices");
      setInvoices(res.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
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

  function addItem() {
    setItems([...items, { description: "", quantity: 1, unitPrice: 0 }]);
  }

  function updateItem(idx: number, patch: Partial<LineItem>) {
    setItems(items.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }

  function removeItem(idx: number) {
    setItems(items.filter((_, i) => i !== idx));
  }

  function selectTreatmentForItem(idx: number, treatmentId: string) {
    const t = treatments.find((tr) => tr.id === treatmentId);
    if (!t) return;
    updateItem(idx, { treatmentId, description: t.name, unitPrice: Number(t.price) });
  }

  const subtotal = items.reduce((s, it) => s + it.quantity * it.unitPrice, 0);
  const total = Math.max(subtotal - discount + tax, 0);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!selectedPatient) {
      toast.error("Select a patient");
      return;
    }
    if (items.some((it) => !it.description || it.unitPrice < 0)) {
      toast.error("All line items need a description and a valid price");
      return;
    }
    setSaving(true);
    try {
      const res = await api.post("/invoices", {
        patientId: selectedPatient.id,
        items,
        discount,
        tax,
      });
      toast.success("Invoice created");
      setShowModal(false);
      navigate(`/invoices/${res.data.id}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Billing &amp; Invoices</h1>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          + New Invoice
        </button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr className="text-left">
              <th className="py-3 px-4 font-medium">Invoice #</th>
              <th className="py-3 px-4 font-medium">Patient</th>
              <th className="py-3 px-4 font-medium">Date</th>
              <th className="py-3 px-4 font-medium">Total</th>
              <th className="py-3 px-4 font-medium">Paid</th>
              <th className="py-3 px-4 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="py-6 text-center text-slate-400">Loading...</td></tr>
            ) : invoices.length === 0 ? (
              <tr><td colSpan={6} className="py-6 text-center text-slate-400">No invoices yet.</td></tr>
            ) : (
              invoices.map((inv) => (
                <tr key={inv.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4">
                    <Link to={`/invoices/${inv.id}`} className="text-brand-600 font-medium hover:underline">
                      {inv.invoiceNumber}
                    </Link>
                  </td>
                  <td className="py-3 px-4">
                    {inv.patient ? (
                      <Link to={`/patients/${inv.patient.id}`} className="hover:underline">
                        {inv.patient.firstName} {inv.patient.lastName}
                      </Link>
                    ) : "-"}
                  </td>
                  <td className="py-3 px-4">{format(new Date(inv.createdAt), "MMM d, yyyy")}</td>
                  <td className="py-3 px-4">${Number(inv.total).toFixed(2)}</td>
                  <td className="py-3 px-4">${Number(inv.amountPaid).toFixed(2)}</td>
                  <td className="py-3 px-4"><StatusBadge status={inv.status} /></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <Modal title="New Invoice" onClose={() => setShowModal(false)} wide>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="label">Patient</label>
              {selectedPatient ? (
                <div className="flex items-center justify-between border border-slate-300 rounded-lg px-3 py-2">
                  <span>{selectedPatient.firstName} {selectedPatient.lastName}</span>
                  <button type="button" className="text-xs text-brand-600 hover:underline" onClick={() => setSelectedPatient(null)}>
                    Change
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <input className="input" placeholder="Search patient..." value={patientQuery} onChange={(e) => setPatientQuery(e.target.value)} />
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

            <div>
              <label className="label">Line items</label>
              <div className="space-y-2">
                {items.map((it, idx) => (
                  <div key={idx} className="flex gap-2 items-start">
                    <select
                      className="input max-w-[160px]"
                      value={it.treatmentId || ""}
                      onChange={(e) => selectTreatmentForItem(idx, e.target.value)}
                    >
                      <option value="">Custom</option>
                      {treatments.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                    <input
                      className="input"
                      placeholder="Description"
                      required
                      value={it.description}
                      onChange={(e) => updateItem(idx, { description: e.target.value })}
                    />
                    <input
                      className="input max-w-[70px]"
                      type="number"
                      min={1}
                      value={it.quantity}
                      onChange={(e) => updateItem(idx, { quantity: Number(e.target.value) })}
                    />
                    <input
                      className="input max-w-[100px]"
                      type="number"
                      min={0}
                      step="0.01"
                      value={it.unitPrice}
                      onChange={(e) => updateItem(idx, { unitPrice: Number(e.target.value) })}
                    />
                    <button type="button" className="text-slate-400 hover:text-red-500 px-2" onClick={() => removeItem(idx)}>
                      &times;
                    </button>
                  </div>
                ))}
              </div>
              <button type="button" className="text-sm text-brand-600 hover:underline mt-2" onClick={addItem}>
                + Add line item
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Discount ($)</label>
                <input className="input" type="number" min={0} step="0.01" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} />
              </div>
              <div>
                <label className="label">Tax ($)</label>
                <input className="input" type="number" min={0} step="0.01" value={tax} onChange={(e) => setTax(Number(e.target.value))} />
              </div>
            </div>

            <div className="text-right text-sm text-slate-600 space-y-1">
              <div>Subtotal: ${subtotal.toFixed(2)}</div>
              <div className="text-lg font-semibold text-slate-900">Total: ${total.toFixed(2)}</div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? "Creating..." : "Create invoice"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
