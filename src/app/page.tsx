import Link from "next/link";

export default function Home() {
  return (
    <main className="grid min-h-screen place-items-center px-6">
      <div className="text-center">
        <p className="text-3xl font-semibold tracking-tight">Family Law Wise</p>
        <Link href="/matters" className="btn btn-primary mt-6">
          Open matters
        </Link>
      </div>
    </main>
  );
}
