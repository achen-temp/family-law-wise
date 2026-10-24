import Link from "next/link";

export default function Home() {
  return (
    <main className="grid min-h-screen place-items-center bg-brand-soft px-5 py-10">
      <div className="card w-full max-w-md p-6 text-center sm:p-8">
        <p className="text-sm font-semibold text-brand">Family Law Wise</p>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">Financial disclosure, together</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">Explore the attorney workspace. Clients enter through a demo invitation prepared from their matter.</p>
        <Link href="/sign-in" className="btn btn-primary mt-6 min-h-11 w-full">
          Attorney demo sign-in
        </Link>
        <p className="mt-6 text-xs leading-relaxed text-muted">Demo only. No real sign-in or email delivery. Changes reset on refresh.</p>
      </div>
    </main>
  );
}
