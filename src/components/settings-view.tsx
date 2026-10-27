"use client";

import { useState } from "react";
import { Button, Field, PageHeader } from "@/components/ui";
import { useStore } from "@/lib/store";
import { firmDetailsError, reminderScheduleError, validEmail } from "@/lib/workspace-validation";

export function SettingsView() {
  const { state, updateFirm } = useStore();
  const firm = state.firm;
  const [firmError, setFirmError] = useState("");
  const [scheduleError, setScheduleError] = useState("");
  const [firmSaved, setFirmSaved] = useState(false);
  const [scheduleSaved, setScheduleSaved] = useState(false);

  return (
    <div>
      <PageHeader
        eyebrow="Firm"
        title="Settings"
        description="Edit firm details and the preview reminder schedule. Changes last for this preview session; no reminders or emails are sent."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <form
          className="card space-y-4 p-5"
          noValidate
          onChange={() => { setFirmError(""); setFirmSaved(false); }}
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            const name = String(data.get("name") ?? "").trim();
            const attorneyName = String(data.get("attorneyName") ?? "").trim();
            const attorneyEmail = String(data.get("attorneyEmail") ?? "").trim();
            const error = firmDetailsError(name, attorneyName, attorneyEmail);
            setFirmError(error);
            setFirmSaved(false);
            if (error) {
              const field = !name ? "name" : !attorneyName ? "attorneyName" : !validEmail(attorneyEmail) ? "attorneyEmail" : "name";
              (event.currentTarget.elements.namedItem(field) as HTMLInputElement)?.focus();
              return;
            }
            updateFirm({ name, attorneyName, attorneyEmail });
            for (const [field, value] of Object.entries({ name, attorneyName, attorneyEmail })) {
              (event.currentTarget.elements.namedItem(field) as HTMLInputElement).value = value;
            }
            setFirmSaved(true);
          }}
        >
          <h2 className="text-sm font-semibold">Firm</h2>
          <Field label="Firm name">
            <input className="field" name="name" required defaultValue={firm.name} aria-describedby={firmError ? "firm-error" : undefined} />
          </Field>
          <Field label="Attorney name">
            <input className="field" name="attorneyName" required defaultValue={firm.attorneyName} aria-describedby={firmError ? "firm-error" : undefined} />
          </Field>
          <Field label="Attorney email">
            <input className="field" name="attorneyEmail" type="email" required defaultValue={firm.attorneyEmail} aria-describedby={firmError ? "firm-error" : undefined} />
          </Field>
          {firmError ? <p id="firm-error" role="alert" className="text-sm text-rose-800">{firmError}</p> : null}
          {firmSaved ? <p role="status" className="text-sm text-emerald-800">Saved for this preview session. Refresh resets changes.</p> : null}
          <div className="flex justify-end">
            <Button type="submit" variant="primary">
              Save
            </Button>
          </div>
        </form>
        <form
          className="card space-y-4 p-5"
          noValidate
          onChange={() => { setScheduleError(""); setScheduleSaved(false); }}
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            const first = String(data.get("first") ?? "");
            const second = String(data.get("second") ?? "");
            const alert = String(data.get("alert") ?? "");
            const error = reminderScheduleError(first, second, alert);
            setScheduleError(error);
            setScheduleSaved(false);
            if (error) {
              const fields = ["first", "second", "alert"];
              const values = [first, second, alert];
              const invalid = values.findIndex((value) => !value.trim() || !Number.isSafeInteger(Number(value)) || Number(value) < 1);
              const field = invalid >= 0 ? fields[invalid] : Number(first) >= Number(second) ? "second" : "alert";
              (event.currentTarget.elements.namedItem(field) as HTMLInputElement)?.focus();
              return;
            }
            updateFirm({ firstReminderDays: Number(first), secondReminderDays: Number(second), attorneyAlertDays: Number(alert) });
            setScheduleSaved(true);
          }}
        >
          <h2 className="text-sm font-semibold">Reminder defaults</h2>
          <p className="text-sm leading-relaxed text-muted">
            Preview schedule only: set days after a request for the first reminder, second reminder, and attorney alert, in that order. No notifications are sent.
          </p>
          <Field label="First reminder (days after request)">
            <input className="field" name="first" type="number" min={1} step={1} required defaultValue={firm.firstReminderDays} aria-describedby={scheduleError ? "schedule-error" : undefined} />
          </Field>
          <Field label="Second reminder (days)">
            <input className="field" name="second" type="number" min={1} step={1} required defaultValue={firm.secondReminderDays} aria-describedby={scheduleError ? "schedule-error" : undefined} />
          </Field>
          <Field label="Attorney alert (days)">
            <input className="field" name="alert" type="number" min={1} step={1} required defaultValue={firm.attorneyAlertDays} aria-describedby={scheduleError ? "schedule-error" : undefined} />
          </Field>
          {scheduleError ? <p id="schedule-error" role="alert" className="text-sm text-rose-800">{scheduleError}</p> : null}
          {scheduleSaved ? <p role="status" className="text-sm text-emerald-800">Saved for this preview session. Refresh resets changes.</p> : null}
          <div className="flex justify-end">
            <Button type="submit" variant="primary">
              Save schedule
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
