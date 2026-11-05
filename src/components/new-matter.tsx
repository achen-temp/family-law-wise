"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button, Field, PageHeader } from "@/components/ui";
import type { MatterType } from "@/lib/types";
import { useStore } from "@/lib/store";
import { validEmail } from "@/lib/workspace-validation";

const TYPES: MatterType[] = ["Divorce", "Post Judgment", "Child Support", "Other"];

export function NewMatterForm() {
  const router = useRouter();
  const { createMatter } = useStore();
  const [clientFirst, setClientFirst] = useState("");
  const [clientLast, setClientLast] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [otherFirst, setOtherFirst] = useState("");
  const [otherLast, setOtherLast] = useState("");
  const [county, setCounty] = useState("");
  const [matterName, setMatterName] = useState("");
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = [
      { name: "clientFirst", label: "client first name", value: clientFirst },
      { name: "clientLast", label: "client last name", value: clientLast },
      { name: "clientEmail", label: "client email address", value: clientEmail },
      { name: "otherFirst", label: "other party first name", value: otherFirst },
      { name: "otherLast", label: "other party last name", value: otherLast },
      { name: "county", label: "county", value: county },
    ];
    const invalid = fields.find((field) => !field.value.trim() || (field.name === "clientEmail" && !validEmail(field.value)));
    if (invalid) {
      setError(`Enter ${invalid.name === "clientEmail" ? "a valid " : "the "}${invalid.label}.`);
      (event.currentTarget.elements.namedItem(invalid.name) as HTMLInputElement)?.focus();
      return;
    }
    const id = createMatter({
      clientFirst: clientFirst.trim(),
      clientLast: clientLast.trim(),
      clientEmail: clientEmail.trim(),
      otherFirst: otherFirst.trim(),
      otherLast: otherLast.trim(),
      state: "NJ",
      county: county.trim(),
      matterType: "Divorce",
      matterName: matterName.trim(),
    });
    router.push(`/matters/${id}`);
  }

  return (
    <div>
      <PageHeader
        eyebrow="Matters"
        title="New matter"
        description="Create a New Jersey divorce demo matter. Other states and matter types are not supported in this pilot."
      />
      <form onSubmit={submit} noValidate onChange={() => setError("")} aria-describedby={error ? "new-matter-error" : undefined} className="card max-w-2xl space-y-5 p-5 md:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Client first name">
            <input className="field" name="clientFirst" required value={clientFirst} onChange={(event) => setClientFirst(event.target.value)} />
          </Field>
          <Field label="Client last name">
            <input className="field" name="clientLast" required value={clientLast} onChange={(event) => setClientLast(event.target.value)} />
          </Field>
        </div>
        <Field label="Client email" hint="Used to prepare the demo invitation. No email is sent and no real sign-in is performed.">
          <input className="field" name="clientEmail" required type="email" value={clientEmail} onChange={(event) => setClientEmail(event.target.value)} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Other party first name">
            <input className="field" name="otherFirst" required value={otherFirst} onChange={(event) => setOtherFirst(event.target.value)} />
          </Field>
          <Field label="Other party last name">
            <input className="field" name="otherLast" required value={otherLast} onChange={(event) => setOtherLast(event.target.value)} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="State" hint="Only New Jersey is supported in this pilot.">
            <select className="field" value="NJ" disabled>
              <option value="NJ">New Jersey</option>
              <option value="NY" disabled>New York — not supported</option>
              <option value="PA" disabled>Pennsylvania — not supported</option>
            </select>
          </Field>
          <Field label="County">
            <input className="field" name="county" required value={county} onChange={(event) => setCounty(event.target.value)} placeholder="Essex" />
          </Field>
        </div>
        <fieldset>
          <legend className="mb-1.5 text-sm font-medium">Matter type</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {TYPES.map((type) => (
              <button key={type} type="button" disabled aria-pressed={type === "Divorce"} className={`rounded-lg border px-3 py-2.5 text-left text-sm ${type === "Divorce" ? "border-brand bg-brand-soft font-medium text-brand" : "border-line text-muted opacity-60"}`}>
                {type}{type !== "Divorce" ? <span className="mt-1 block text-xs">Not supported</span> : null}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted">The active template supports NJ Divorce only.</p>
        </fieldset>
        <Field label="Template">
          <input className="field" value="NJ Divorce Financial Disclosure" readOnly />
        </Field>
        <Field label="Matter name (optional)" hint="Leave blank to use the parties’ names.">
          <input className="field" value={matterName} onChange={(event) => setMatterName(event.target.value)} />
        </Field>
        {error ? <p id="new-matter-error" role="alert" className="text-sm text-rose-800">{error}</p> : null}
        <div className="flex justify-end gap-2">
          <Button type="button" onClick={() => router.push("/matters")}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            Create matter
          </Button>
        </div>
      </form>
    </div>
  );
}
