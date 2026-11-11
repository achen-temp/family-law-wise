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
    <main className="flex min-h-screen flex-col justify-center bg-canvas px-6 py-8">
      <div className="mx-auto w-full max-w-[440px]">
        <Link href="/" className="inline-flex min-h-9 items-center text-sm font-semibold text-brand">Family Law Wise</Link>
        <section className="card mt-4 p-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">Attorney workspace</p>
          <h1 className="mt-2 text-[28px] leading-9 font-semibold tracking-tight">Demo sign-in</h1>
          <p className="mt-3 text-sm leading-[21px] text-muted">Enter an email address to explore the sample attorney workspace. No account is created or verified.</p>
          <form className="mt-6" onSubmit={submit} noValidate>
            <div>
              <label htmlFor="attorney-email" className="mb-1.5 block text-sm font-medium">Work email</label>
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
              <div className="mt-1.5 min-h-[42px] text-xs leading-[18px]">
                {error ? <p id="sign-in-error" role="alert" className="text-error-text">{error}</p> : <p id="sign-in-hint" className="text-muted">Any valid email format works in this demo.</p>}
              </div>
            </div>
            <Button type="submit" variant="primary" className="w-full">Enter attorney demo</Button>
            <Button type="button" variant="ghost" className="mt-2 w-full" onClick={() => {
              setError("Simulated sign-in error. No authentication was attempted. Try entering the demo again.");
              emailRef.current?.focus();
            }}>Simulate sign-in error</Button>
          </form>
          <div className="mt-5 border-t border-line pt-4">
            <Link href="/" className="inline-flex min-h-9 items-center text-sm font-medium text-brand">Back to welcome</Link>
          </div>
        </section>
        <p className="mt-4 text-xs leading-[18px] text-muted">Demo only. No real sign-in or email delivery. Changes reset on refresh.</p>
      </div>
    </main>
  );
}
