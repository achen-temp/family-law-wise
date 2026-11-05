"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui";
import { clientParty, matterTitle, personName } from "@/lib/format";
import { useStore } from "@/lib/store";

export function ClientInvitation({ token }: { token: string }) {
  const { state } = useStore();
  const router = useRouter();
  const matter = state.matters.find((item) => item.id === token);
  const codeRef = useRef<HTMLInputElement>(null);
  const [requested, setRequested] = useState(false);
  const [code, setCode] = useState("");
  const [expired, setExpired] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (requested) codeRef.current?.focus();
  }, [requested]);

  function resetCode() {
    setRequested(true);
    setExpired(false);
    setCode("");
    setError("");
    setMessage("Demo code ready: 123456. No email was sent.");
    codeRef.current?.focus();
  }

  function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const issue = !/^\d{6}$/.test(code)
      ? "Enter a six-digit demo code."
      : expired
        ? "This demo code has expired. Reset the demo code to continue."
        : code !== "123456"
          ? "That demo code does not match. Use the sample code 123456."
          : "";
    if (issue) {
      setError(issue);
      codeRef.current?.focus();
      return;
    }
    router.push(`/portal/${encodeURIComponent(token)}`);
  }

  return (
    <main className="min-h-screen bg-brand-soft px-5 py-10 sm:py-16">
      <div className="mx-auto w-full max-w-md">
        <Link href="/" className="text-sm font-semibold text-brand">Family Law Wise</Link>
        <section className="card mt-6 p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand">Client invitation demo</p>
          {matter ? (
            <>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight">You’re invited</h1>
              <p className="mt-3 text-sm leading-relaxed text-muted">Review the sample invitation, then use a demo code to enter this matter.</p>
              <dl className="mt-5 space-y-3 rounded-xl border border-line bg-brand-soft/40 p-4 text-sm">
                <div><dt className="text-xs text-muted">Invited client</dt><dd className="mt-1 font-medium">{personName(clientParty(matter))}</dd><dd className="break-all text-muted">{clientParty(matter)?.email || "No email on file"}</dd></div>
                <div><dt className="text-xs text-muted">Law firm</dt><dd className="mt-1 font-medium">{state.firm.name}</dd></div>
                <div><dt className="text-xs text-muted">Matter</dt><dd className="mt-1 break-words font-medium">{matterTitle(matter)}</dd></div>
              </dl>
              <p id="demo-code-hint" className="mt-5 text-sm leading-relaxed text-muted">Sample code: <strong className="font-mono text-foreground">123456</strong>. This is a simulated check, and does not protect access to the demo.</p>
              {!requested ? (
                <Button variant="primary" className="mt-5 min-h-11 w-full" onClick={resetCode}>Request demo code</Button>
              ) : (
                <form className="mt-5 space-y-4" onSubmit={verify} noValidate>
                  <div>
                    <label htmlFor="invitation-code" className="mb-1.5 block text-sm font-medium">Six-digit demo code</label>
                    <input
                      ref={codeRef}
                      id="invitation-code"
                      className="field min-h-11 font-mono tracking-widest"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      value={code}
                      onChange={(event) => { setCode(event.target.value); setError(""); }}
                      aria-invalid={Boolean(error)}
                      aria-describedby={`demo-code-hint${error ? " invitation-code-error" : ""}`}
                    />
                    {error ? <p id="invitation-code-error" role="alert" className="mt-2 text-sm text-rose-800">{error}</p> : null}
                  </div>
                  <Button type="submit" variant="primary" className="min-h-11 w-full">Enter client demo</Button>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button type="button" className="min-h-11 flex-1" onClick={resetCode}>Reset demo code</Button>
                    <Button type="button" className="min-h-11 flex-1" onClick={() => {
                      setExpired(true);
                      setError("This demo code has expired. Reset the demo code to continue.");
                      setMessage("");
                      codeRef.current?.focus();
                    }}>Simulate expired code</Button>
                  </div>
                </form>
              )}
              <p role="status" className="mt-3 text-sm leading-relaxed text-brand">{message}</p>
              <Link href={`/matters/${encodeURIComponent(token)}`} className="mt-4 inline-flex min-h-11 items-center text-sm font-medium text-brand">Back to attorney matter</Link>
            </>
          ) : (
            <>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight">Invitation not found</h1>
              <p className="mt-3 text-sm leading-relaxed text-muted">This link does not match a matter in the current demo. A newly created matter resets on refresh. Return to the attorney workspace to prepare another invitation.</p>
              <Link href="/matters" className="btn btn-primary mt-5 min-h-11 w-full">Back to matters</Link>
            </>
          )}
        </section>
        <p className="mt-5 text-sm leading-relaxed text-muted">Demo only. No real sign-in or email delivery. Changes reset on refresh.</p>
      </div>
    </main>
  );
}
