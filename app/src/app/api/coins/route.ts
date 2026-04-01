import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api";

const COIN_PACKAGES = [
  { id: "starter", name: "Starter", coins: 50, priceINR: 99, priceUSD: 1.49 },
  { id: "popular", name: "Popular", coins: 150, priceINR: 249, priceUSD: 3.49 },
  { id: "best-value", name: "Best Value", coins: 500, priceINR: 699, priceUSD: 8.99 },
  { id: "pro", name: "Pro", coins: 1500, priceINR: 1799, priceUSD: 21.99 },
];

// POST /api/coins — creates a coin purchase order
export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { packageId } = body;

    if (!packageId || typeof packageId !== "string") {
      return NextResponse.json({ error: "Missing package ID" }, { status: 400 });
    }

    const pkg = COIN_PACKAGES.find((p) => p.id === packageId);
    if (!pkg) {
      return NextResponse.json({ error: "Invalid package" }, { status: 400 });
    }

    // TODO: Replace with real Razorpay order creation
    // const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID!, key_secret: process.env.RAZORPAY_KEY_SECRET! });
    // const order = await razorpay.orders.create({ amount: pkg.priceINR * 100, currency: "INR", receipt: `dhun_${packageId}_${userId}` });
    const order = {
      id: `order_${crypto.randomUUID()}`,
      amount: pkg.priceINR * 100,
      currency: "INR",
      packageId: pkg.id,
      coins: pkg.coins,
      displayPrice: pkg.priceINR,
    };

    return NextResponse.json(order);
  } catch (error) {
    console.error("Coin purchase error:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}

// PUT /api/coins — verifies payment and credits coins via backend
export async function PUT(request: NextRequest) {
  const { userId, getToken } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { orderId, paymentId, signature, packageId } = body;

    if (!orderId || !paymentId || !signature) {
      return NextResponse.json({ error: "Missing payment details" }, { status: 400 });
    }

    const pkg = COIN_PACKAGES.find((p) => p.id === packageId);
    if (!pkg) {
      return NextResponse.json({ error: "Invalid package" }, { status: 400 });
    }

    // TODO: In production, verify Razorpay signature server-side:
    // const expectedSignature = crypto.createHmac("sha256", RAZORPAY_SECRET).update(`${orderId}|${paymentId}`).digest("hex");
    // if (expectedSignature !== signature) return NextResponse.json({ error: "Invalid signature" }, { status: 400 });

    // Credit coins via backend webhook/API for proper persistence
    const token = await getToken();
    const backendRes = await fetch(`${API_BASE_URL}/payments/webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // In production, use HMAC signature header instead
        "x-payment-signature": signature,
      },
      body: JSON.stringify({
        type: "payment.captured",
        data: {
          paymentId,
          clerkUserId: userId,
          coins: pkg.coins,
          amount: pkg.priceINR,
          currency: "INR",
        },
      }),
    });

    if (!backendRes.ok) {
      const err = await backendRes.json().catch(() => ({ error: "Backend error" }));
      return NextResponse.json(
        { error: err.message ?? err.error ?? "Payment verification failed" },
        { status: backendRes.status },
      );
    }

    const result = await backendRes.json();
    return NextResponse.json({
      success: true,
      coinsAdded: pkg.coins,
      newBalance: result.coins,
      packageName: pkg.name,
      message: `${pkg.coins} tokens credited successfully!`,
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.json({ error: "Payment verification failed" }, { status: 500 });
  }
}
