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
    <div className="max-w-[760px]">
      <PageHeader
        eyebrow="Firm"
        title="Settings"
        description="Manage firm details and reminder defaults. Changes last for this preview session; refresh resets them. No reminders or emails are sent."
      />
      <div className="overflow-hidden rounded-lg border border-line bg-surface">
        <form
          className="space-y-4 p-6"
          aria-labelledby="firm-heading"
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
          <div>
            <h2 id="firm-heading" className="text-base font-semibold leading-6">Firm</h2>
            <p className="mt-1 text-xs leading-[18px] text-muted">Firm and attorney contact details used in this preview.</p>
          </div>
          <Field label="Firm name">
            <input className="field" name="name" required defaultValue={firm.name} aria-describedby={firmError ? "firm-error" : undefined} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Attorney name">
              <input className="field" name="attorneyName" required defaultValue={firm.attorneyName} aria-describedby={firmError ? "firm-error" : undefined} />
            </Field>
            <Field label="Attorney email">
              <input className="field" name="attorneyEmail" type="email" required defaultValue={firm.attorneyEmail} aria-describedby={firmError ? "firm-error" : undefined} />
            </Field>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
            <div className="min-w-0 flex-1">
              {firmError ? <p id="firm-error" role="alert" className="text-sm text-error-text">{firmError}</p> : null}
              {firmSaved ? <p role="status" className="text-sm text-success-text">Firm details saved for this preview session. Refresh resets changes.</p> : null}
            </div>
            <Button type="submit" variant="primary">
              Save firm details
            </Button>
          </div>
        </form>
        <form
          className="space-y-4 border-t border-line p-6"
          aria-labelledby="reminder-heading"
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
          <div>
            <h2 id="reminder-heading" className="text-base font-semibold leading-6">Reminder defaults</h2>
            <p id="schedule-hint" className="mt-1 text-xs leading-[18px] text-muted">
              All values are days after a request. Use positive whole numbers: first reminder, then second reminder, then attorney alert. Preview only; no notifications are sent.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="First reminder (days)">
              <input className="field" name="first" type="number" min={1} step={1} required defaultValue={firm.firstReminderDays} aria-describedby={scheduleError ? "schedule-hint schedule-error" : "schedule-hint"} />
            </Field>
            <Field label="Second reminder (days)">
              <input className="field" name="second" type="number" min={1} step={1} required defaultValue={firm.secondReminderDays} aria-describedby={scheduleError ? "schedule-hint schedule-error" : "schedule-hint"} />
            </Field>
            <Field label="Attorney alert (days)">
              <input className="field" name="alert" type="number" min={1} step={1} required defaultValue={firm.attorneyAlertDays} aria-describedby={scheduleError ? "schedule-hint schedule-error" : "schedule-hint"} />
            </Field>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
            <div className="min-w-0 flex-1">
              {scheduleError ? <p id="schedule-error" role="alert" className="text-sm text-error-text">{scheduleError}</p> : null}
              {scheduleSaved ? <p role="status" className="text-sm text-success-text">Reminder defaults saved for this preview session. Refresh resets changes.</p> : null}
            </div>
            <Button type="submit" variant="primary">
              Save schedule
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
