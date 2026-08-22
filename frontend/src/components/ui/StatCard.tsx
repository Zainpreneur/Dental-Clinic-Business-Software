export default function StatCard({
  label,
  value,
  icon,
  accent = "brand",
}: {
  label: string;
  value: string | number;
  icon: string;
  accent?: "brand" | "green" | "amber" | "red";
}) {
  const accentClasses: Record<string, string> = {
    brand: "bg-brand-50 text-brand-700",
    green: "bg-green-50 text-green-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
  };

  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`h-11 w-11 rounded-lg flex items-center justify-center text-xl ${accentClasses[accent]}`}>{icon}</div>
      <div>
        <div className="text-2xl font-semibold text-slate-900">{value}</div>
        <div className="text-sm text-slate-500">{label}</div>
      </div>
    </div>
  );
}
