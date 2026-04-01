import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getAdminStore } from "@/lib/adminStore";

const ADMIN_USER_IDS = (process.env.ADMIN_USER_IDS ?? "").split(",").filter(Boolean);
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api";

async function assertAdmin() {
  const { userId, getToken } = await auth();
  if (!userId || ADMIN_USER_IDS.length === 0 || !ADMIN_USER_IDS.includes(userId)) {
    return null;
  }
  const token = await getToken();
  return { userId, token };
}

async function proxyToBackend(path: string, token: string | null) {
  const response = await fetch(`${API_BASE_URL}/admin/${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    cache: "no-store",
  });
  if (!response.ok) return null;
  return response.json();
}

export async function GET(request: NextRequest) {
  const admin = await assertAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const module = searchParams.get("module");

  // Modules backed by real database via backend API
  switch (module) {
    case "dashboard": {
      const data = await proxyToBackend("dashboard", admin.token);
      if (data) return NextResponse.json(data);
      break; // fall through to mock if backend unavailable
    }
    case "users": {
      const data = await proxyToBackend("users", admin.token);
      if (data) return NextResponse.json(data);
      break;
    }
    case "transactions": {
      const data = await proxyToBackend("transactions", admin.token);
      if (data) return NextResponse.json(data);
      break;
    }
    case "jobs": {
      const data = await proxyToBackend("sessions", admin.token);
      if (data) return NextResponse.json(data);
      break;
    }
  }

  // Fallback to in-memory store for modules not yet migrated
  const store = getAdminStore();
  switch (module) {
    case "dashboard": {
      const totalUsers = store.users.length;
      const activeUsers = store.users.filter((u) => u.status === "active").length;
      const totalSongs = store.songs.length;
      const totalRevenue = store.transactions.filter((t) => t.type === "purchase" && t.status === "completed").reduce((s, t) => s + t.amount, 0);
      const totalCoinsSpent = store.transactions.filter((t) => t.type === "spend").reduce((s, t) => s + Math.abs(t.coins), 0);
      const failedJobs = store.jobs.filter((j) => j.status === "failed").length;
      const queuedJobs = store.jobs.filter((j) => j.status === "queued" || j.status === "running").length;
      const pendingReports = store.reports.filter((r) => r.status === "pending").length;
      return NextResponse.json({
        totalUsers, activeUsers, totalSongs, totalRevenue, totalCoinsSpent,
        failedJobs, queuedJobs, pendingReports,
        recentTransactions: store.transactions.slice(0, 5),
        recentJobs: store.jobs.slice(0, 5),
      });
    }
    case "users":
      return NextResponse.json(store.users);
    case "user": {
      const id = searchParams.get("id");
      const user = store.users.find((u) => u.id === id);
      if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
      const userSongs = store.songs.filter((s) => s.userId === id);
      const userTxns = store.transactions.filter((t) => t.userId === id);
      const userJobs = store.jobs.filter((j) => j.userId === id);
      return NextResponse.json({ user, songs: userSongs, transactions: userTxns, jobs: userJobs });
    }
    case "songs":
      return NextResponse.json(store.songs);
    case "jobs":
      return NextResponse.json(store.jobs);
    case "transactions":
      return NextResponse.json(store.transactions);
    case "pricing":
      return NextResponse.json(store.pricing);
    case "reports":
      return NextResponse.json(store.reports);
    default:
      return NextResponse.json({ error: "Unknown module" }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  const admin = await assertAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await request.json();
  const { action } = body;
  const store = getAdminStore();

  switch (action) {
    case "add_coins": {
      const user = store.users.find((u) => u.id === body.userId);
      if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
      if (!body.amount || typeof body.amount !== "number" || body.amount <= 0 || !Number.isInteger(body.amount)) {
        return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
      }
      user.coinsBalance += body.amount;
      store.transactions.unshift({
        id: `t${Date.now()}`, userId: user.id, userName: user.name,
        coins: body.amount, amount: 0, type: "bonus", source: "admin",
        status: "completed", createdAt: new Date().toISOString(),
      });
      return NextResponse.json({ success: true, newBalance: user.coinsBalance });
    }
    case "remove_coins": {
      const user = store.users.find((u) => u.id === body.userId);
      if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
      user.coinsBalance = Math.max(0, user.coinsBalance - body.amount);
      return NextResponse.json({ success: true, newBalance: user.coinsBalance });
    }
    case "ban_user": {
      const user = store.users.find((u) => u.id === body.userId);
      if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
      user.status = "banned";
      return NextResponse.json({ success: true });
    }
    case "unban_user": {
      const user = store.users.find((u) => u.id === body.userId);
      if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
      user.status = "active";
      return NextResponse.json({ success: true });
    }
    case "shadow_ban": {
      const user = store.users.find((u) => u.id === body.userId);
      if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
      user.status = "shadow_banned";
      return NextResponse.json({ success: true });
    }
    case "feature_song": {
      const song = store.songs.find((s) => s.id === body.songId);
      if (!song) return NextResponse.json({ error: "Song not found" }, { status: 404 });
      song.status = "featured";
      return NextResponse.json({ success: true });
    }
    case "remove_song": {
      const song = store.songs.find((s) => s.id === body.songId);
      if (!song) return NextResponse.json({ error: "Song not found" }, { status: 404 });
      song.status = "deleted";
      return NextResponse.json({ success: true });
    }
    case "retry_job": {
      const job = store.jobs.find((j) => j.id === body.jobId);
      if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
      job.status = "queued";
      job.errorMessage = null;
      return NextResponse.json({ success: true });
    }
    case "refund_job": {
      const job = store.jobs.find((j) => j.id === body.jobId);
      if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
      const user = store.users.find((u) => u.id === job.userId);
      if (user) {
        user.coinsBalance += job.cost;
        store.transactions.unshift({
          id: `t${Date.now()}`, userId: user.id, userName: user.name,
          coins: job.cost, amount: 0, type: "refund", source: "generate",
          status: "completed", createdAt: new Date().toISOString(),
        });
      }
      return NextResponse.json({ success: true });
    }
    case "update_pricing": {
      Object.assign(store.pricing, body.pricing);
      return NextResponse.json({ success: true, pricing: store.pricing });
    }
    case "resolve_report": {
      const report = store.reports.find((r) => r.id === body.reportId);
      if (!report) return NextResponse.json({ error: "Report not found" }, { status: 404 });
      report.status = body.resolution === "dismiss" ? "dismissed" : "reviewed";
      if (body.resolution === "remove") {
        const song = store.songs.find((s) => s.id === report.songId);
        if (song) song.status = "deleted";
      }
      return NextResponse.json({ success: true });
    }
    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}
