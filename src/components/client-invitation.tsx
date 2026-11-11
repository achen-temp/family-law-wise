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
    <main className="flex min-h-screen flex-col justify-center bg-canvas px-6 py-8">
      <div className="mx-auto w-full max-w-[440px]">
        <Link href="/" className="inline-flex min-h-9 items-center text-sm font-semibold text-brand">Family Law Wise</Link>
        <section className="card mt-4 p-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">Client invitation demo</p>
          {matter ? (
            <>
              <h1 className="mt-2 text-[28px] leading-9 font-semibold tracking-tight">You’re invited</h1>
              <p className="mt-3 text-sm leading-[21px] text-muted">Review the sample invitation, then use a demo code to enter this matter.</p>
              <dl className="mt-5 divide-y divide-line border-y border-line text-sm leading-[21px]">
                <div className="grid grid-cols-[88px_minmax(0,1fr)] gap-3 py-3"><dt className="text-xs leading-[21px] text-muted">Law firm</dt><dd className="break-words font-medium">{state.firm.name}</dd></div>
                <div className="grid grid-cols-[88px_minmax(0,1fr)] gap-3 py-3"><dt className="text-xs leading-[21px] text-muted">Matter</dt><dd className="break-words font-medium">{matterTitle(matter)}</dd></div>
                <div className="grid grid-cols-[88px_minmax(0,1fr)] gap-3 py-3"><dt className="text-xs leading-[21px] text-muted">Invited client</dt><dd><span className="block break-words font-medium">{personName(clientParty(matter))}</span><span className="block break-all text-xs leading-[18px] text-muted">{clientParty(matter)?.email || "No email on file"}</span></dd></div>
              </dl>
              <p id="demo-code-hint" className="mt-5 text-xs leading-[18px] text-muted">Sample code: <strong className="font-mono text-foreground">123456</strong>. This is a simulated check, and does not protect access to the demo.</p>
              {!requested ? (
                <Button variant="primary" className="mt-5 w-full" onClick={resetCode}>Request demo code</Button>
              ) : (
                <form className="mt-5" onSubmit={verify} noValidate>
                  <div>
                    <label htmlFor="invitation-code" className="mb-1.5 block text-sm font-medium">Six-digit demo code</label>
                    <input
                      ref={codeRef}
                      id="invitation-code"
                      className="field font-mono tracking-widest"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      value={code}
                      onChange={(event) => { setCode(event.target.value); setError(""); }}
                      aria-invalid={Boolean(error)}
                      aria-describedby={`demo-code-hint${error ? " invitation-code-error" : ""}`}
                    />
                    <div className="mt-1.5 min-h-[42px] text-xs leading-[18px]">
                      {error ? <p id="invitation-code-error" role="alert" className="text-error-text">{error}</p> : <p className="text-muted">Enter the sample code above to continue.</p>}
                    </div>
                  </div>
                  <Button type="submit" variant="primary" className="w-full">Enter client demo</Button>
                  <div className="mt-2 flex flex-wrap justify-between gap-x-2">
                    <Button type="button" variant="ghost" className="px-0" onClick={resetCode}>Reset demo code</Button>
                    <Button type="button" variant="ghost" className="px-0" onClick={() => {
                      setExpired(true);
                      setError("This demo code has expired. Reset the demo code to continue.");
                      setMessage("");
                      codeRef.current?.focus();
                    }}>Simulate expired code</Button>
                  </div>
                </form>
              )}
              <p role="status" className="mt-3 min-h-[18px] text-xs leading-[18px] text-brand">{message}</p>
              <div className="mt-4 border-t border-line pt-3">
                <Link href={`/matters/${encodeURIComponent(token)}`} className="inline-flex min-h-9 items-center text-sm font-medium text-brand">Demo: back to attorney matter</Link>
              </div>
            </>
          ) : (
            <>
              <h1 className="mt-2 text-[28px] leading-9 font-semibold tracking-tight">Invitation not found</h1>
              <p className="mt-3 text-sm leading-[21px] text-muted">This link does not match a matter in the current demo. Open your original invitation, or ask your law firm for a fresh link. Newly created demo matters reset on refresh.</p>
              <Link href="/matters" className="btn btn-primary mt-6 w-full">Demo: back to matters</Link>
            </>
          )}
        </section>
        <p className="mt-4 text-xs leading-[18px] text-muted">Demo only. No real sign-in or email delivery. Changes reset on refresh.</p>
      </div>
    </main>
  );
}
