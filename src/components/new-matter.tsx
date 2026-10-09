"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button, Choice, Field, PageHeader } from "@/components/ui";
import type { MatterType } from "@/lib/types";
import { useStore } from "@/lib/store";

const TYPES: MatterType[] = ["Divorce", "Post Judgment", "Child Support", "Other"];

export function NewMatterForm() {
  const router = useRouter();
  const { createMatter } = useStore();
  const [clientFirst, setClientFirst] = useState("");
  const [clientLast, setClientLast] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [otherFirst, setOtherFirst] = useState("");
  const [otherLast, setOtherLast] = useState("");
  const [stateName, setStateName] = useState("NJ");
  const [county, setCounty] = useState("");
  const [matterType, setMatterType] = useState<MatterType>("Divorce");
  const [matterName, setMatterName] = useState("");
  const [error, setError] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!clientFirst.trim() || !clientLast.trim() || !clientEmail.includes("@") || !otherFirst.trim() || !otherLast.trim() || !county.trim()) {
      setError("Add both parties, a client email, and the county.");
      return;
    }
    const id = createMatter({
      clientFirst,
      clientLast,
      clientEmail,
      otherFirst,
      otherLast,
      state: stateName,
      county,
      matterType,
      matterName,
    });
    router.push(`/matters/${id}`);
  }

  return (
    <div>
      <PageHeader
        eyebrow="Matters"
        title="New matter"
        description="Creates a financial disclosure file from the New Jersey divorce template."
      />
      <form onSubmit={submit} className="card max-w-2xl space-y-5 p-5 md:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Client first name">
            <input className="field" value={clientFirst} onChange={(event) => setClientFirst(event.target.value)} />
          </Field>
          <Field label="Client last name">
            <input className="field" value={clientLast} onChange={(event) => setClientLast(event.target.value)} />
          </Field>
        </div>
        <Field label="Client email" hint="Used for the secure invitation. The client signs in with a one-time code later.">
          <input className="field" type="email" value={clientEmail} onChange={(event) => setClientEmail(event.target.value)} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Other party first name">
            <input className="field" value={otherFirst} onChange={(event) => setOtherFirst(event.target.value)} />
          </Field>
          <Field label="Other party last name">
            <input className="field" value={otherLast} onChange={(event) => setOtherLast(event.target.value)} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="State">
            <select className="field" value={stateName} onChange={(event) => setStateName(event.target.value)}>
              <option value="NJ">New Jersey</option>
              <option value="NY">New York</option>
              <option value="PA">Pennsylvania</option>
            </select>
          </Field>
          <Field label="County">
            <input className="field" value={county} onChange={(event) => setCounty(event.target.value)} placeholder="Essex" />
          </Field>
        </div>
        <fieldset>
          <legend className="mb-1.5 text-sm font-medium">Matter type</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {TYPES.map((type) => (
              <Choice key={type} checked={matterType === type} onClick={() => setMatterType(type)}>
                {type}
              </Choice>
            ))}
          </div>
        </fieldset>
        <Field label="Template">
          <input className="field" value="NJ Divorce Financial Disclosure" readOnly />
        </Field>
        <Field label="Matter name" hint="Leave blank to use the parties’ names.">
          <input className="field" value={matterName} onChange={(event) => setMatterName(event.target.value)} />
        </Field>
        {error ? <p className="text-sm text-rose-800">{error}</p> : null}
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
