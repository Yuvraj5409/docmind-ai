
"use client";

import {
    useState,
    useRef,
    useEffect,
    useCallback,
    type FormEvent,
    type KeyboardEvent,
    type ChangeEvent,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

type Message = {
    role: "user" | "model";
    content: string;
};

type ChatSummary = {
    id: string;
    title: string;
    createdAt: string;
    updatedAt: string;
};

type ChatHistoryResponse = {
    success: boolean;
    chats?: ChatSummary[];
    error?: string;
};

type ChatResponse = {
    success: boolean;
    chatId?: string;
    title?: string;
    reply?: string;
    error?: string;
};

type ConversationResponse = {
    success: boolean;
    chat?: {
        id: string;
        title: string;
        messages: {
            role: "USER" | "ASSISTANT";
            content: string;
        }[];
    };
    error?: string;
};

type ActionResponse = {
    success: boolean;
    error?: string;
};

const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function ChatPage() {
    const { data: session, isPending } = authClient.useSession();
    const router = useRouter();

    const [profileOpen, setProfileOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    // Registered-user chat history
    const [chatHistory, setChatHistory] = useState<ChatSummary[]>([]);
    const [activeChatId, setActiveChatId] = useState<string | null>(null);
    const [openingChatId, setOpeningChatId] = useState<string | null>(null);

    // Rename and delete controls
    const [menuChatId, setMenuChatId] = useState<string | null>(null);
    const [editingChatId, setEditingChatId] = useState<string | null>(null);
    const [editingTitle, setEditingTitle] = useState("");
    const [savingChatId, setSavingChatId] = useState<string | null>(null);
    const [deletingChatId, setDeletingChatId] = useState<string | null>(null);
    const [confirmDeleteChat, setConfirmDeleteChat] =
        useState<ChatSummary | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const userId = session?.user?.id;

    const handleLogout = async () => {
        await authClient.signOut();

        setProfileOpen(false);
        setMessages([]);
        setChatHistory([]);
        setActiveChatId(null);
        setInput("");
        setSelectedFile(null);
        setError("");

        router.push("/");
    };

    // Load saved conversations for registered users
    const loadChatHistory = useCallback(async () => {
        if (!userId) return;

        try {
            const response = await fetch(`${API_URL}/api/chats`, {
                method: "GET",
                credentials: "include",
            });

            const data: ChatHistoryResponse = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || "Unable to load chat history.");
            }

            setChatHistory(data.chats || []);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to load chat history."
            );
        }
    }, [userId]);

    // Load history when a registered user signs in
    useEffect(() => {
        if (isPending || !userId) return;

        void Promise.resolve().then(() => loadChatHistory());
    }, [isPending, userId, loadChatHistory]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loading]);

    // Open a previous conversation
    const openConversation = async (chatId: string) => {
        if (loading || openingChatId || editingChatId) return;

        setOpeningChatId(chatId);
        setError("");
        setMenuChatId(null);
        setSelectedFile(null);

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }

        try {
            const response = await fetch(
                `${API_URL}/api/chats/${encodeURIComponent(chatId)}`,
                {
                    method: "GET",
                    credentials: "include",
                }
            );

            const data: ConversationResponse = await response.json();

            if (!response.ok || !data.success || !data.chat) {
                throw new Error(
                    data.error || "Unable to open this conversation."
                );
            }

            const restoredMessages: Message[] = data.chat.messages.map(
                (message) => ({
                    role: message.role === "USER" ? "user" : "model",
                    content: message.content,
                })
            );

            setMessages(restoredMessages);
            setActiveChatId(data.chat.id);
            setInput("");
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to open this conversation."
            );
        } finally {
            setOpeningChatId(null);
            inputRef.current?.focus();
        }
    };

    // Start a separate conversation without deleting saved chats
    const startNewChat = () => {
        if (loading) return;

        setMessages([]);
        setActiveChatId(null);
        setInput("");
        setError("");
        setSelectedFile(null);
        setMenuChatId(null);
        setEditingChatId(null);
        setConfirmDeleteChat(null);

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }

        inputRef.current?.focus();
    };

    // Begin renaming a conversation
    const beginRename = (chat: ChatSummary) => {
        setEditingChatId(chat.id);
        setEditingTitle(chat.title);
        setMenuChatId(null);
        setError("");
    };

    // Save the new conversation title
    const saveRename = async (chatId: string) => {
        const title = editingTitle.trim();

        if (!title) {
            setError("Conversation title cannot be empty.");
            return;
        }

        if (title.length > 100) {
            setError("Conversation title cannot exceed 100 characters.");
            return;
        }

        setSavingChatId(chatId);
        setError("");

        try {
            const response = await fetch(
                `${API_URL}/api/chats/${encodeURIComponent(chatId)}`,
                {
                    method: "PATCH",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ title }),
                }
            );

            const data: ActionResponse = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || "Unable to rename conversation.");
            }

            setChatHistory((previous) =>
                previous.map((chat) =>
                    chat.id === chatId ? { ...chat, title } : chat
                )
            );

            setEditingChatId(null);
            setEditingTitle("");
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to rename conversation."
            );
        } finally {
            setSavingChatId(null);
        }
    };

    // Delete a conversation after confirmation
    const deleteConversation = async () => {
        if (!confirmDeleteChat) return;

        const chat = confirmDeleteChat;
        setDeletingChatId(chat.id);
        setError("");

        try {
            const response = await fetch(
                `${API_URL}/api/chats/${encodeURIComponent(chat.id)}`,
                {
                    method: "DELETE",
                    credentials: "include",
                }
            );

            const data: ActionResponse = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || "Unable to delete conversation.");
            }

            setChatHistory((previous) =>
                previous.filter((item) => item.id !== chat.id)
            );

            if (activeChatId === chat.id) {
                setMessages([]);
                setActiveChatId(null);
                setInput("");
                setSelectedFile(null);

                if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                }
            }

            setConfirmDeleteChat(null);
            setMenuChatId(null);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to delete conversation."
            );
        } finally {
            setDeletingChatId(null);
        }
    };

    const sendMessage = async (event?: FormEvent) => {
        event?.preventDefault();

        const text = input.trim();

        if (!text || loading) return;

        // Keep the existing 30-message limit for guests
        if (!userId && messages.length + 1 > 30) {
            setError(
                "You've reached the conversation limit. Please start a new chat."
            );
            return;
        }

        const updatedMessages: Message[] = [
            ...messages,
            { role: "user", content: text },
        ];

        setMessages(updatedMessages);
        setInput("");
        setError("");
        setLoading(true);

        try {
            let response: Response;

            // Existing document-analysis flow
            if (selectedFile) {
                const formData = new FormData();
                formData.append("document", selectedFile);
                formData.append("question", text);

                response = await fetch(`${API_URL}/api/document/analyze`, {
                    method: "POST",
                    credentials: "include",
                    body: formData,
                });
            }
            // Registered-user saved conversations
            else if (userId) {
                const endpoint = activeChatId
                    ? `${API_URL}/api/chats/${encodeURIComponent(activeChatId)}/messages`
                    : `${API_URL}/api/chats`;

                response = await fetch(endpoint, {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ message: text }),
                });
            }
            // Existing guest chat — unchanged
            else {
                response = await fetch(`${API_URL}/api/guest-chat`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        messages: updatedMessages,
                    }),
                });
            }

            const data: ChatResponse = await response.json();

            if (
                !response.ok ||
                !data.success ||
                typeof data.reply !== "string"
            ) {
                if (userId && data.chatId) {
                    setActiveChatId(data.chatId);
                    void loadChatHistory();
                }

                throw new Error(
                    data.error || "Unable to get a response. Please try again."
                );
            }

            if (userId && !selectedFile && data.chatId) {
                setActiveChatId(data.chatId);
            }

            setMessages([
                ...updatedMessages,
                { role: "model", content: data.reply },
            ]);

            if (userId && !selectedFile) {
                void loadChatHistory();
            }

            if (selectedFile) {
                setSelectedFile(null);

                if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                }
            }
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Something went wrong. Please try again."
            );
        } finally {
            setLoading(false);
            inputRef.current?.focus();
        }
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
        if (
            event.key === "Enter" &&
            !event.shiftKey &&
            !event.nativeEvent.isComposing
        ) {
            event.preventDefault();
            sendMessage();
        }
    };

    const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];

        if (!file) return;

        const allowedTypes = [
            "application/pdf",
            "image/jpeg",
            "image/png",
        ];

        if (!allowedTypes.includes(file.type)) {
            setError("Please select a PDF, JPG, or PNG file.");
            event.target.value = "";
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            setError("File size must not exceed 10 MB.");
            event.target.value = "";
            return;
        }

        setSelectedFile(file);
        setError("");
    };

    return (
        <main className="flex min-h-screen flex-col bg-[#f8f9fc] text-slate-900">
            {/* Header */}
            <header className="relative z-20 flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5 sm:px-8">
                <Link href="/" className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold text-white">
                        D
                    </div>

                    <span className="text-lg font-semibold tracking-tight">
                        DocMind <span className="text-indigo-600">AI</span>
                    </span>
                </Link>

                <div className="flex items-center gap-3">
                    {isPending ? (
                        <span className="text-sm text-slate-400">
                            Loading...
                        </span>
                    ) : session?.user ? (
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setProfileOpen(!profileOpen)}
                                className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white transition hover:bg-indigo-700"
                                aria-label="Open profile menu"
                            >
                                {(session.user.name || session.user.email || "U")
                                    .charAt(0)
                                    .toUpperCase()}
                            </button>

                            {profileOpen && (
                                <div className="absolute right-0 top-12 z-50 w-64 rounded-xl border border-slate-200 bg-white p-4 shadow-lg">
                                    <p className="truncate text-sm font-semibold text-slate-900">
                                        {session.user.name || "User"}
                                    </p>

                                    <p className="mt-1 truncate text-xs text-slate-500">
                                        {session.user.email}
                                    </p>

                                    <div className="my-3 border-t border-slate-100" />

                                    <button
                                        type="button"
                                        onClick={handleLogout}
                                        className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
                                    >
                                        Log out
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            <Link
                                href="/login"
                                className="text-sm font-medium text-slate-600 transition hover:text-indigo-600"
                            >
                                Log in
                            </Link>

                            <Link
                                href="/signup"
                                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
                            >
                                Sign up
                            </Link>
                        </>
                    )}
                </div>
            </header>

            {/* Main area */}
            <section className="flex min-h-0 flex-1 flex-col md:flex-row">
                {/* Registered-user history sidebar */}
                {userId && (
                    <aside className="flex max-h-44 w-full shrink-0 flex-col border-b border-slate-200 bg-white md:max-h-none md:w-64 md:border-b-0 md:border-r">
                        <div className="flex items-center justify-between px-4 py-4">
                            <h2 className="text-sm font-semibold text-slate-800">
                                Your conversations
                            </h2>

                            <button
                                type="button"
                                onClick={startNewChat}
                                disabled={loading}
                                className="rounded-lg px-2 py-1 text-xs font-medium text-indigo-600 transition hover:bg-indigo-50 disabled:opacity-50"
                            >
                                + New chat
                            </button>
                        </div>

                        <div className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 pb-3">
                            {chatHistory.length === 0 ? (
                                <p className="px-3 py-3 text-xs leading-5 text-slate-400">
                                    Your saved conversations will appear here.
                                </p>
                            ) : (
                                chatHistory.map((chat) => (
                                    <div
                                        key={chat.id}
                                        className={`group relative flex items-center gap-1 rounded-lg transition ${activeChatId === chat.id
                                            ? "bg-indigo-50"
                                            : "hover:bg-slate-50"
                                            }`}
                                    >
                                        {editingChatId === chat.id ? (
                                            <form
                                                className="flex min-w-0 flex-1 items-center gap-1 p-2"
                                                onSubmit={(event) => {
                                                    event.preventDefault();
                                                    void saveRename(chat.id);
                                                }}
                                            >
                                                <input
                                                    autoFocus
                                                    maxLength={100}
                                                    value={editingTitle}
                                                    onChange={(event) =>
                                                        setEditingTitle(event.target.value)
                                                    }
                                                    onKeyDown={(event) => {
                                                        if (event.key === "Escape") {
                                                            setEditingChatId(null);
                                                            setEditingTitle("");
                                                        }
                                                    }}
                                                    className="min-w-0 flex-1 rounded-md border border-indigo-200 bg-white px-2 py-1.5 text-xs text-slate-800 outline-none focus:border-indigo-500"
                                                    aria-label="Conversation title"
                                                />

                                                <button
                                                    type="submit"
                                                    disabled={savingChatId === chat.id}
                                                    className="rounded-md px-2 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-100 disabled:opacity-50"
                                                >
                                                    {savingChatId === chat.id ? "..." : "Save"}
                                                </button>
                                            </form>
                                        ) : (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() => openConversation(chat.id)}
                                                    disabled={
                                                        loading ||
                                                        openingChatId !== null ||
                                                        editingChatId !== null
                                                    }
                                                    className={`flex min-w-0 flex-1 items-center gap-2 rounded-lg px-3 py-3 text-left text-sm transition disabled:opacity-60 ${activeChatId === chat.id
                                                        ? "font-medium text-indigo-700"
                                                        : "text-slate-600"
                                                        }`}
                                                >
                                                    <span className="shrink-0 text-slate-400">
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            width="17"
                                                            height="17"
                                                            viewBox="0 0 24 24"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            strokeWidth="1.8"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                        >
                                                            <path d="M21 15a4 4 0 0 1-4 4H7l-4 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
                                                        </svg>
                                                    </span>

                                                    <span className="min-w-0 flex-1 truncate">
                                                        {chat.title}
                                                    </span>

                                                    {openingChatId === chat.id && (
                                                        <span className="shrink-0 text-xs text-slate-400">
                                                            ...
                                                        </span>
                                                    )}
                                                </button>

                                                <div className="relative shrink-0 pr-1">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setMenuChatId(
                                                                menuChatId === chat.id
                                                                    ? null
                                                                    : chat.id
                                                            )
                                                        }
                                                        className={`flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-200 hover:text-slate-700 ${menuChatId === chat.id
                                                            ? "bg-slate-200 text-slate-700"
                                                            : "md:opacity-0 md:group-hover:opacity-100"
                                                            }`}
                                                        aria-label={`Options for ${chat.title}`}
                                                        title="Conversation options"
                                                    >
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            width="17"
                                                            height="17"
                                                            viewBox="0 0 24 24"
                                                            fill="currentColor"
                                                        >
                                                            <circle cx="5" cy="12" r="1.7" />
                                                            <circle cx="12" cy="12" r="1.7" />
                                                            <circle cx="19" cy="12" r="1.7" />
                                                        </svg>
                                                    </button>

                                                    {menuChatId === chat.id && (
                                                        <div className="absolute right-0 top-9 z-30 w-36 rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
                                                            <button
                                                                type="button"
                                                                onClick={() => beginRename(chat)}
                                                                className="w-full rounded-md px-3 py-2 text-left text-xs text-slate-700 transition hover:bg-slate-50"
                                                            >
                                                                Rename
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setConfirmDeleteChat(chat);
                                                                    setMenuChatId(null);
                                                                }}
                                                                className="w-full rounded-md px-3 py-2 text-left text-xs text-red-600 transition hover:bg-red-50"
                                                            >
                                                                Delete
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </aside>
                )}

                {/* Chat area */}
                <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 sm:px-6">
                        {messages.length === 0 ? (
                            <div className="flex flex-1 flex-col items-center justify-center pb-16 text-center">
                                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 text-3xl text-indigo-600">
                                    ✦
                                </div>

                                <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                                    What would you like to know?
                                </h1>

                                <p className="mt-3 max-w-lg text-sm leading-6 text-slate-500 sm:text-base">
                                    Start a conversation with DocMind AI. Ask questions,
                                    explore ideas, or get help understanding information.
                                </p>

                                <div className="mt-8 grid w-full max-w-2xl gap-3 sm:grid-cols-2">
                                    {[
                                        "Explain a complex topic simply",
                                        "Help me brainstorm new ideas",
                                        "Summarize information for me",
                                        "Answer a question step by step",
                                    ].map((suggestion) => (
                                        <button
                                            key={suggestion}
                                            type="button"
                                            onClick={() => {
                                                setInput(suggestion);
                                                inputRef.current?.focus();
                                            }}
                                            className="rounded-xl border border-slate-200 bg-white p-4 text-left text-sm text-slate-600 transition hover:border-indigo-300 hover:bg-indigo-50"
                                        >
                                            {suggestion}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 space-y-6 py-8">
                                {messages.map((message, index) => (
                                    <div
                                        key={index}
                                        className={`flex ${message.role === "user"
                                            ? "justify-end"
                                            : "justify-start"
                                            }`}
                                    >
                                        <div
                                            className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-7 sm:max-w-[75%] ${message.role === "user"
                                                ? "rounded-br-md bg-indigo-600 text-white"
                                                : "rounded-bl-md border border-slate-200 bg-white text-slate-700 shadow-sm"
                                                }`}
                                        >
                                            <p className="whitespace-pre-wrap break-words">
                                                {message.content}
                                            </p>
                                        </div>
                                    </div>
                                ))}

                                {loading && (
                                    <div className="flex justify-start">
                                        <div className="rounded-2xl rounded-bl-md border border-slate-200 bg-white px-5 py-4 shadow-sm">
                                            <div className="flex gap-1.5">
                                                <span className="h-2 w-2 animate-bounce rounded-full bg-indigo-400" />
                                                <span className="h-2 w-2 animate-bounce rounded-full bg-indigo-400 [animation-delay:150ms]" />
                                                <span className="h-2 w-2 animate-bounce rounded-full bg-indigo-400 [animation-delay:300ms]" />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div ref={bottomRef} />
                            </div>
                        )}

                        {error && (
                            <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                {error}
                            </div>
                        )}

                        {/* Message input */}
                        <div className="sticky bottom-0 bg-[#f8f9fc] pb-5 pt-3">
                            {messages.length > 0 && (
                                <div className="mb-3 flex justify-end">
                                    <button
                                        type="button"
                                        onClick={startNewChat}
                                        className="text-xs font-medium text-slate-500 transition hover:text-indigo-600"
                                    >
                                        + New chat
                                    </button>
                                </div>
                            )}

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                                onChange={handleFileSelect}
                                className="hidden"
                            />

                            {selectedFile && (
                                <div className="mb-3 flex items-center justify-between rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3">
                                    <div className="flex min-w-0 items-center gap-3">
                                        <span className="text-xl">📄</span>

                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium text-slate-700">
                                                {selectedFile.name}
                                            </p>

                                            <p className="text-xs text-slate-500">
                                                {(
                                                    selectedFile.size /
                                                    (1024 * 1024)
                                                ).toFixed(2)}{" "}
                                                MB
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedFile(null);

                                            if (fileInputRef.current) {
                                                fileInputRef.current.value = "";
                                            }
                                        }}
                                        className="ml-3 text-sm text-slate-500 hover:text-red-600"
                                        aria-label="Remove document"
                                    >
                                        ✕
                                    </button>
                                </div>
                            )}

                            <form
                                onSubmit={sendMessage}
                                className="flex items-end gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100"
                            >
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (isPending) return;

                                        if (!session) {
                                            router.push("/login");
                                            return;
                                        }

                                        fileInputRef.current?.click();
                                    }}
                                    disabled={loading || isPending}
                                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-indigo-600 disabled:opacity-50"
                                    aria-label="Attach document"
                                    title="Attach PDF or image"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="21"
                                        height="21"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.8"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.82-2.83l8.49-8.48" />
                                    </svg>
                                </button>

                                <textarea
                                    ref={inputRef}
                                    value={input}
                                    onChange={(event) => setInput(event.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Message DocMind AI..."
                                    rows={1}
                                    disabled={loading}
                                    className="max-h-36 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400 disabled:opacity-60"
                                />

                                <button
                                    type="submit"
                                    disabled={!input.trim() || loading}
                                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                                    aria-label="Send message"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="19"
                                        height="19"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M22 2 11 13" />
                                        <path d="m22 2-7 20-4-9-9-4Z" />
                                    </svg>
                                </button>
                            </form>

                            <p className="mt-3 text-center text-xs text-slate-400">
                                DocMind AI can make mistakes. Check important information.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Delete confirmation dialog */}
            {confirmDeleteChat && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="delete-chat-title"
                        className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
                    >
                        <h2
                            id="delete-chat-title"
                            className="text-lg font-semibold text-slate-900"
                        >
                            Delete conversation?
                        </h2>

                        <p className="mt-2 text-sm leading-6 text-slate-500">
                            This will permanently delete{" "}
                            <span className="font-medium text-slate-700">
                                &quot;{confirmDeleteChat.title}&quot;
                            </span>{" "}
                            and all its messages. This cannot be undone.
                        </p>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setConfirmDeleteChat(null)}
                                disabled={deletingChatId !== null}
                                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={() => void deleteConversation()}
                                disabled={deletingChatId !== null}
                                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
                            >
                                {deletingChatId ? "Deleting..." : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
