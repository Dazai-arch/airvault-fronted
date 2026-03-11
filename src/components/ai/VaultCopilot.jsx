import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Send, X, Minimize2, Maximize2,
  Shield, Bot, User, Loader2, AlertCircle,
  ChevronDown, Trash2, Lock
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// ZK-safe suggested prompts — all about metadata only
const SUGGESTED_PROMPTS = [
  "Who downloaded files last week?",
  "What's taking up the most storage?",
  "Are there any security concerns?",
  "Summarise activity this month",
  "Which files have never been viewed?",
  "Are any share links still active?",
  "Which members haven't accessed the vault recently?",
  "Show me the most downloaded files",
];

export default function VaultCopilot({ vaultId, isOwner }) {
  const { isDark } = useTheme();
  const [open, setOpen]         = useState(false);
  const [minimised, setMinimised] = useState(false);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [history, setHistory]   = useState([]); // { role, content }
  const bottomRef               = useRef(null);
  const inputRef                = useRef(null);

  // Scroll to bottom on new message
  useEffect(() => {
    if (open && !minimised) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [history, open, minimised, loading]);

  // Focus input when opening
  useEffect(() => {
    if (open && !minimised) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [open, minimised]);

  const sendMessage = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;

    setInput("");
    setError(null);

    // Optimistically add user message
    const newHistory = [...history, { role: "user", content: msg }];
    setHistory(newHistory);
    setLoading(true);

    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/vaults/${vaultId}/copilot`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: msg,
          // Send prior history (without the message we just added)
          history: history.slice(-10),
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Failed to get a response");
      }

      const data = await res.json();
      setHistory([...newHistory, { role: "assistant", content: data.reply }]);
    } catch (err) {
      setError(err.message);
      // Remove the optimistic user message on failure
      setHistory(history);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setHistory([]);
    setError(null);
  };

  // Colour palette matching the rest of AirVault
  const card   = isDark
    ? "bg-slate-800/95 border-slate-700/60 shadow-2xl shadow-black/40"
    : "bg-white/95 border-gray-200 shadow-2xl shadow-gray-200/60";
  const bubble = {
    user: isDark
      ? "bg-gradient-to-br from-cyan-600 to-blue-700 text-white"
      : "bg-gradient-to-br from-cyan-500 to-blue-600 text-white",
    assistant: isDark
      ? "bg-slate-700/70 border border-slate-600/50 text-gray-100"
      : "bg-gray-100 border border-gray-200 text-gray-800",
  };

  return (
    <>
      {/* ── FAB ── */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { setOpen(true); setMinimised(false); }}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/30 flex items-center justify-center"
            title="Vault Copilot"
          >
            <Sparkles className="w-6 h-6 text-white" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Chat window ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className={`fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] rounded-2xl border backdrop-blur-xl ${card} flex flex-col overflow-hidden`}
            style={{ height: minimised ? "auto" : 560 }}
          >
            {/* Header */}
            <div className={`flex items-center gap-3 px-4 py-3 border-b flex-shrink-0 ${isDark ? "border-slate-700/50" : "border-gray-200"}`}>
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold ${isDark ? "text-white" : "text-gray-900"}`}>Vault Copilot</p>
                <p className={`text-[10px] ${isDark ? "text-gray-500" : "text-gray-400"}`}>Metadata only · Zero knowledge</p>
              </div>
              <div className="flex items-center gap-1">
                {history.length > 0 && (
                  <button
                    onClick={clearChat}
                    title="Clear chat"
                    className={`p-1.5 rounded-lg transition-all ${isDark ? "text-gray-500 hover:text-gray-300 hover:bg-slate-700/50" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"}`}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => setMinimised(m => !m)}
                  className={`p-1.5 rounded-lg transition-all ${isDark ? "text-gray-500 hover:text-gray-300 hover:bg-slate-700/50" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"}`}>
                  {minimised ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className={`p-1.5 rounded-lg transition-all ${isDark ? "text-gray-500 hover:text-red-400 hover:bg-red-500/10" : "text-gray-400 hover:text-red-500 hover:bg-red-50"}`}>
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {!minimised && (
              <>
                {/* ZK notice */}
                <div className={`flex items-center gap-2 px-4 py-2 text-[10px] flex-shrink-0 ${isDark ? "bg-emerald-500/5 border-b border-emerald-500/10 text-emerald-400" : "bg-emerald-50 border-b border-emerald-100 text-emerald-600"}`}>
                  <Lock className="w-3 h-3 flex-shrink-0" />
                  File contents are encrypted end-to-end. Copilot only sees metadata — never file content or keys.
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 vault-scrollbar">

                  {/* Welcome state */}
                  {history.length === 0 && !loading && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-3"
                    >
                      <div className="text-center pt-2 pb-1">
                        <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/20 flex items-center justify-center mb-3">
                          <Sparkles className={`w-6 h-6 ${isDark ? "text-cyan-400" : "text-cyan-500"}`} />
                        </div>
                        <p className={`text-sm font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                          Ask me anything about your vault
                        </p>
                        <p className={`text-[11px] mt-1 ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                          Activity, storage, members, security — all from metadata only
                        </p>
                      </div>

                      {/* Suggested prompts */}
                      <div className="grid grid-cols-1 gap-1.5">
                        {SUGGESTED_PROMPTS.map((prompt) => (
                          <button
                            key={prompt}
                            onClick={() => sendMessage(prompt)}
                            className={`text-left text-[11px] px-3 py-2 rounded-xl border transition-all ${
                              isDark
                                ? "bg-slate-700/40 border-slate-600/40 text-gray-300 hover:border-cyan-500/40 hover:text-cyan-300 hover:bg-cyan-500/5"
                                : "bg-gray-50 border-gray-200 text-gray-600 hover:border-cyan-400 hover:text-cyan-600 hover:bg-cyan-50"
                            }`}
                          >
                            {prompt}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Message thread */}
                  {history.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {msg.role === "assistant" && (
                        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Bot className="w-3.5 h-3.5 text-white" />
                        </div>
                      )}
                      <div
                        className={`max-w-[85%] px-3 py-2.5 rounded-2xl text-[12px] leading-relaxed whitespace-pre-wrap ${bubble[msg.role]} ${
                          msg.role === "user" ? "rounded-tr-sm" : "rounded-tl-sm"
                        }`}
                      >
                        {msg.content}
                      </div>
                      {msg.role === "user" && (
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${isDark ? "bg-slate-700 text-gray-400" : "bg-gray-200 text-gray-500"}`}>
                          <User className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </motion.div>
                  ))}

                  {/* Loading indicator */}
                  {loading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex gap-2 justify-start"
                    >
                      <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Bot className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div className={`px-4 py-3 rounded-2xl rounded-tl-sm ${isDark ? "bg-slate-700/70 border border-slate-600/50" : "bg-gray-100 border border-gray-200"}`}>
                        <div className="flex gap-1.5 items-center">
                          <span className={`w-1.5 h-1.5 rounded-full animate-bounce ${isDark ? "bg-cyan-400" : "bg-cyan-500"}`} style={{ animationDelay: "0ms" }} />
                          <span className={`w-1.5 h-1.5 rounded-full animate-bounce ${isDark ? "bg-cyan-400" : "bg-cyan-500"}`} style={{ animationDelay: "120ms" }} />
                          <span className={`w-1.5 h-1.5 rounded-full animate-bounce ${isDark ? "bg-cyan-400" : "bg-cyan-500"}`} style={{ animationDelay: "240ms" }} />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Error */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] ${isDark ? "bg-red-500/10 border border-red-500/20 text-red-400" : "bg-red-50 border border-red-100 text-red-600"}`}
                    >
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      {error}
                    </motion.div>
                  )}

                  <div ref={bottomRef} />
                </div>

                {/* Input */}
                <div className={`px-3 py-3 border-t flex-shrink-0 ${isDark ? "border-slate-700/50" : "border-gray-200"}`}>
                  <div className={`flex items-end gap-2 rounded-xl border px-3 py-2 transition-all ${
                    isDark
                      ? "bg-slate-700/50 border-slate-600/50 focus-within:border-cyan-500/50"
                      : "bg-gray-50 border-gray-200 focus-within:border-cyan-400"
                  }`}>
                    <textarea
                      ref={inputRef}
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={handleKey}
                      placeholder="Ask about your vault..."
                      rows={1}
                      disabled={loading}
                      className={`flex-1 bg-transparent resize-none text-[12px] outline-none leading-relaxed max-h-24 ${
                        isDark ? "text-white placeholder:text-gray-500" : "text-gray-900 placeholder:text-gray-400"
                      } disabled:opacity-50`}
                      style={{ scrollbarWidth: "none" }}
                    />
                    <button
                      onClick={() => sendMessage()}
                      disabled={!input.trim() || loading}
                      className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-md hover:shadow-cyan-500/20 mb-0.5"
                    >
                      {loading
                        ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                        : <Send className="w-3.5 h-3.5 text-white" />
                      }
                    </button>
                  </div>
                  <p className={`text-center text-[9px] mt-1.5 ${isDark ? "text-gray-600" : "text-gray-400"}`}>
                    Enter to send · Shift+Enter for newline · File contents never shared
                  </p>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}