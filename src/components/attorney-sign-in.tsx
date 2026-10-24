"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui";

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
    <main className="min-h-screen bg-brand-soft px-5 py-10 sm:py-16">
      <div className="mx-auto w-full max-w-md">
        <Link href="/" className="text-sm font-semibold text-brand">Family Law Wise</Link>
        <section className="card mt-6 p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand">Attorney workspace</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Demo sign-in</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">Enter an email address to explore the sample attorney workspace. No account is created or verified.</p>
          <form className="mt-6 space-y-4" onSubmit={submit} noValidate>
            <div>
              <label htmlFor="attorney-email" className="mb-1.5 block text-sm font-medium">Work email</label>
              <input
                ref={emailRef}
                id="attorney-email"
                className="field min-h-11"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => { setEmail(event.target.value); setError(""); }}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "sign-in-error" : undefined}
              />
              {error ? <p id="sign-in-error" role="alert" className="mt-2 text-sm text-rose-800">{error}</p> : null}
            </div>
            <Button type="submit" variant="primary" className="min-h-11 w-full">Enter attorney demo</Button>
            <Button type="button" className="min-h-11 w-full" onClick={() => {
              setError("Simulated sign-in error. No authentication was attempted. Try entering the demo again.");
              emailRef.current?.focus();
            }}>Simulate sign-in error</Button>
          </form>
          <Link href="/" className="mt-5 inline-flex min-h-11 items-center text-sm font-medium text-brand">Back to welcome</Link>
        </section>
        <p className="mt-5 text-sm leading-relaxed text-muted">Demo only. No real sign-in or email delivery. Changes reset on refresh.</p>
      </div>
    </main>
  );
}
