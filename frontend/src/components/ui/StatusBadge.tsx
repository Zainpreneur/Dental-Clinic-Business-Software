const statusStyles: Record<string, string> = {
  SCHEDULED: "bg-blue-100 text-blue-700",
  CONFIRMED: "bg-indigo-100 text-indigo-700",
  CHECKED_IN: "bg-purple-100 text-purple-700",
  IN_PROGRESS: "bg-amber-100 text-amber-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-slate-200 text-slate-600",
  NO_SHOW: "bg-red-100 text-red-700",
  DRAFT: "bg-slate-100 text-slate-600",
  UNPAID: "bg-red-100 text-red-700",
  PARTIALLY_PAID: "bg-amber-100 text-amber-700",
  PAID: "bg-green-100 text-green-700",
  VOID: "bg-slate-200 text-slate-500 line-through",
};

export default function StatusBadge({ status }: { status: string }) {
  return <span className={`badge ${statusStyles[status] || "bg-slate-100 text-slate-600"}`}>{status.replace(/_/g, " ")}</span>;
}
