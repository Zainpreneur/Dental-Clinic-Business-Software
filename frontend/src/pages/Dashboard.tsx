import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { api, getErrorMessage } from "../api/client";
import { DashboardSummary } from "../types";
import StatCard from "../components/ui/StatCard";
import StatusBadge from "../components/ui/StatusBadge";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/dashboard/summary")
      .then((res) => setSummary(res.data))
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-slate-500">Loading dashboard...</div>;
  if (!summary) return <div className="text-slate-500">Unable to load dashboard.</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Welcome back, {user?.firstName}</h1>
        <p className="text-slate-500 text-sm mt-1">{format(new Date(), "EEEE, MMMM d, yyyy")}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active patients" value={summary.totalPatients} icon="🧑‍⚕️" accent="brand" />
        <StatCard label="Today's appointments" value={summary.todaysAppointmentCount} icon="📅" accent="amber" />
        <StatCard label="Revenue this month" value={`$${summary.monthlyRevenue.toFixed(2)}`} icon="💰" accent="green" />
        <StatCard label="Outstanding balance" value={`$${summary.outstandingBalance.toFixed(2)}`} icon="🧾" accent="red" />
      </div>

      {summary.lowStockCount > 0 && (
        <div className="card p-4 border-amber-300 bg-amber-50 text-amber-800 flex items-center justify-between">
          <span>⚠️ {summary.lowStockCount} inventory item(s) are at or below reorder level.</span>
          <Link to="/inventory" className="text-sm font-medium underline">
            View inventory
          </Link>
        </div>
      )}

      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-900">Today's schedule</h2>
          <Link to="/appointments" className="text-sm text-brand-600 hover:underline">
            View all
          </Link>
        </div>
        {summary.todaysAppointments.length === 0 ? (
          <p className="text-sm text-slate-500">No appointments scheduled for today.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-200">
                  <th className="py-2 pr-4 font-medium">Time</th>
                  <th className="py-2 pr-4 font-medium">Patient</th>
                  <th className="py-2 pr-4 font-medium">Dentist</th>
                  <th className="py-2 pr-4 font-medium">Treatment</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {summary.todaysAppointments.map((a) => (
                  <tr key={a.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-2 pr-4">{format(new Date(a.startTime), "h:mm a")}</td>
                    <td className="py-2 pr-4">
                      {a.patient ? (
                        <Link to={`/patients/${a.patient.id}`} className="text-brand-600 hover:underline">
                          {a.patient.firstName} {a.patient.lastName}
                        </Link>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="py-2 pr-4">
                      {a.dentist ? `Dr. ${a.dentist.firstName} ${a.dentist.lastName}` : "-"}
                    </td>
                    <td className="py-2 pr-4">{a.treatment?.name || "-"}</td>
                    <td className="py-2 pr-4">
                      <StatusBadge status={a.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
