import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="h-screen flex flex-col items-center justify-center gap-3 text-slate-600">
      <div className="text-5xl">🦷</div>
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <Link to="/" className="text-brand-600 hover:underline">
        Back to dashboard
      </Link>
    </div>
  );
}
