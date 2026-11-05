import assert from "node:assert/strict";
import test from "node:test";
import { initialState } from "../src/lib/seed";
import {
  draftKey,
  messagingReducer,
  needsReply,
  threadMessages,
  unreadCount,
} from "../src/lib/messaging";
import { nextSteps } from "../src/lib/wise-ai";
import type { Message, State } from "../src/lib/types";

const fresh = (): State => structuredClone(initialState);
const message = (patch: Partial<Message> = {}): Message => ({
  id: "test-message",
  threadId: "thread-john-general",
  authorRole: "ATTORNEY",
  authorName: "Alex Morgan",
  audience: "SHARED",
  body: "A sample reply",
  createdAt: "2026-10-25T12:00:00Z",
  readBy: [],
  ...patch,
});

test("shared replies appear in both views and update recipient unread state", () => {
  const state = fresh();
  const count = unreadCount(state, "CLIENT", "matter-john");
  const next = messagingReducer(state, {
    type: "SEND_MESSAGE",
    message: message(),
  });
  assert.equal(unreadCount(next, "CLIENT", "matter-john"), count + 1);
  assert.equal(
    threadMessages(next, "thread-john-general", "CLIENT").at(-1)?.body,
    "A sample reply",
  );
  assert.equal(
    threadMessages(next, "thread-john-general", "ATTORNEY").at(-1)?.body,
    "A sample reply",
  );
});

test("internal notes never appear in client history, unread counts, or needs-reply logic", () => {
  const state = fresh();
  const next = messagingReducer(state, {
    type: "SEND_MESSAGE",
    message: message({
      threadId: "thread-john-bank",
      audience: "INTERNAL",
      body: "Team only",
    }),
  });
  assert.equal(
    threadMessages(next, "thread-john-bank", "CLIENT").some(
      (item) => item.body === "Team only",
    ),
    false,
  );
  assert.equal(unreadCount(next, "CLIENT"), unreadCount(state, "CLIENT"));
  assert.equal(needsReply(next, "thread-john-bank", "ATTORNEY"), true);
  assert.equal(
    threadMessages(next, "thread-john-bank", "ATTORNEY").at(-1)?.body,
    "Team only",
  );
});

test("reading one thread does not clear another thread or the opposite role's unread messages", () => {
  const state = fresh();
  const otherCount = unreadCount(
    state,
    "ATTORNEY",
    undefined,
    "thread-john-bank",
  );
  const next = messagingReducer(state, {
    type: "READ_THREAD",
    threadId: "thread-john-general",
    role: "ATTORNEY",
  });
  assert.equal(
    unreadCount(next, "ATTORNEY", undefined, "thread-john-general"),
    0,
  );
  assert.equal(
    unreadCount(next, "ATTORNEY", undefined, "thread-john-bank"),
    otherCount,
  );
  assert.equal(unreadCount(next, "CLIENT"), unreadCount(state, "CLIENT"));
});

test("reject blank, oversized, unknown-thread, client-internal and cross-matter file messages", () => {
  const state = fresh();
  const otherFile = state.documents.find(
    (item) => item.matterId === "matter-sarah",
  )!;
  for (const patch of [
    { body: "   " },
    { body: "x".repeat(4001) },
    { threadId: "missing" },
    { authorRole: "CLIENT" as const, audience: "INTERNAL" as const },
    { documentId: otherFile.id },
  ]) {
    assert.equal(
      messagingReducer(state, {
        type: "SEND_MESSAGE",
        message: message(patch),
      }),
      state,
    );
  }
});

test("send keeps the exact linked file and clears only its own composer draft", () => {
  const state = fresh();
  const file = state.documents.find((item) => item.matterId === "matter-john")!;
  const key = draftKey("thread-john-general", "ATTORNEY");
  const internalKey = draftKey("thread-john-general", "ATTORNEY", "INTERNAL");
  state.messageDrafts[key] = { body: "Send this", documentId: file.id };
  state.messageDrafts[internalKey] = { body: "Keep this private draft" };
  const next = messagingReducer(state, {
    type: "SEND_MESSAGE",
    message: message({ documentId: file.id }),
  });
  assert.equal(next.messages.at(-1)?.documentId, file.id);
  assert.equal(next.messageDrafts[key].body, "");
  assert.equal(next.messageDrafts[internalKey].body, "Keep this private draft");
});

test("AI handoff creates an editable draft without sending a message", () => {
  const state = fresh();
  const next = messagingReducer(state, {
    type: "SAVE_MESSAGE_DRAFT",
    threadId: "thread-john-general",
    role: "CLIENT",
    audience: "SHARED",
    draft: { body: "Please explain my next step." },
  });
  assert.equal(next.messages.length, state.messages.length);
  assert.equal(
    next.messageDrafts[draftKey("thread-john-general", "CLIENT")].body,
    "Please explain my next step.",
  );
});

test("new matters can have multiple independent topics", () => {
  let state = fresh();
  for (const id of ["topic-a", "topic-b"])
    state = messagingReducer(state, {
      type: "CREATE_THREAD",
      thread: {
        id,
        matterId: "matter-sarah",
        subject: id,
        createdAt: "2026-10-25T12:00:00Z",
      },
    });
  state = messagingReducer(state, {
    type: "SEND_MESSAGE",
    message: message({ threadId: "topic-a" }),
  });
  assert.equal(threadMessages(state, "topic-b", "CLIENT").length, 0);
  assert.equal(threadMessages(state, "topic-a", "CLIENT").length, 1);
});

test("next steps change when missing requirements are uploaded", () => {
  const state = fresh();
  const step = nextSteps(state, "matter-john", "CLIENT").find((item) =>
    item.id.startsWith("upload-"),
  )!;
  assert.ok(step);
  const id = step.id.slice("upload-".length);
  const next = {
    ...state,
    requirements: state.requirements.map((item) =>
      item.id === id ? { ...item, status: "NEEDS_REVIEW" as const } : item,
    ),
  };
  assert.equal(
    nextSteps(next, "matter-john", "CLIENT").some(
      (item) => item.id === step.id,
    ),
    false,
  );
});

test("attorney next steps point to a real pending file and stop suggesting it after acceptance", () => {
  const state = fresh();
  const step = nextSteps(state, "matter-john", "ATTORNEY").find((item) =>
    item.id.startsWith("review-"),
  )!;
  const doc = state.documents.find((item) => `review-${item.id}` === step.id)!;
  assert.equal(step.href, `/matters/matter-john/documents/${doc.id}`);
  const next = {
    ...state,
    documents: state.documents.map((item) =>
      item.id === doc.id ? { ...item, status: "ACCEPTED" as const } : item,
    ),
  };
  assert.equal(
    nextSteps(next, "matter-john", "ATTORNEY").some(
      (item) => item.id === step.id,
    ),
    false,
  );
});

test("completed matters and unknown matters have appropriate next steps", () => {
  assert.ok(
    nextSteps(fresh(), "matter-sarah", "CLIENT").some(
      (item) => item.id === "complete",
    ),
  );
  assert.deepEqual(nextSteps(fresh(), "unknown", "CLIENT"), []);
});
