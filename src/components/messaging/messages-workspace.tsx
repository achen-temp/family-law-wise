"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  MenuItem,
  Tab,
  Tabs,
  TextField,
} from "@mui/material";
import { LockKeyhole, MessageSquare, Plus, Search } from "lucide-react";
import { PageHeader } from "@/components/ui";
import {
  cn,
  clientParty,
  initials,
  matterTitle,
  personName,
} from "@/lib/format";
import { needsReply, threadMessages, unreadCount } from "@/lib/messaging";
import { useStore } from "@/lib/store";
import type { ConversationRole } from "@/lib/types";
import { Conversation } from "./conversation";

export function MessagesWorkspace({
  role,
  matterId,
}: {
  role: ConversationRole;
  matterId?: string;
}) {
  const store = useStore();
  const router = useRouter();
  const params = useSearchParams();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [creating, setCreating] = useState(false);
  const [newMatter, setNewMatter] = useState(matterId ?? "");
  const [subject, setSubject] = useState("");
  const targetMatter = matterId ?? newMatter;
  const path =
    role === "CLIENT"
      ? `/portal/${matterId}/messages`
      : matterId
        ? `/matters/${matterId}/messages`
        : "/messages";
  const threads = store.state.threads.filter(
    (thread) => !matterId || thread.matterId === matterId,
  );
  const selected = threads.find((thread) => thread.id === params.get("thread"));
  const sorted = [...threads].sort((a, b) =>
    (
      threadMessages(store.state, b.id, role).at(-1)?.createdAt ?? b.createdAt
    ).localeCompare(
      threadMessages(store.state, a.id, role).at(-1)?.createdAt ?? a.createdAt,
    ),
  );
  const filtered = sorted.filter((thread) => {
    const matter = store.state.matters.find(
      (item) => item.id === thread.matterId,
    )!;
    const text = `${thread.subject} ${matter.name} ${matterTitle(matter)} ${threadMessages(
      store.state,
      thread.id,
      role,
    )
      .map((item) => item.body)
      .join(" ")}`;
    return (
      text.toLowerCase().includes(query.toLowerCase()) &&
      (filter !== "unread" ||
        unreadCount(store.state, role, undefined, thread.id) > 0) &&
      (filter !== "reply" || needsReply(store.state, thread.id, role))
    );
  });
  const matter = store.state.matters.find((item) => item.id === matterId);
  if ((matterId && !matter) || (role === "CLIENT" && !matterId))
    return <p className="card p-8">Matter not found.</p>;

  function select(id: string) {
    router.push(`${path}?thread=${encodeURIComponent(id)}`, { scroll: false });
  }
  function create() {
    if (!subject.trim() || !targetMatter) return;
    const id = store.createThread(targetMatter, subject);
    setCreating(false);
    setSubject("");
    setQuery("");
    setFilter("all");
    select(id);
  }

  return (
    <div>
      <div className={selected ? "hidden lg:block" : undefined}>
        <PageHeader
          eyebrow={
            role === "ATTORNEY" ? "Client communications" : "Your legal team"
          }
          title="Messages"
          description={
            matter
              ? `${matterTitle(matter)} · Conversations with ${role === "CLIENT" ? store.state.firm.attorneyName : personName(clientParty(matter))}.`
              : "Conversations, questions, and updates across your matters."
          }
          actions={
            <Button
              variant="contained"
              startIcon={<Plus className="size-4" />}
              onClick={() => setCreating(true)}
            >
              New conversation
            </Button>
          }
        />
      </div>
      <div
        className={cn(
          "mb-4 items-center gap-2 text-xs text-muted",
          selected ? "hidden lg:flex" : "flex",
        )}
      >
        <LockKeyhole className="size-3.5" />
        Frontend demo · sample conversations, no external messages sent.
      </div>
      <div className="grid overflow-hidden rounded-2xl border border-line bg-white shadow-sm lg:h-[min(780px,calc(100dvh-220px))] lg:min-h-[580px] lg:grid-cols-[minmax(260px,340px)_minmax(0,1fr)]">
        <section
          className={cn(
            "min-w-0 flex-col border-line lg:flex lg:border-r",
            selected ? "hidden" : "flex",
          )}
          aria-label="Inbox"
        >
          <div className="p-5 pb-0">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">Inbox</h2>
              <span className="text-xs text-muted">
                {threads.length} threads
              </span>
            </div>
            <TextField
              label="Search conversations"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search className="size-4" />
                    </InputAdornment>
                  ),
                },
              }}
            />
            <Tabs
              value={filter}
              onChange={(_, value: string) => setFilter(value)}
              variant="fullWidth"
              aria-label="Conversation filters"
              className="mt-3"
            >
              <Tab value="all" label="All" className="min-w-0 px-1" />
              <Tab value="unread" label="Unread" className="min-w-0 px-1" />
              <Tab value="reply" label="Needs reply" className="min-w-0 px-1" />
            </Tabs>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {filtered.length === 0 ? (
              <div className="p-8 text-center">
                <MessageSquare className="mx-auto mb-3 size-7 text-muted" />
                <p className="text-sm font-medium">
                  {threads.length
                    ? "No matching conversations"
                    : "No conversations yet"}
                </p>
                <p className="mt-2 text-xs text-muted">
                  {threads.length
                    ? "Try another search or filter."
                    : "Start a conversation for this matter."}
                </p>
              </div>
            ) : (
              filtered.map((thread) => {
                const threadMatter = store.state.matters.find(
                  (item) => item.id === thread.matterId,
                )!;
                const name =
                  role === "ATTORNEY"
                    ? personName(clientParty(threadMatter))
                    : store.state.firm.attorneyName;
                const last = threadMessages(store.state, thread.id, role).at(
                  -1,
                );
                const unread = unreadCount(
                  store.state,
                  role,
                  undefined,
                  thread.id,
                );
                return (
                  <button
                    key={thread.id}
                    type="button"
                    onClick={() => select(thread.id)}
                    aria-current={
                      selected?.id === thread.id ? "true" : undefined
                    }
                    className={cn(
                      "flex w-full gap-3 rounded-xl border-b border-line p-3 text-left transition-colors",
                      selected?.id === thread.id
                        ? "bg-brand-soft"
                        : "hover:bg-slate-50",
                    )}
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-semibold text-brand">
                      {initials(name)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-semibold">
                          {name}
                        </span>
                        {unread > 0 && (
                          <span
                            aria-label={`${unread} unread messages`}
                            className="rounded-full bg-brand px-1.5 py-0.5 text-[10px] text-white"
                          >
                            {unread}
                          </span>
                        )}
                      </span>
                      <span className="mt-1 block truncate text-xs text-muted">
                        {thread.subject}
                      </span>
                      <span className="mt-2 block truncate text-xs">
                        {last?.audience === "INTERNAL" ? "Internal note: " : ""}
                        {last?.body ?? "Start the conversation"}
                      </span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
          <p className="border-t border-line p-4 text-xs text-muted">
            Messages stay with their matter and topic.
          </p>
        </section>
        <div
          className={cn(
            "min-h-0 min-w-0",
            selected
              ? "h-[calc(100dvh-120px)] min-h-[420px] lg:h-full lg:min-h-0"
              : "hidden lg:block",
          )}
        >
          {selected ? (
            <Conversation
              key={`${role}:${selected.id}`}
              thread={selected}
              role={role}
              onBack={() => router.push(path, { scroll: false })}
            />
          ) : (
            <div className="grid h-full place-items-center p-10 text-center">
              <div>
                <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-brand-soft text-brand">
                  <MessageSquare className="size-7" />
                </span>
                <h2 className="mt-5 text-lg font-semibold">
                  A place for every conversation
                </h2>
                <p className="mt-2 max-w-xs text-sm leading-6 text-muted">
                  Choose a thread to read updates, reply, or link a document.
                </p>
                {params.has("thread") && (
                  <p role="status" className="mt-3 text-sm text-amber-800">
                    This conversation is not available in this matter.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      <Dialog
        open={creating}
        onClose={() => setCreating(false)}
        fullWidth
        maxWidth="sm"
        aria-labelledby="new-conversation-title"
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            create();
          }}
        >
          <DialogTitle id="new-conversation-title">
            New conversation
          </DialogTitle>
          <DialogContent className="space-y-5 pt-3">
            {!matterId && (
              <TextField
                select
                label="Matter"
                value={newMatter}
                onChange={(event) => setNewMatter(event.target.value)}
                required
              >
                {store.state.matters.map((item) => (
                  <MenuItem key={item.id} value={item.id}>
                    {matterTitle(item)}
                  </MenuItem>
                ))}
              </TextField>
            )}
            <TextField
              autoFocus
              label="Topic"
              placeholder="e.g. Bank records"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              slotProps={{ htmlInput: { maxLength: 100 } }}
              required
            />
            <p className="text-sm text-muted">
              Shared messages will appear in both the attorney and client views.
            </p>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreating(false)}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={!targetMatter || !subject.trim()}
            >
              Create conversation
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </div>
  );
}
