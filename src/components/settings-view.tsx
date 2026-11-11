"use client";

import { useState } from "react";
import { Button, Field } from "@/components/ui";
import { useStore } from "@/lib/store";
import { firmDetailsError, reminderScheduleError, validEmail } from "@/lib/workspace-validation";

export function SettingsView() {
  const { state, updateFirm } = useStore();
  const firm = state.firm;
  const [firmError, setFirmError] = useState("");
  const [scheduleError, setScheduleError] = useState("");
  const [firmSaved, setFirmSaved] = useState(false);
  const [scheduleSaved, setScheduleSaved] = useState(false);
  const [firmDirty, setFirmDirty] = useState(false);
  const [scheduleDirty, setScheduleDirty] = useState(false);

  return (
    <div className="max-w-[1440px]">
      <header className="mb-6 border-b border-line pb-5">
        <h1 className="text-[32px] leading-10 tracking-tight [font-family:var(--font-fraunces)]">Practice settings</h1>
        <p className="mt-2 text-sm text-muted">Your firm’s contact details and default reminder schedule.</p>
      </header>
      <div className="grid items-stretch gap-5 lg:grid-cols-2">
        <form
          className="flex min-w-0 flex-col overflow-hidden rounded-lg border border-line bg-surface"
          aria-labelledby="firm-heading"
          noValidate
          onChange={(event) => {
            setFirmError("");
            setFirmSaved(false);
            const data = new FormData(event.currentTarget);
            setFirmDirty(data.get("name") !== firm.name || data.get("attorneyName") !== firm.attorneyName || data.get("attorneyEmail") !== firm.attorneyEmail);
          }}
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
            setFirmDirty(false);
          }}
        >
          <div className="border-b border-line bg-surface-subtle px-6 py-5">
            <h2 id="firm-heading" className="text-lg font-semibold leading-6">Firm & attorney</h2>
            <p className="mt-1 text-sm text-muted">Contact details used throughout this preview.</p>
          </div>
          <div className="space-y-4 p-6">
            <Field label="Firm name">
              <input className="field" name="name" required defaultValue={firm.name} aria-describedby={firmError ? "firm-error" : undefined} />
            </Field>
            <Field label="Attorney name">
              <input className="field" name="attorneyName" required defaultValue={firm.attorneyName} aria-describedby={firmError ? "firm-error" : undefined} />
            </Field>
            <Field label="Attorney email">
              <input className="field" name="attorneyEmail" type="email" required defaultValue={firm.attorneyEmail} aria-describedby={firmError ? "firm-error" : undefined} />
            </Field>
          </div>
          <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-line px-6 py-4">
            <div className="flex min-h-[44px] min-w-[180px] flex-1 items-center text-sm leading-[21px]">
              {firmDirty && !firmError ? <p className="text-muted">Unsaved changes</p> : null}
              {firmError ? <p id="firm-error" role="alert" className="text-sm text-error-text">{firmError}</p> : null}
              {firmSaved ? <p role="status" className="text-sm text-success-text">Firm details saved for this preview session.</p> : null}
            </div>
            <Button type="submit" variant="primary" className="h-11 shrink-0">
              Save firm details
            </Button>
          </div>
        </form>
        <form
          className="flex min-w-0 flex-col overflow-hidden rounded-lg border border-line bg-surface"
          aria-labelledby="reminder-heading"
          noValidate
          onChange={(event) => {
            setScheduleError("");
            setScheduleSaved(false);
            const data = new FormData(event.currentTarget);
            setScheduleDirty(data.get("first") !== String(firm.firstReminderDays) || data.get("second") !== String(firm.secondReminderDays) || data.get("alert") !== String(firm.attorneyAlertDays));
          }}
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
            setScheduleDirty(false);
          }}
        >
          <div className="border-b border-line bg-surface-subtle px-6 py-5">
            <h2 id="reminder-heading" className="text-lg font-semibold leading-6">Reminder schedule</h2>
            <p className="mt-1 text-sm text-muted">Preview only; no notifications are sent.</p>
          </div>
          <div className="p-6">
            <p id="schedule-hint" className="mb-5 text-sm leading-[21px] text-muted">Days after the original request date. Use positive whole numbers.</p>
            <div className="divide-y divide-line border-y border-line">
              {[
                { name: "first", label: "First reminder", value: firm.firstReminderDays },
                { name: "second", label: "Second reminder", value: firm.secondReminderDays },
                { name: "alert", label: "Attorney alert", value: firm.attorneyAlertDays },
              ].map((step) => (
                <label key={step.name} className="flex items-center justify-between gap-4 py-3">
                  <span className="text-sm font-medium">{step.label}</span>
                  <span className="flex items-center gap-3">
                    <input className="field w-20 text-right" name={step.name} type="number" min={1} step={1} required defaultValue={step.value} aria-describedby={scheduleError ? "schedule-hint schedule-error" : "schedule-hint"} />
                    <span className="text-sm text-muted">days</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
          <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-line px-6 py-4">
            <div className="flex min-h-[44px] min-w-[180px] flex-1 items-center text-sm leading-[21px]">
              {scheduleDirty && !scheduleError ? <p className="text-muted">Unsaved changes</p> : null}
              {scheduleError ? <p id="schedule-error" role="alert" className="text-sm text-error-text">{scheduleError}</p> : null}
              {scheduleSaved ? <p role="status" className="text-sm text-success-text">Reminder defaults saved for this preview session.</p> : null}
            </div>
            <Button type="submit" variant="primary" className="h-11 shrink-0">
              Save schedule
            </Button>
          </div>
        </form>
      </div>
      <p className="mt-5 text-sm text-muted">Preview session only. Saved changes remain while navigating; refreshing resets them. No reminders or emails are sent.</p>
    </div>
  );
}
