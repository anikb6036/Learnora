const cleanEnv = (val: string | undefined): string => {
  if (!val) return "";
  return val.trim().replace(/^['"]|['"]$/g, "").trim();
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { amount } = req.body;
    if (!amount) {
      return res.status(400).json({ error: "Amount is required" });
    }

    const key_id = cleanEnv(process.env.RAZORPAY_KEY_ID) || "rzp_test_T4Ag8YOyh0ygkS";
    const key_secret = cleanEnv(process.env.RAZORPAY_KEY_SECRET) || "xKbBl8VteBIbXJEVfweoMGtH";

    if (!key_id || !key_secret) {
      return res.status(500).json({ error: "Razorpay credentials are not configured." });
    }

    // Convert amount to paise safely
    const amountInPaise = Math.round(Number(amount) * 100);

    const orderData = {
      amount: amountInPaise,
      currency: "INR",
      receipt: `receipt_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`
    };

    console.log(`[Razorpay] Initiating order with key ${key_id} for ${amount} INR`);

    // Inline base64 conversion supporting both Node and alternative runtimes
    const authHeader = 'Basic ' + Buffer.from(`${key_id}:${key_secret}`).toString('base64');

    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": authHeader
      },
      body: JSON.stringify(orderData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Razorpay] Failed to create order. Status:", response.status, errorText);
      return res.status(response.status).json({ error: `Razorpay Order Error: ${errorText}` });
    }

    const order = await response.json();
    console.log("[Razorpay] Order successfully created:", order.id);

    return res.status(200).json({
      success: true,
      orderId: order.id,
      keyId: key_id,
      amount: order.amount,
      currency: order.currency
    });

  } catch (err: any) {
    console.error("[Razorpay] Create Order exception:", err);
    return res.status(500).json({ error: err.message || "Failed to initiate transaction." });
  }
}
