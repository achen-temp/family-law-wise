"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { EntryRoleNav } from "@/components/entry-role-nav";
import { Button } from "@/components/ui";
import { clientMattersForEmail, demoCodeError } from "@/lib/client-entry";
import { matterTitle } from "@/lib/format";
import { useStore } from "@/lib/store";
import "./entry.css";

export function ClientSignIn() {
  const { state } = useStore();
  const router = useRouter();
  const emailRef = useRef<HTMLInputElement>(null);
  const codeRef = useRef<HTMLInputElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [step, setStep] = useState<"email" | "code" | "matters" | "recovery">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [expired, setExpired] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const matters = step === "matters" ? clientMattersForEmail(state.matters, email) : [];

  useEffect(() => {
    if (step === "code") codeRef.current?.focus();
    else if (step === "email") emailRef.current?.focus();
    else headingRef.current?.focus();
  }, [step]);

  function requestCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Enter the email address used for your client invitation.");
      emailRef.current?.focus();
      return;
    }
    setEmail(email.trim().toLowerCase());
    setError("");
    setStep("code");
  }

  function resetCode() {
    setCode("");
    setExpired(false);
    setError("");
    setMessage("Demo code is ready. No email was sent.");
    codeRef.current?.focus();
  }

  function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const issue = demoCodeError(code, expired);
    if (issue) {
      setError(issue);
      codeRef.current?.focus();
      return;
    }
    const eligible = clientMattersForEmail(state.matters, email);
    if (eligible.length === 1) {
      router.push(`/portal/${encodeURIComponent(eligible[0].id)}`);
      return;
    }
    setMessage("");
    setStep(eligible.length ? "matters" : "recovery");
  }

  function useAnotherEmail() {
    setEmail("");
    setCode("");
    setExpired(false);
    setError("");
    setMessage("");
    setStep("email");
  }

  const recovery = step === "recovery" || (step === "matters" && !matters.length);

  return (
    <main className="entry-entry entry-returningClient">
      <aside className="entry-orientation entry-attorneyOrientation" aria-label="Family Law Wise">
        <Link href="/" className="entry-wordmark"><span className="entry-brandMark" aria-hidden="true">W</span>Family Law Wise</Link>
        <div className="entry-attorneyIntro"><h2 className="entry-editorialTitle">Financial disclosure</h2></div>
        <div className="entry-photograph">
          <Image src="/entry-still-life.webp" alt="" fill sizes="(min-width: 900px) 50vw, 100vw" priority className="object-cover" />
        </div>
      </aside>
      <div className="entry-taskSide">
        <section className="entry-task" aria-labelledby="entry-title">
          <EntryRoleNav role="client" />
          <p className="entry-contextLabel">Returning client · Demo</p>
          <h1 ref={headingRef} id="entry-title" className="entry-taskTitle" tabIndex={-1}>{recovery ? "Unable to open your matter" : step === "matters" ? "Choose your matter" : step === "code" ? "Enter your demo code" : "Client sign-in"}</h1>
          {step === "email" ? (
            <>
              <p className="entry-taskCopy">Return with the email address your attorney invited.</p>
              <form className="entry-form" onSubmit={requestCode} noValidate>
                <div>
                  <label htmlFor="client-email" className="entry-label">Invited email</label>
                  <input ref={emailRef} id="client-email" className="field" type="email" autoComplete="email" value={email} onChange={(event) => { setEmail(event.target.value); setError(""); }} aria-invalid={Boolean(error)} aria-describedby={error ? "client-email-error" : "client-email-hint"} />
                  <div className="entry-fieldHelp">
                    {error ? <p id="client-email-error" role="alert" className="text-error-text">{error}</p> : <p id="client-email-hint" className="text-muted">Use the same email as your invitation.</p>}
                  </div>
                </div>
                <Button type="submit" variant="primary" className="entry-primary">Continue with email<span aria-hidden="true">→</span></Button>
              </form>
              <p className="entry-taskCopy">First time here? Open the invitation link from your attorney. If you need a new link, contact your law firm.</p>
            </>
          ) : step === "code" ? (
            <>
              <p className="entry-taskCopy">Continue for {email}. This demo uses the sample code below; no email was sent.</p>
              <div id="client-code-hint" className="entry-sampleCode"><span>Sample code</span><strong>123456</strong></div>
              <form className="entry-codeForm" onSubmit={verify} noValidate>
                <div>
                  <label htmlFor="client-code" className="entry-label">Six-digit demo code</label>
                  <input ref={codeRef} id="client-code" className="field font-mono tracking-widest" type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(event) => { setCode(event.target.value); setError(""); }} aria-invalid={Boolean(error)} aria-describedby={`client-code-hint${error ? " client-code-error" : ""}`} />
                  <div className="entry-fieldHelp">
                    {error ? <p id="client-code-error" role="alert" className="text-error-text">{error}</p> : <p className="text-muted">Enter the sample code above to continue.</p>}
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
              <p role="status" className="entry-status">{message}</p>
            </>
          ) : recovery ? (
            <p className="entry-taskCopy">We couldn’t open a client matter for this email in the current demo. Use your original invitation or contact your law firm for help. Newly created demo matters reset on refresh.</p>
          ) : (
            <>
              <p className="entry-taskCopy">Select the matter you want to continue for {email}.</p>
              <div className="entry-matterChoices">
                {matters.map((matter) => <Link key={matter.id} href={`/portal/${encodeURIComponent(matter.id)}`} className="btn entry-primary">{matterTitle(matter)}<span aria-hidden="true">→</span></Link>)}
              </div>
            </>
          )}
          <div className="entry-returnLink">
            {step !== "email" ? <Button type="button" variant="ghost" className="entry-reset" onClick={useAnotherEmail}>Use another email</Button> : <Link href="/">Back to welcome</Link>}
          </div>
        </section>
        <p className="entry-disclosure">Demo only. The code does not verify identity or protect access. No email is sent. Changes reset on refresh.</p>
      </div>
    </main>
  );
}
