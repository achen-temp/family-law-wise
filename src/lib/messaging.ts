import type {
  ConversationRole,
  Message,
  MessageAudience,
  MessageDraft,
  MessageThread,
  State,
} from "./types";

export const MAX_MESSAGE_LENGTH = 4000;
export function draftKey(
  threadId: string,
  role: ConversationRole,
  audience: MessageAudience = "SHARED",
) {
  return `${role}:${threadId}:${audience}`;
}
export function threadMessages(
  state: State,
  threadId: string,
  role: ConversationRole,
) {
  return state.messages.filter(
    (message) =>
      message.threadId === threadId &&
      (role === "ATTORNEY" || message.audience === "SHARED"),
  );
}
export function unreadCount(
  state: State,
  role: ConversationRole,
  matterId?: string,
  threadId?: string,
) {
  const ids = new Set(
    state.threads
      .filter(
        (thread) =>
          (!matterId || thread.matterId === matterId) &&
          (!threadId || thread.id === threadId),
      )
      .map((thread) => thread.id),
  );
  return state.messages.filter(
    (message) =>
      ids.has(message.threadId) &&
      message.audience === "SHARED" &&
      message.authorRole !== role &&
      !message.readBy.includes(role),
  ).length;
}
export function needsReply(
  state: State,
  threadId: string,
  role: ConversationRole,
) {
  const last = state.messages
    .filter(
      (message) =>
        message.threadId === threadId && message.audience === "SHARED",
    )
    .at(-1);
  return !!last && last.authorRole !== role;
}
export type MessagingAction =
  | { type: "CREATE_THREAD"; thread: MessageThread }
  | { type: "SEND_MESSAGE"; message: Message }
  | { type: "READ_THREAD"; threadId: string; role: ConversationRole }
  | {
      type: "SAVE_MESSAGE_DRAFT";
      threadId: string;
      role: ConversationRole;
      audience: MessageAudience;
      draft: MessageDraft;
    };

// Frontend demo rules, not a substitute for server-side authorization.
export function messagingReducer(state: State, action: MessagingAction): State {
  if (action.type === "CREATE_THREAD") {
    if (
      !state.matters.some((matter) => matter.id === action.thread.matterId) ||
      !action.thread.subject.trim() ||
      state.threads.some((thread) => thread.id === action.thread.id)
    )
      return state;
    return {
      ...state,
      threads: [
        ...state.threads,
        {
          ...action.thread,
          subject: action.thread.subject.trim().slice(0, 100),
        },
      ],
    };
  }
  if (action.type === "READ_THREAD") {
    let changed = false;
    const messages = state.messages.map((message) => {
      if (
        message.threadId !== action.threadId ||
        message.audience !== "SHARED" ||
        message.readBy.includes(action.role)
      )
        return message;
      changed = true;
      return { ...message, readBy: [...message.readBy, action.role] };
    });
    return changed ? { ...state, messages } : state;
  }
  const threadId =
    action.type === "SEND_MESSAGE" ? action.message.threadId : action.threadId;
  const thread = state.threads.find((item) => item.id === threadId);
  if (!thread) return state;
  if (action.type === "SAVE_MESSAGE_DRAFT") {
    if (action.role === "CLIENT" && action.audience === "INTERNAL")
      return state;
    return {
      ...state,
      messageDrafts: {
        ...state.messageDrafts,
        [draftKey(threadId, action.role, action.audience)]: action.draft,
      },
    };
  }
  const message = action.message;
  const body = message.body.trim();
  if (
    !body ||
    body.length > MAX_MESSAGE_LENGTH ||
    (message.authorRole === "CLIENT" && message.audience === "INTERNAL")
  )
    return state;
  if (state.messages.some((item) => item.id === message.id)) return state;
  if (
    message.documentId &&
    !state.documents.some(
      (doc) =>
        doc.id === message.documentId && doc.matterId === thread.matterId,
    )
  )
    return state;
  return {
    ...state,
    messages: [
      ...state.messages,
      { ...message, body, readBy: [message.authorRole] },
    ],
    messageDrafts: {
      ...state.messageDrafts,
      [draftKey(threadId, message.authorRole, message.audience)]: { body: "" },
    },
  };
}
