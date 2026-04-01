"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface LogEntry {
  id: number;
  time: string;
  method: string;
  url: string;
  status: number | "pending" | "error";
  duration: number | null;
  body?: string;
  response?: string;
  error?: string;
}

let logId = 0;

export function DevPanel() {
  const [open, setOpen] = useState(true);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [backendStatus, setBackendStatus] = useState<"checking" | "up" | "down">("checking");
  const [tab, setTab] = useState<"logs" | "status">("logs");
  const scrollRef = useRef<HTMLDivElement>(null);
  const originalFetch = useRef<typeof fetch | null>(null);

  // Health check
  const checkBackend = useCallback(async () => {
    setBackendStatus("checking");
    try {
      const r = await (originalFetch.current ?? fetch)("http://localhost:4000/api/community/feed", { method: "GET", signal: AbortSignal.timeout(3000) });
      setBackendStatus(r.ok ? "up" : "down");
    } catch {
      setBackendStatus("down");
    }
  }, []);

  useEffect(() => {
    checkBackend();
    const iv = setInterval(checkBackend, 15000);
    return () => clearInterval(iv);
  }, [checkBackend]);

  // Intercept fetch
  useEffect(() => {
    if (originalFetch.current) return;
    originalFetch.current = window.fetch;

    window.fetch = async (...args: Parameters<typeof fetch>) => {
      const req = new Request(...args);
      const url = req.url.replace(window.location.origin, "");
      const method = req.method;
      const id = ++logId;
      const start = performance.now();

      let bodyText: string | undefined;
      try {
        const clone = req.clone();
        bodyText = await clone.text();
        if (bodyText.length > 300) bodyText = bodyText.slice(0, 300) + "…";
      } catch {}

      const entry: LogEntry = {
        id,
        time: new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        method,
        url: url.length > 60 ? url.slice(0, 60) + "…" : url,
        status: "pending",
        duration: null,
        body: bodyText || undefined,
      };

      setLogs((prev) => [...prev.slice(-80), entry]);

      try {
        const response = await originalFetch.current!(...args);
        const duration = Math.round(performance.now() - start);

        let resText: string | undefined;
        try {
          const clone = response.clone();
          resText = await clone.text();
          if (resText.length > 300) resText = resText.slice(0, 300) + "…";
        } catch {}

        setLogs((prev) =>
          prev.map((e) =>
            e.id === id ? { ...e, status: response.status, duration, response: resText } : e
          )
        );

        return response;
      } catch (err: unknown) {
        const duration = Math.round(performance.now() - start);
        const errorMsg = err instanceof Error ? err.message : String(err);
        setLogs((prev) =>
          prev.map((e) =>
            e.id === id ? { ...e, status: "error", duration, error: errorMsg } : e
          )
        );
        throw err;
      }
    };

    return () => {
      if (originalFetch.current) {
        window.fetch = originalFetch.current;
        originalFetch.current = null;
      }
    };
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const statusColor = (s: LogEntry["status"]) => {
    if (s === "pending") return "text-yellow-500";
    if (s === "error") return "text-red-500";
    if (typeof s === "number" && s >= 200 && s < 300) return "text-green-500";
    if (typeof s === "number" && s >= 400) return "text-red-400";
    return "text-orange-400";
  };

  const methodColor = (m: string) => {
    if (m === "GET") return "text-cyan-400";
    if (m === "POST") return "text-yellow-400";
    if (m === "PUT") return "text-orange-400";
    if (m === "DELETE") return "text-red-400";
    return "text-gray-400";
  };

  const [expanded, setExpanded] = useState<number | null>(null);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-[9999] w-10 h-10 rounded-full bg-black text-white text-xs font-bold flex items-center justify-center shadow-lg hover:bg-gray-800 transition-colors"
      >
        <span className={`w-2 h-2 rounded-full mr-0 ${backendStatus === "up" ? "bg-green-400" : backendStatus === "down" ? "bg-red-400" : "bg-yellow-400"} animate-pulse`} />
        &nbsp;D
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-[9999] w-[420px] max-h-[70vh] bg-[#0d0d0d] text-[#e0e0e0] rounded-xl shadow-2xl border border-[#333] flex flex-col font-mono text-[11px] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#333] bg-[#111] shrink-0">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${backendStatus === "up" ? "bg-green-400" : backendStatus === "down" ? "bg-red-400" : "bg-yellow-400 animate-pulse"}`} />
          <span className="font-bold text-[12px] text-white">Dev Panel</span>
          <span className="text-[10px] text-[#666]">
            API {backendStatus === "up" ? "connected" : backendStatus === "down" ? "offline" : "checking…"}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={checkBackend} className="px-1.5 py-0.5 rounded bg-[#222] text-[#999] hover:text-white hover:bg-[#333] transition-colors" title="Ping backend">
            ↻
          </button>
          <button onClick={() => setLogs([])} className="px-1.5 py-0.5 rounded bg-[#222] text-[#999] hover:text-white hover:bg-[#333] transition-colors" title="Clear logs">
            ✕
          </button>
          <button onClick={() => setOpen(false)} className="px-1.5 py-0.5 rounded bg-[#222] text-[#999] hover:text-white hover:bg-[#333] transition-colors" title="Minimize">
            —
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#333] shrink-0">
        {(["logs", "status"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 px-3 py-1.5 text-[10px] uppercase tracking-wider font-bold transition-colors ${
              tab === t ? "text-white bg-[#1a1a1a] border-b border-white" : "text-[#666] hover:text-[#999]"
            }`}
          >
            {t === "logs" ? `Network (${logs.length})` : "Endpoints"}
          </button>
        ))}
      </div>

      {/* Content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto min-h-[200px] max-h-[50vh]">
        {tab === "logs" && (
          <div className="divide-y divide-[#222]">
            {logs.length === 0 && (
              <div className="px-3 py-6 text-center text-[#555]">No requests yet — try creating a song</div>
            )}
            {logs.map((entry) => (
              <div key={entry.id}>
                <button
                  onClick={() => setExpanded(expanded === entry.id ? null : entry.id)}
                  className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-[#1a1a1a] transition-colors text-left"
                >
                  <span className={`font-bold w-8 shrink-0 ${methodColor(entry.method)}`}>{entry.method}</span>
                  <span className={`w-10 shrink-0 text-right ${statusColor(entry.status)}`}>
                    {entry.status === "pending" ? "⏳" : entry.status}
                  </span>
                  <span className="text-[#888] truncate flex-1">{entry.url}</span>
                  <span className="text-[#555] w-12 text-right shrink-0">
                    {entry.duration != null ? `${entry.duration}ms` : "—"}
                  </span>
                  <span className="text-[#555] w-14 text-right shrink-0">{entry.time}</span>
                </button>
                {expanded === entry.id && (
                  <div className="px-3 pb-2 space-y-1">
                    {entry.body && (
                      <div>
                        <span className="text-[10px] text-[#666] uppercase">Request body:</span>
                        <pre className="text-[10px] text-[#aaa] bg-[#111] rounded px-2 py-1 mt-0.5 whitespace-pre-wrap break-all max-h-24 overflow-y-auto">{entry.body}</pre>
                      </div>
                    )}
                    {entry.response && (
                      <div>
                        <span className="text-[10px] text-[#666] uppercase">Response:</span>
                        <pre className="text-[10px] text-[#aaa] bg-[#111] rounded px-2 py-1 mt-0.5 whitespace-pre-wrap break-all max-h-24 overflow-y-auto">{entry.response}</pre>
                      </div>
                    )}
                    {entry.error && (
                      <div>
                        <span className="text-[10px] text-red-400 uppercase">Error:</span>
                        <pre className="text-[10px] text-red-300 bg-[#1a0000] rounded px-2 py-1 mt-0.5 whitespace-pre-wrap break-all">{entry.error}</pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === "status" && (
          <div className="p-3 space-y-2">
            <EndpointCheck label="Backend health" url="http://localhost:4000/api/community/feed" method="GET" originalFetch={originalFetch.current} />
            <EndpointCheck label="Clerk auth → /api/users/me" url="/api/users/me" method="GET" originalFetch={originalFetch.current} />
            <EndpointCheck label="Lyrics preview" url="http://localhost:4000/api/generate/lyrics-preview" method="POST" originalFetch={originalFetch.current} dry />
            <EndpointCheck label="Dedicate generate" url="http://localhost:4000/api/generate/dedicate" method="POST" originalFetch={originalFetch.current} dry />
            <EndpointCheck label="Redis (BullMQ)" url="http://localhost:4000/api/community/feed" method="GET" originalFetch={originalFetch.current} label2="via backend" />
          </div>
        )}
      </div>
    </div>
  );
}

function EndpointCheck({
  label,
  url,
  method,
  originalFetch,
  dry,
  label2,
}: {
  label: string;
  url: string;
  method: string;
  originalFetch: typeof fetch | null;
  dry?: boolean;
  label2?: string;
}) {
  const [status, setStatus] = useState<"idle" | "checking" | "ok" | "fail">("idle");
  const [latency, setLatency] = useState<number | null>(null);
  const [error, setError] = useState<string>("");

  const check = async () => {
    if (dry) { setStatus("idle"); return; }
    setStatus("checking");
    const f = originalFetch ?? fetch;
    const start = performance.now();
    try {
      const r = await f(url, { method, signal: AbortSignal.timeout(5000) });
      setLatency(Math.round(performance.now() - start));
      setStatus(r.ok ? "ok" : "fail");
      if (!r.ok) setError(`${r.status} ${r.statusText}`);
    } catch (e: unknown) {
      setLatency(Math.round(performance.now() - start));
      setStatus("fail");
      setError(e instanceof Error ? e.message : "Failed");
    }
  };

  useEffect(() => { check(); }, []);

  const dot = status === "ok" ? "bg-green-400" : status === "fail" ? "bg-red-400" : status === "checking" ? "bg-yellow-400 animate-pulse" : "bg-[#555]";

  return (
    <div className="flex items-center gap-2 px-2 py-1.5 rounded bg-[#111] border border-[#222]">
      <span className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
      <span className="flex-1 text-[11px]">
        {label} {label2 && <span className="text-[#555]">({label2})</span>}
      </span>
      <span className="text-[10px] text-[#555]">{method}</span>
      {latency != null && <span className="text-[10px] text-[#777]">{latency}ms</span>}
      {status === "fail" && <span className="text-[10px] text-red-400 truncate max-w-20">{error}</span>}
      {dry && <span className="text-[10px] text-[#555]">POST only</span>}
      <button onClick={check} className="text-[10px] text-[#666] hover:text-white">↻</button>
    </div>
  );
}
