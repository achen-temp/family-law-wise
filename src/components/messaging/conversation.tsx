"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button, Chip, MenuItem, Tab, Tabs, TextField } from "@mui/material";
import {
  ArrowLeft,
  LockKeyhole,
  MessageSquare,
  Paperclip,
  Send,
} from "lucide-react";
import {
  cn,
  clientParty,
  initials,
  matterTitle,
  personName,
} from "@/lib/format";
import {
  draftKey,
  MAX_MESSAGE_LENGTH,
  threadMessages,
  unreadCount,
} from "@/lib/messaging";
import { useStore } from "@/lib/store";
import type {
  ConversationRole,
  MessageAudience,
  MessageThread,
} from "@/lib/types";
import { LinkedDocument } from "./linked-document";

export function Conversation({
  thread,
  role,
  onBack,
}: {
  thread: MessageThread;
  role: ConversationRole;
  onBack: () => void;
}) {
  const store = useStore();
  const [audience, setAudience] = useState<MessageAudience>("SHARED");
  const [attachmentOpen, setAttachmentOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const historyRef = useRef<HTMLDivElement>(null);
  const matter = store.state.matters.find(
    (item) => item.id === thread.matterId,
  )!;
  const messages = threadMessages(store.state, thread.id, role);
  const unread = unreadCount(store.state, role, matter.id, thread.id);
  const { readThread } = store;
  useEffect(() => {
    if (unread) readThread(thread.id, role);
  }, [thread.id, role, unread, readThread]);
  useEffect(() => {
    const history = historyRef.current;
    if (history) history.scrollTop = history.scrollHeight;
  }, [messages.length, thread.id]);
  const draft = store.state.messageDrafts[
    draftKey(thread.id, role, audience)
  ] ?? { body: "" };
  const documents = store.state.documents.filter(
    (doc) => doc.matterId === matter.id,
  );
  const client = personName(clientParty(matter));
  const recipient =
    role === "ATTORNEY" ? client : store.state.firm.attorneyName;
  const tooLong = draft.body.length > MAX_MESSAGE_LENGTH;

  function send() {
    if (!draft.body.trim() || tooLong) return;
    store.sendMessage(thread.id, role, audience, draft);
    setAttachmentOpen(false);
    setFeedback(
      audience === "INTERNAL"
        ? "Internal note added."
        : "Message sent in this demo.",
    );
  }

  return (
    <section
      className="flex h-full min-h-0 min-w-0 flex-col bg-white"
      aria-label="Conversation"
    >
      <header className="flex items-start gap-3 border-b border-line p-4 sm:p-5">
        <Button
          className="min-w-0 px-2 lg:hidden"
          aria-label="Back to conversations"
          onClick={onBack}
        >
          <ArrowLeft className="size-5" />
        </Button>
        <span className="hidden size-10 shrink-0 place-items-center rounded-full bg-brand-soft text-sm font-semibold text-brand sm:grid">
          {initials(recipient)}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold">{recipient}</h2>
          <p className="mt-0.5 truncate text-xs text-muted">
            {matterTitle(matter)} · {thread.subject}
          </p>
        </div>
        <Chip
          size="small"
          label={
            role === "ATTORNEY" ? "Client conversation" : "Your legal team"
          }
          className="hidden bg-brand-soft text-brand sm:flex"
        />
      </header>
      <div className="border-b border-line bg-slate-50 px-5 py-2 text-xs text-muted">
        <Link
          className="text-brand hover:underline"
          href={
            role === "ATTORNEY"
              ? `/matters/${matter.id}`
              : `/portal/${matter.id}`
          }
        >
          Open matter
        </Link>
        <span className="mx-2">·</span>
        <Link
          className="hover:underline"
          href={
            role === "ATTORNEY"
              ? `/portal/${matter.id}/messages?thread=${thread.id}`
              : `/matters/${matter.id}/messages?thread=${thread.id}`
          }
        >
          Demo: view as {role === "ATTORNEY" ? "client" : "attorney"}
        </Link>
      </div>
      <div
        ref={historyRef}
        className="min-h-0 flex-1 space-y-5 overflow-y-auto bg-slate-50/50 p-4 sm:p-6"
        role="log"
        aria-label="Message history"
        aria-live="polite"
      >
        {messages.length === 0 && (
          <div className="py-16 text-center">
            <MessageSquare className="mx-auto mb-3 size-8 text-brand" />
            <h3 className="font-medium">Start the conversation</h3>
            <p className="mt-1 text-sm text-muted">
              Keep questions and updates together for this matter.
            </p>
          </div>
        )}
        {messages.map((message) => {
          const own = message.authorRole === role;
          const internal = message.audience === "INTERNAL";
          return (
            <article
              key={message.id}
              className={cn(
                "max-w-[92%] sm:max-w-[82%]",
                own ? "ml-auto" : "mr-auto",
              )}
            >
              <div
                className={cn(
                  "rounded-2xl border p-4",
                  internal
                    ? "border-amber-200 bg-amber-50"
                    : own
                      ? "border-brand/10 bg-brand-soft"
                      : "border-line bg-white",
                )}
              >
                <p className="mb-2 flex flex-wrap items-center gap-2 text-xs font-semibold">
                  {message.authorName}
                  {internal && (
                    <span className="inline-flex items-center gap-1 text-amber-800">
                      <LockKeyhole className="size-3" />
                      Internal note · team only
                    </span>
                  )}
                </p>
                <p className="whitespace-pre-wrap break-words text-sm leading-6 [overflow-wrap:anywhere]">
                  {message.body}
                </p>
                {message.documentId && (
                  <LinkedDocument
                    documentId={message.documentId}
                    matterId={matter.id}
                    role={role}
                  />
                )}
              </div>
              <p
                className={cn(
                  "mt-1.5 text-xs text-muted",
                  own ? "text-right" : "text-left",
                )}
              >
                <time dateTime={message.createdAt}>
                  {new Intl.DateTimeFormat("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                    timeZone: "America/New_York",
                  }).format(new Date(message.createdAt))}{" "}
                  ET
                </time>
                {own &&
                  !internal &&
                  (message.readBy.includes(
                    role === "ATTORNEY" ? "CLIENT" : "ATTORNEY",
                  )
                    ? " · Read"
                    : " · Sent")}
              </p>
            </article>
          );
        })}
      </div>
      <form
        className="border-t border-line p-4 sm:p-5"
        onSubmit={(event) => {
          event.preventDefault();
          send();
        }}
      >
        {role === "ATTORNEY" && (
          <Tabs
            value={audience}
            onChange={(_, value: MessageAudience) => {
              setAudience(value);
              setFeedback("");
            }}
            aria-label="Message visibility"
            className="mb-3 min-h-0"
          >
            <Tab value="SHARED" label="Message client" />
            <Tab
              value="INTERNAL"
              label="Internal note"
              icon={<LockKeyhole className="size-3.5" />}
              iconPosition="start"
            />
          </Tabs>
        )}
        {audience === "INTERNAL" && (
          <p className="mb-3 text-xs text-amber-800">
            Only the legal team can see this note. It will not be sent to the
            client.
          </p>
        )}
        <TextField
          label={
            audience === "INTERNAL" ? "Internal note" : `Message ${recipient}`
          }
          multiline
          minRows={2}
          maxRows={5}
          value={draft.body}
          error={tooLong}
          helperText={
            tooLong
              ? `Keep your message under ${MAX_MESSAGE_LENGTH} characters.`
              : undefined
          }
          onChange={(event) => {
            store.saveMessageDraft(thread.id, role, audience, {
              ...draft,
              body: event.target.value,
            });
            setFeedback("");
          }}
          onKeyDown={(event) => {
            if (
              (event.metaKey || event.ctrlKey) &&
              event.key === "Enter" &&
              !event.nativeEvent.isComposing
            ) {
              event.preventDefault();
              send();
            }
          }}
        />
        {(attachmentOpen || draft.documentId) && (
          <TextField
            className="mt-3"
            select
            label="Link an existing file"
            value={draft.documentId ?? ""}
            onChange={(event) =>
              store.saveMessageDraft(thread.id, role, audience, {
                ...draft,
                documentId: event.target.value || undefined,
              })
            }
          >
            <MenuItem value="">No linked file</MenuItem>
            {documents.map((doc) => (
              <MenuItem
                key={doc.id}
                value={doc.id}
                className="whitespace-normal break-all"
              >
                {doc.filename}
                {doc.status === "REPLACED" ? " (previous version)" : ""}
              </MenuItem>
            ))}
          </TextField>
        )}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <Button
            size="small"
            startIcon={<Paperclip className="size-4" />}
            disabled={!documents.length}
            onClick={() => setAttachmentOpen(!attachmentOpen)}
          >
            {draft.documentId ? "Change linked file" : "Link a file"}
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={!draft.body.trim() || tooLong}
            endIcon={<Send className="size-4" />}
          >
            {audience === "INTERNAL" ? "Add note" : "Send message"}
          </Button>
        </div>
        <p role="status" className="mt-2 min-h-4 text-xs text-muted">
          {feedback || "Demo conversation · kept until this page is refreshed."}
        </p>
      </form>
    </section>
  );
}
