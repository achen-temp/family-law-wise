"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useEffect, useState } from "react";
import {
  Button,
  Chip,
  Drawer,
  IconButton,
  MenuItem,
  Tab,
  Tabs,
  TextField,
} from "@mui/material";
import { ArrowRight, MessageSquare, Send, Sparkles, X } from "lucide-react";
import { matterTitle } from "@/lib/format";
import { draftKey } from "@/lib/messaging";
import { useStore } from "@/lib/store";
import { generalAnswer, nextSteps } from "@/lib/wise-ai";
import type { ConversationRole } from "@/lib/types";

export function WiseAi({
  role,
  matterId,
}: {
  role: ConversationRole;
  matterId?: string;
}) {
  const { state } = useStore();
  const [open, setOpen] = useState(false);
  const [chosen, setChosen] = useState("");
  const selectedId = matterId ?? chosen;
  const selectedMatter = state.matters.find((matter) => matter.id === selectedId);
  return (
    <>
      <Button
        fullWidth
        startIcon={<Sparkles className="size-4" />}
        onClick={() => setOpen(true)}
        className="!min-h-10 !justify-start !rounded-lg !border !border-primary/60 !bg-primary !px-3 !py-2 !text-sm !font-semibold !text-white hover:!bg-primary-hover"
      >
        Ask Wise AI
      </Button>
      <Drawer
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        slotProps={{
          paper: {
            sx: {
              width: "min(520px, 100vw)",
              maxWidth: "none",
              height: "100dvh",
              maxHeight: "100dvh",
              m: 0,
              borderRadius: { xs: 0, sm: "12px 0 0 12px" },
              overflow: "hidden",
              boxShadow: "-16px 0 48px #20292729",
            },
          },
        }}
      >
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="wise-title"
          className="flex h-full min-h-0 flex-col bg-white"
        >
          <header className="flex shrink-0 items-center gap-3 border-b border-line px-5 py-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary text-white">
              <Sparkles aria-hidden="true" className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 id="wise-title" className="text-base font-semibold">
                Wise AI
              </h2>
              <p className="truncate text-xs text-muted">
                {selectedMatter ? matterTitle(selectedMatter) : "Guidance for your next step"}
              </p>
            </div>
            <IconButton
              aria-label="Close Wise AI"
              onClick={() => setOpen(false)}
            >
              <X className="size-5" />
            </IconButton>
          </header>
          {!matterId && (
            <div className="shrink-0 border-b border-line px-5 py-3">
              <TextField
                select
                label="Matter context"
                value={chosen}
                onChange={(event) => setChosen(event.target.value)}
                size="small"
                fullWidth
              >
                <MenuItem value="">Choose a matter</MenuItem>
                {state.matters.map((matter) => (
                  <MenuItem key={matter.id} value={matter.id}>
                    {matterTitle(matter)}
                  </MenuItem>
                ))}
              </TextField>
            </div>
          )}
          {selectedMatter ? (
            <AssistantSession
              key={`${role}:${selectedId}`}
              role={role}
              matterId={selectedId}
              onClose={() => setOpen(false)}
            />
          ) : (
            <div className="grid min-h-0 flex-1 place-items-center p-8 text-center">
              <Sparkles className="mx-auto mb-4 size-9 text-brand" />
              <h3 className="font-semibold">Start with a matter</h3>
              <p className="mt-2 text-sm leading-6 text-muted">
                Choose a matter to see relevant next steps and keep questions in
                the right context.
              </p>
            </div>
          )}
        </section>
      </Drawer>
    </>
  );
}

type Turn = { id: number; question: string; answer?: string };
function AssistantSession({
  role,
  matterId,
  onClose,
}: {
  role: ConversationRole;
  matterId: string;
  onClose: () => void;
}) {
  const store = useStore();
  const router = useRouter();
  const [topic, setTopic] = useState<"next" | "general">("next");
  const [questions, setQuestions] = useState({ next: "", general: "" });
  const [turns, setTurns] = useState<{ next: Turn[]; general: Turn[] }>({
    next: [],
    general: [],
  });
  const content = useRef<HTMLDivElement>(null);
  const matter = store.state.matters.find((item) => item.id === matterId)!;
  const steps = nextSteps(store.state, matterId, role);
  const value = questions[topic];
  useEffect(() => {
    if (content.current)
      content.current.scrollTop = turns[topic].length
        ? content.current.scrollHeight
        : 0;
  }, [turns, topic]);

  function ask(question: string) {
    const clean = question.trim();
    if (!clean || clean.length > 2000) return;
    setTurns((current) => ({
      ...current,
      [topic]: [
        ...current[topic],
        {
          id: Date.now(),
          question: clean,
          answer: topic === "general" ? generalAnswer(clean) : undefined,
        },
      ],
    }));
    setQuestions((current) => ({ ...current, [topic]: "" }));
  }
  function handoff(question: string) {
    let thread = store.state.threads.find(
      (item) =>
        item.matterId === matterId && item.subject === "General updates",
    );
    if (!thread) {
      const id = store.createThread(matterId, "General updates");
      thread = { id, matterId, subject: "General updates", createdAt: "" };
    }
    const existing = store.state.messageDrafts[draftKey(thread.id, role)];
    const body = existing?.body ? `${existing.body}\n\n${question}` : question;
    store.saveMessageDraft(thread.id, role, "SHARED", { ...existing, body });
    onClose();
    router.push(
      `${role === "CLIENT" ? `/portal/${matterId}` : `/matters/${matterId}`}/messages?thread=${encodeURIComponent(thread.id)}`,
    );
  }
  const nextCards = (
    <div className="space-y-3">
      {steps.map((step, index) => (
        <div
          key={step.id}
          className="rounded-xl border border-line bg-white p-4"
        >
          <div className="flex items-start gap-3">
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-soft text-xs font-semibold text-brand">
              {index + 1}
            </span>
            <div>
              <h3 className="text-sm font-semibold">{step.title}</h3>
              <p className="mt-1 text-sm leading-6 text-muted">{step.detail}</p>
            </div>
          </div>
          <Button
            component={Link}
            href={step.href}
            onClick={onClose}
            size="small"
            className="mt-3"
            endIcon={<ArrowRight className="size-4" />}
          >
            {step.label}
          </Button>
        </div>
      ))}
    </div>
  );

  return (
    <>
      <div className="shrink-0 border-b border-line px-5 pt-3">
        <div className="mb-1 flex min-w-0 items-center justify-between gap-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Matter context</p>
          <span className="max-w-[70%] truncate text-right text-xs font-medium" title={matterTitle(matter)}>{matterTitle(matter)}</span>
        </div>
        <Tabs
          value={topic}
          onChange={(_, value: "next" | "general") => setTopic(value)}
          variant="fullWidth"
          aria-label="Wise AI topics"
          className="min-h-11"
          sx={{
            minHeight: 44,
            "& .MuiTab-root": { minHeight: 44, textTransform: "none", fontWeight: 600, fontSize: 13 },
            "& .MuiTabs-indicator": { height: 2, backgroundColor: "var(--primary)" },
          }}
        >
          <Tab label="Next steps" value="next" />
          <Tab label="General questions" value="general" />
        </Tabs>
      </div>
      <div
        ref={content}
        className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-surface-subtle p-5"
        aria-live="polite"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-brand" />
          <span className="text-xs font-semibold text-primary">Wise AI</span>
          <Chip
            label="Demo responses"
            size="small"
            className="h-5 text-[10px]"
          />
        </div>
        {topic === "next" && (
          <>
            <p className="text-sm leading-6 text-muted">
              Your next steps, based on the current matter. This list updates
              when your checklist or messages change.
            </p>
            {nextCards}
              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted">Suggested question</p>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => ask("What should I do next?")}
                  className="!rounded-lg !border-line !bg-white !text-primary hover:!border-primary"
                >
                  What should I do next?
                </Button>
              </div>
          </>
        )}
        {topic === "general" && (
          <>
            <p className="text-sm leading-6 text-muted">
              Ask about using your portal. For advice about your case, contact
              your attorney.
            </p>
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted">Suggested questions</p>
              <div className="flex flex-wrap gap-2">
              {[
                "How does document review work?",
                "What if I cannot get a file?",
                "Can you advise on my case?",
              ].map((question) => (
                <Button
                  key={question}
                  size="small"
                  variant="outlined"
                  className="!rounded-lg !border-line !bg-white !text-left !text-primary hover:!border-primary"
                  onClick={() => ask(question)}
                >
                  {question}
                </Button>
              ))}
              </div>
            </div>
          </>
        )}
        {turns[topic].map((turn) => (
          <div key={turn.id} className="space-y-3">
            <p className="ml-8 whitespace-pre-wrap break-words rounded-xl bg-brand-soft p-3 text-sm [overflow-wrap:anywhere]">
              {turn.question}
            </p>
            <div className="rounded-xl border border-line bg-white p-4">
              <p className="mb-2 text-xs font-semibold text-brand">
                Wise AI · Example response
              </p>
              <p className="text-sm leading-6">
                {turn.answer ??
                  `There ${steps.length === 1 ? "is 1 next step" : `are ${steps.length} next steps`} above for this matter. Start with “${steps[0]?.title ?? "Review your checklist"}”. These suggestions follow your current demo state.`}
              </p>
              <Button
                size="small"
                variant="outlined"
                color="inherit"
                className="!mt-3 !rounded-lg !border-line !text-muted hover:!border-primary hover:!bg-primary-soft hover:!text-primary"
                startIcon={<MessageSquare className="size-4" />}
                onClick={() => handoff(turn.question)}
              >
                {role === "CLIENT"
                  ? "Ask my attorney in Messages"
                  : "Draft a client message"}
              </Button>
              <p className="mt-1.5 text-[11px] leading-4 text-muted">Opens a message draft for your review. Nothing is sent automatically.</p>
            </div>
          </div>
        ))}
      </div>
      <form
        className="shrink-0 border-t border-line bg-white p-4 shadow-[0_-8px_20px_#2029270a] sm:p-5"
        onSubmit={(event) => {
          event.preventDefault();
          ask(value);
        }}
      >
        <TextField
          label={
            topic === "next"
              ? "Ask about your next step"
              : "Ask a general question"
          }
          multiline
          minRows={2}
          maxRows={3}
          value={value}
          fullWidth
          size="small"
          onChange={(event) =>
            setQuestions((current) => ({
              ...current,
              [topic]: event.target.value,
            }))
          }
          slotProps={{ htmlInput: { maxLength: 2000 } }}
        />
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="min-w-0 text-[11px] leading-4 text-muted">Example guidance only · review before sending</p>
          <Button
            type="submit"
            variant="contained"
            className="!shrink-0 !bg-primary hover:!bg-primary-hover"
            disabled={!value.trim() || value.length > 2000}
            endIcon={<Send className="size-4" />}
          >
            Ask Wise AI
          </Button>
        </div>
        <p className="mt-2 text-[10px] leading-4 text-muted">
          Frontend demo · preset replies, no model connected. General
          information, not legal advice. Messages to your attorney are reviewed
          by you before sending.
        </p>
      </form>
    </>
  );
}
