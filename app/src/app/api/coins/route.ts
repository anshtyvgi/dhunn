import { NextRequest, NextResponse } from "next/server";

// POST /api/coins
// Handles coin purchase via Razorpay
// Flow: Create order → Verify payment → Credit coins

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { packageId, userId } = body;

    if (!packageId) {
      return NextResponse.json({ error: "Missing package ID" }, { status: 400 });
    }

    // TODO: Create Razorpay order
    // const razorpay = new Razorpay({ key_id, key_secret });
    // const order = await razorpay.orders.create({
    //   amount: package.priceINR * 100, // paise
    //   currency: "INR",
    //   receipt: `dhun_${packageId}_${userId}`,
    // });

    // Mock order
    const order = {
      id: `order_${crypto.randomUUID()}`,
      amount: 24900, // ₹249 in paise
      currency: "INR",
      packageId,
    };

    return NextResponse.json(order);
  } catch (error) {
    console.error("Coin purchase error:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}

// POST /api/coins/verify
// Verifies Razorpay payment and credits coins
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, paymentId, signature, packageId, userId } = body;

    if (!orderId || !paymentId || !signature) {
      return NextResponse.json({ error: "Missing payment details" }, { status: 400 });
    }

    // TODO: Verify Razorpay signature
    // const isValid = verifySignature(orderId, paymentId, signature);
    // if (!isValid) return error

    // TODO: Credit coins to user wallet in DB
    // UPDATE users SET coins = coins + package.coins WHERE id = userId

    return NextResponse.json({
      success: true,
      coinsAdded: 150, // mock
      message: "Coins credited successfully",
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.json({ error: "Payment verification failed" }, { status: 500 });
  }
}
