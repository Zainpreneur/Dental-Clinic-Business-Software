import { FormEvent, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { api, getErrorMessage } from "../api/client";
import { Invoice, PaymentMethod } from "../types";
import StatusBadge from "../components/ui/StatusBadge";
import Modal from "../components/ui/Modal";
import { useAuth } from "../context/AuthContext";

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPayModal, setShowPayModal] = useState(false);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [reference, setReference] = useState("");
  const [saving, setSaving] = useState(false);

  const canBill = user?.role === "ADMIN" || user?.role === "RECEPTIONIST";

  async function load() {
    setLoading(true);
    try {
      const res = await api.get(`/invoices/${id}`);
      setInvoice(res.data);
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

  async function handlePayment(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post(`/invoices/${id}/payments`, { amount: Number(amount), method, reference: reference || undefined });
      toast.success("Payment recorded");
      setShowPayModal(false);
      setAmount("");
      setReference("");
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleVoid() {
    if (!confirm("Void this invoice? This cannot be undone.")) return;
    try {
      await api.post(`/invoices/${id}/void`);
      toast.success("Invoice voided");
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  if (loading) return <div className="text-slate-500">Loading invoice...</div>;
  if (!invoice) return <div className="text-slate-500">Invoice not found.</div>;

  const balanceDue = Number(invoice.total) - Number(invoice.amountPaid);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link to="/invoices" className="text-sm text-brand-600 hover:underline">
          &larr; Back to invoices
        </Link>
      </div>

      <div className="card p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">{invoice.invoiceNumber}</h1>
            <p className="text-sm text-slate-500 mt-1">{format(new Date(invoice.createdAt), "MMMM d, yyyy")}</p>
            {invoice.patient && (
              <Link to={`/patients/${invoice.patient.id}`} className="text-sm text-brand-600 hover:underline">
                {invoice.patient.firstName} {invoice.patient.lastName}
              </Link>
            )}
          </div>
          <StatusBadge status={invoice.status} />
        </div>

        <table className="w-full text-sm mt-6">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-200">
              <th className="py-2 font-medium">Description</th>
              <th className="py-2 font-medium text-right">Qty</th>
              <th className="py-2 font-medium text-right">Unit Price</th>
              <th className="py-2 font-medium text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((it) => (
              <tr key={it.id} className="border-b border-slate-100">
                <td className="py-2">{it.description}</td>
                <td className="py-2 text-right">{it.quantity}</td>
                <td className="py-2 text-right">${Number(it.unitPrice).toFixed(2)}</td>
                <td className="py-2 text-right">${Number(it.total).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end mt-4">
          <div className="w-64 text-sm space-y-1">
            <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span>${Number(invoice.subtotal).toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Discount</span><span>-${Number(invoice.discount).toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Tax</span><span>+${Number(invoice.tax).toFixed(2)}</span></div>
            <div className="flex justify-between font-semibold text-slate-900 text-base border-t border-slate-200 pt-1 mt-1">
              <span>Total</span><span>${Number(invoice.total).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-green-700"><span>Paid</span><span>${Number(invoice.amountPaid).toFixed(2)}</span></div>
            <div className="flex justify-between font-semibold text-red-600"><span>Balance due</span><span>${balanceDue.toFixed(2)}</span></div>
          </div>
        </div>

        {canBill && invoice.status !== "VOID" && (
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200">
            <button className="btn-danger" onClick={handleVoid}>
              Void invoice
            </button>
            {balanceDue > 0 && (
              <button className="btn-primary" onClick={() => { setAmount(balanceDue.toFixed(2)); setShowPayModal(true); }}>
                Record payment
              </button>
            )}
          </div>
        )}
      </div>

      <div className="card p-6">
        <h3 className="font-semibold text-slate-900 mb-3">Payment History</h3>
        {invoice.payments.length === 0 ? (
          <p className="text-sm text-slate-500">No payments recorded yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {invoice.payments.map((p) => (
              <li key={p.id} className="py-2 flex justify-between text-sm">
                <div>
                  <div className="font-medium text-slate-800">${Number(p.amount).toFixed(2)} · {p.method.replace(/_/g, " ")}</div>
                  {p.reference && <div className="text-slate-500 text-xs">Ref: {p.reference}</div>}
                </div>
                <div className="text-slate-500">{format(new Date(p.paidAt), "MMM d, yyyy h:mm a")}</div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {showPayModal && (
        <Modal title="Record Payment" onClose={() => setShowPayModal(false)}>
          <form onSubmit={handlePayment} className="space-y-4">
            <div>
              <label className="label">Amount ($)</label>
              <input className="input" type="number" min={0.01} step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div>
              <label className="label">Payment method</label>
              <select className="input" value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
                <option value="CASH">Cash</option>
                <option value="CARD">Card</option>
                <option value="INSURANCE">Insurance</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="label">Reference (optional)</label>
              <input className="input" value={reference} onChange={(e) => setReference(e.target.value)} />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" className="btn-secondary" onClick={() => setShowPayModal(false)}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? "Recording..." : "Record payment"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
