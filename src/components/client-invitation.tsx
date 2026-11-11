"use client";

import Link from "next/link";
import "./entry.css";
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
    setMessage("Demo code is ready. No email was sent.");
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
    <main className="entry-entry">
      <aside className="entry-orientation" aria-label="Invitation details">
        <Link href="/" className="entry-wordmark"><span className="entry-brandMark" aria-hidden="true">W</span>Family Law Wise</Link>
        <div className="entry-invitationIdentity">
          <p className="entry-contextLabel">Client invitation</p>
          {matter ? (
            <>
              <h2 className="entry-firmName">{state.firm.name || "Law firm details pending"}</h2>
              <dl className="entry-identityList">
                <div><dt>Matter</dt><dd>{matterTitle(matter)}</dd></div>
                <div><dt>Invited client</dt><dd>{personName(clientParty(matter))}<span className="entry-recipientEmail">{clientParty(matter)?.email || "No email on file"}</span></dd></div>
              </dl>
            </>
          ) : (
            <h2 className="entry-editorialTitle">Let’s find your invitation.</h2>
          )}
        </div>
        <p className="entry-identityFooter">Your invitation connects you to your attorney’s matter.</p>
      </aside>
      <div className="entry-taskSide">
        <section className="entry-task" aria-labelledby="entry-title">
          {matter ? (
            <>
              <p className="entry-contextLabel">Client demo</p>
              <h1 id="entry-title" className="entry-taskTitle">You’re invited</h1>
              <p className="entry-taskCopy">Check the invitation details, then use a demo code to open your matter.</p>
              <div id="demo-code-hint" className="entry-sampleCode"><span>Sample code</span><strong>123456</strong></div>
              {!requested ? (
                <Button variant="primary" className="entry-primary" onClick={resetCode}>Request demo code<span aria-hidden="true">→</span></Button>
              ) : (
                <form className="entry-codeForm" onSubmit={verify} noValidate>
                  <div>
                    <label htmlFor="invitation-code" className="entry-label">Six-digit demo code</label>
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
                    <div className="entry-fieldHelp">
                      {error ? <p id="invitation-code-error" role="alert" className="text-error-text">{error}</p> : <p className="text-muted">Enter the sample code above to continue.</p>}
                    </div>
                  </div>
                  <Button type="submit" variant="primary" className="entry-primary">Enter client demo<span aria-hidden="true">→</span></Button>
                  <div className="entry-recovery">
                    <Button type="button" variant="ghost" className="entry-reset" onClick={resetCode}>Reset demo code</Button>
                    <Button type="button" variant="ghost" className="entry-simulation" onClick={() => {
                      setExpired(true);
                      setError("This demo code has expired. Reset the demo code to continue.");
                      setMessage("");
                      codeRef.current?.focus();
                    }}>Simulate expired code</Button>
                  </div>
                </form>
              )}
              <p role="status" className="entry-status">{message}</p>
              <div className="entry-returnLink">
                <Link href={`/matters/${encodeURIComponent(token)}`}>Demo: back to attorney matter</Link>
              </div>
            </>
          ) : (
            <>
              <p className="entry-contextLabel">Client demo</p>
              <h1 id="entry-title" className="entry-taskTitle">Invitation not found</h1>
              <p className="entry-taskCopy">This link does not match a matter in the current demo. Open your original invitation, or ask your law firm for a fresh link.</p>
              <p className="entry-missingHint">Newly created demo matters reset on refresh.</p>
              <Link href="/matters" className={`btn btn-primary entry-primary`}>Demo: back to matters<span aria-hidden="true">→</span></Link>
            </>
          )}
        </section>
        <p className="entry-disclosure">Demo only. The code does not verify identity or protect access. No email is sent. Changes reset on refresh.</p>
      </div>
    </main>
  );
}
