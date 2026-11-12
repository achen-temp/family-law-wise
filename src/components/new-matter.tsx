"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Alert, Box, Button, Divider, Paper, TextField, Typography } from "@mui/material";
import { PageHeader } from "@/components/ui";
import { useStore } from "@/lib/store";
import { validEmail } from "@/lib/workspace-validation";

const EMPTY_FIELDS = {
  clientFirst: "", clientLast: "", clientEmail: "",
  otherFirst: "", otherLast: "", county: "", matterName: "",
};
type FieldName = keyof typeof EMPTY_FIELDS;
const REQUIRED_FIELDS = {
  clientFirst: "client first name", clientLast: "client last name", clientEmail: "client email address",
  otherFirst: "other party first name", otherLast: "other party last name", county: "county",
} as const;
const twoColumns = { display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))" }, gap: 3 };

export function NewMatterForm() {
  const router = useRouter();
  const { createMatter } = useStore();
  const [fields, setFields] = useState(EMPTY_FIELDS);
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: Partial<Record<FieldName, string>> = {};
    for (const name of Object.keys(REQUIRED_FIELDS) as (keyof typeof REQUIRED_FIELDS)[]) {
      if (!fields[name].trim()) nextErrors[name] = `Enter the ${REQUIRED_FIELDS[name]}.`;
      else if (name === "clientEmail" && !validEmail(fields[name])) nextErrors[name] = "Enter a valid client email address.";
    }
    setErrors(nextErrors);
    const firstInvalid = Object.keys(nextErrors)[0];
    if (firstInvalid) {
      (event.currentTarget.elements.namedItem(firstInvalid) as HTMLInputElement)?.focus();
      return;
    }
    const id = createMatter({
      clientFirst: fields.clientFirst.trim(), clientLast: fields.clientLast.trim(), clientEmail: fields.clientEmail.trim(),
      otherFirst: fields.otherFirst.trim(), otherLast: fields.otherLast.trim(),
      state: "NJ", county: fields.county.trim(), matterType: "Divorce", matterName: fields.matterName.trim(),
    });
    router.push(`/matters/${id}`);
  }

  function field(name: FieldName, label: string, helperText?: string) {
    return <TextField
      id={`new-matter-${name}`} name={name} label={label} value={fields[name]}
      required={name !== "matterName"} type={name === "clientEmail" ? "email" : "text"}
      autoComplete={name === "clientEmail" ? "email" : "off"}
      error={Boolean(errors[name])} helperText={errors[name] || helperText}
      onChange={(event) => {
        setFields((current) => ({ ...current, [name]: event.target.value }));
        setErrors((current) => ({ ...current, [name]: undefined }));
      }}
      slotProps={{ inputLabel: { shrink: true } }}
    />;
  }

  return (
    <div>
      <PageHeader eyebrow="Matters" title="New matter" description="Set up a client and a New Jersey divorce matter for financial disclosure collection." />
      <Paper component="form" variant="outlined" onSubmit={submit} noValidate sx={{ maxWidth: 760, overflow: "hidden" }}>
        <Box component="section" aria-labelledby="new-matter-client" sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography component="h2" variant="h2" id="new-matter-client">Client</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 3 }}>The client you will invite to provide financial information. Fields marked * are required.</Typography>
          <Box sx={twoColumns}>
            {field("clientFirst", "Client first name")}
            {field("clientLast", "Client last name")}
            <Box sx={{ gridColumn: "1 / -1" }}>{field("clientEmail", "Client email", "Used to prepare the demo invitation. No email is sent.")}</Box>
          </Box>
        </Box>
        <Divider />
        <Box component="section" aria-labelledby="new-matter-other" sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography component="h2" variant="h2" id="new-matter-other">Other party</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 3 }}>Record the other party’s name as matter information.</Typography>
          <Box sx={twoColumns}>
            {field("otherFirst", "Other party first name")}
            {field("otherLast", "Other party last name")}
          </Box>
        </Box>
        <Divider />
        <Box component="section" aria-labelledby="new-matter-details" sx={{ p: { xs: 2, sm: 3 }, display: "grid", gap: 3 }}>
          <Typography component="h2" variant="h2" id="new-matter-details">Matter details</Typography>
          <Box sx={twoColumns}>
            <TextField id="new-matter-state" label="State" value="New Jersey" slotProps={{ input: { readOnly: true }, inputLabel: { shrink: true } }} />
            {field("county", "County")}
          </Box>
          <TextField id="new-matter-type" label="Matter type" value="Divorce" slotProps={{ input: { readOnly: true }, inputLabel: { shrink: true } }} />
          <Box sx={{ display: "grid", gap: 1.5 }}>
            <TextField id="new-matter-template" label="Template" value="NJ Divorce Financial Disclosure" slotProps={{ input: { readOnly: true }, inputLabel: { shrink: true } }} />
            <Alert severity="info" icon={false}>This pilot supports New Jersey divorce matters only. Other states and matter types are not available.</Alert>
          </Box>
          {field("matterName", "Matter name (optional)", "Leave blank to use the parties’ names.")}
          {Object.values(errors).some(Boolean) ? <Alert severity="error">Review the highlighted fields before creating the matter.</Alert> : null}
        </Box>
        <Divider />
        <Box sx={{ display: "flex", justifyContent: "flex-end", flexWrap: "wrap", gap: 1.5, px: { xs: 2, sm: 3 }, py: 2, bgcolor: "var(--surface-subtle)" }}>
          <Button type="button" variant="outlined" onClick={() => router.push("/matters")}>Cancel</Button>
          <Button type="submit" variant="contained">Create matter</Button>
        </Box>
      </Paper>
    </div>
  );
}
