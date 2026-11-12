"use client";

import Link from "next/link";
import Image from "next/image";
import "./entry.css";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui";
import { EntryRoleNav } from "@/components/entry-role-nav";

export function AttorneySignIn() {
  const router = useRouter();
  const emailRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Enter a valid email address to continue the demo.");
      emailRef.current?.focus();
      return;
    }
    router.push("/overview");
  }

  return (
    <main className="entry-entry">
      <aside className="entry-orientation entry-attorneyOrientation" aria-label="Family Law Wise">
        <Link href="/" className="entry-wordmark"><span className="entry-brandMark" aria-hidden="true">W</span>Family Law Wise</Link>
        <div className="entry-attorneyIntro">
          <h2 className="entry-editorialTitle">Financial disclosure</h2>
        </div>
        <div className="entry-photograph">
          <Image src="/entry-still-life.webp" alt="" fill sizes="(min-width: 900px) 50vw, 100vw" priority className="object-cover" />
        </div>
      </aside>
      <div className="entry-taskSide">
        <section className="entry-task" aria-labelledby="entry-title">
          <EntryRoleNav role="attorney" />
          <p className="entry-contextLabel">Demo workspace</p>
          <h1 id="entry-title" className="entry-taskTitle">Attorney sign-in</h1>
          <p className="entry-taskCopy">Enter an email address to open the sample attorney workspace.</p>
          <form className="entry-form" onSubmit={submit} noValidate>
            <div>
              <label htmlFor="attorney-email" className="entry-label">Work email</label>
              <input
                ref={emailRef}
                id="attorney-email"
                className="field"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => { setEmail(event.target.value); setError(""); }}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "sign-in-error" : "sign-in-hint"}
              />
              <div className="entry-fieldHelp">
                {error ? <p id="sign-in-error" role="alert" className="text-error-text">{error}</p> : <p id="sign-in-hint" className="text-muted">Any valid email format works in this demo.</p>}
              </div>
            </div>
            <Button type="submit" variant="primary" className="entry-primary">Enter attorney demo<span aria-hidden="true">→</span></Button>
            <details className="entry-demoControls" onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.currentTarget.open = false;
                event.currentTarget.querySelector("summary")?.focus();
              }
            }}>
              <summary>Demo controls</summary>
              <Button type="button" variant="ghost" className="entry-simulation" onClick={() => {
                setError("Simulated sign-in error. No authentication was attempted. Try entering the demo again.");
                emailRef.current?.focus();
              }}>Simulate sign-in error</Button>
            </details>
          </form>
          <div className="entry-returnLink">
            <Link href="/">Back to welcome</Link>
          </div>
        </section>
        <p className="entry-disclosure">Demo only. No account is created or verified, and no email is sent. Changes reset on refresh.</p>
      </div>
    </main>
  );
}
