"use client";

import { useState } from "react";
import { Button, Dialog, Field } from "@/components/ui";
import { useStore } from "@/lib/store";
import type { Requirement } from "@/lib/types";

export function RequestDialog({
  matterId,
  open,
  onClose,
  items,
}: {
  matterId: string;
  open: boolean;
  onClose: () => void;
  items: Requirement[];
}) {
  const { requestDocuments } = useStore();
  const candidates = items.filter(
    (item) => item.status === "MISSING" || item.status === "REQUESTED" || item.status === "NOT_AVAILABLE",
  );
  const [selected, setSelected] = useState<string[]>(
    candidates.filter((item) => item.status !== "NOT_AVAILABLE").map((item) => item.id),
  );
  const [message, setMessage] = useState(
    "We still need the following documents to complete your financial disclosure.",
  );

  function toggle(id: string) {
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  return (
    <Dialog
      open={open}
      title="Request documents"
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            disabled={selected.length === 0}
            onClick={() => {
              requestDocuments(matterId, selected, message);
              onClose();
            }}
          >
            Send one request
          </Button>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-muted">
        The client receives a single request. Separate emails are not sent for each item.
      </p>
      <ul className="mt-4 space-y-2">
        {candidates.length === 0 ? (
          <li className="text-sm text-muted">Nothing is missing right now.</li>
        ) : (
          candidates.map((item) => (
            <li key={item.id}>
              <label className="flex gap-3 rounded-lg border border-line bg-white px-3 py-2.5 text-sm">
                <input
                  type="checkbox"
                  className="mt-0.5 accent-[#2f6fed]"
                  checked={selected.includes(item.id)}
                  onChange={() => toggle(item.id)}
                />
                <span>
                  <span className="block font-medium">{item.groupLabel ? `${item.groupLabel} · ` : ""}{item.title}</span>
                  <span className="text-xs text-muted">{item.status === "NOT_AVAILABLE" ? "Client says unavailable" : "Missing"}</span>
                </span>
              </label>
            </li>
          ))
        )}
      </ul>
      <div className="mt-4">
        <Field label="Message">
          <textarea className="field min-h-24" value={message} onChange={(event) => setMessage(event.target.value)} />
        </Field>
      </div>
    </Dialog>
  );
}

export function CustomRequestDialog({
  matterId,
  open,
  onClose,
}: {
  matterId: string;
  open: boolean;
  onClose: () => void;
}) {
  const { addCustomRequest } = useStore();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  return (
    <Dialog
      open={open}
      title="Add a request"
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            disabled={!title.trim()}
            onClick={() => {
              addCustomRequest(matterId, title, description);
              setTitle("");
              setDescription("");
              onClose();
            }}
          >
            Add to checklist
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Title" hint="Shown to the client as a checklist item.">
          <input className="field" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Venmo transaction history" />
        </Field>
        <Field label="Description">
          <textarea
            className="field min-h-24"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Please provide Venmo history from January through September 2026."
          />
        </Field>
      </div>
    </Dialog>
  );
}
