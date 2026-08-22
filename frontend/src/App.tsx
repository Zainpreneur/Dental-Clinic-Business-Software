import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import PatientDetail from "./pages/PatientDetail";
import Appointments from "./pages/Appointments";
import Treatments from "./pages/Treatments";
import Invoices from "./pages/Invoices";
import InvoiceDetail from "./pages/InvoiceDetail";
import Inventory from "./pages/Inventory";
import Staff from "./pages/Staff";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/patients" element={<Patients />} />
        <Route path="/patients/:id" element={<PatientDetail />} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/treatments" element={<Treatments />} />
        <Route path="/invoices" element={<Invoices />} />
        <Route path="/invoices/:id" element={<InvoiceDetail />} />
        <Route path="/inventory" element={<Inventory />} />
      </Route>

      <Route element={<ProtectedRoute roles={["ADMIN"]} />}>
        <Route path="/staff" element={<Staff />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
