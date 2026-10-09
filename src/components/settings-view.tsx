"use client";

import { Button, Field, PageHeader } from "@/components/ui";
import { useStore } from "@/lib/store";

export function SettingsView() {
  const { state, updateFirm } = useStore();
  const firm = state.firm;

  return (
    <div>
      <PageHeader
        eyebrow="Firm"
        title="Settings"
        description="Firm name, the attorney on the file, and the default reminder spacing. This preview stores the schedule only."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <form
          className="card space-y-4 p-5"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            updateFirm({
              name: String(data.get("name") ?? ""),
              attorneyName: String(data.get("attorneyName") ?? ""),
              attorneyEmail: String(data.get("attorneyEmail") ?? ""),
            });
          }}
        >
          <h2 className="text-sm font-semibold">Firm</h2>
          <Field label="Firm name">
            <input className="field" name="name" defaultValue={firm.name} />
          </Field>
          <Field label="Attorney name">
            <input className="field" name="attorneyName" defaultValue={firm.attorneyName} />
          </Field>
          <Field label="Attorney email">
            <input className="field" name="attorneyEmail" type="email" defaultValue={firm.attorneyEmail} />
          </Field>
          <div className="flex justify-end">
            <Button type="submit" variant="primary">
              Save
            </Button>
          </div>
        </form>
        <form
          className="card space-y-4 p-5"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            updateFirm({
              firstReminderDays: Number(data.get("first")),
              secondReminderDays: Number(data.get("second")),
              attorneyAlertDays: Number(data.get("alert")),
            });
          }}
        >
          <h2 className="text-sm font-semibold">Reminder defaults</h2>
          <p className="text-sm leading-relaxed text-muted">
            After a request is sent, the first reminder goes out, then a second, then the attorney is alerted. One request, not one email per document.
          </p>
          <Field label="First reminder (days after request)">
            <input className="field" name="first" type="number" min={1} defaultValue={firm.firstReminderDays} />
          </Field>
          <Field label="Second reminder (days)">
            <input className="field" name="second" type="number" min={1} defaultValue={firm.secondReminderDays} />
          </Field>
          <Field label="Attorney alert (days)">
            <input className="field" name="alert" type="number" min={1} defaultValue={firm.attorneyAlertDays} />
          </Field>
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
