import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ------------------------------------------------------------------------------
// FAMGATEWAY CONFIGURATION (From Environment)
// ------------------------------------------------------------------------------
const FAMGATEWAY_API_KEY = process.env.FAMGATEWAY_API_KEY || "";
const FAMGATEWAY_BASE_URL = process.env.FAMGATEWAY_BASE_URL || "https://famgateway.in";
const FAMGATEWAY_UPI_ID = process.env.FAMGATEWAY_UPI_ID || "famgateway@upi";
const MERCHANT_NAME = "Jungle Warfare Armory";

// In-Memory Orders Database
interface OrderRecord {
    order_id: string;
    gun_id: string;
    gun_name: string;
    amount: number;
    player_bgmi_id: string;
    customer_mobile: string;
    upi_id?: string;
    status: "PENDING" | "VERIFYING" | "PAID" | "FAILED";
    created_at: number;
    upi_intent?: string;
    qr_url?: string;
    payment_url?: string;
}

const ORDERS_DB: Record<string, OrderRecord> = {};

// ------------------------------------------------------------------------------
// 1. BACKEND PAYMENT CREATION ROUTE (/pay, /api/pay, /create-payment)
// ------------------------------------------------------------------------------
const handleCreatePay = async (req: express.Request, res: express.Response) => {
    try {
        const { gun_id, gun_name, amount, bgmi_id, mobile, upi_id } = req.body || {};

        if (!gun_id) {
            return res.status(400).json({
                success: false,
                error: "Invalid weapon selected. Please provide gun_id."
            });
        }

        const numericAmount = parseFloat(amount) || 99;
        const weaponTitle = gun_name || gun_id;
        const orderId = `ORD_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

        // Standard UPI Intent URI for all UPI applications (GPay, PhonePe, Paytm, BHIM, etc.)
        const upiIntentUri = `upi://pay?pa=${encodeURIComponent(FAMGATEWAY_UPI_ID)}&pn=${encodeURIComponent(MERCHANT_NAME)}&am=${numericAmount.toFixed(2)}&tr=${encodeURIComponent(orderId)}&tn=${encodeURIComponent('Gun: ' + weaponTitle)}&cu=INR`;
        
        // High-Quality QR Code API
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=${encodeURIComponent(upiIntentUri)}`;

        let paymentUrl = "";
        let isLiveGateway = false;

        // If real FamGateway API Key is provided, initiate order with FamGateway server
        if (FAMGATEWAY_API_KEY && FAMGATEWAY_API_KEY !== "MY_FAMGATEWAY_API_KEY") {
            try {
                const famgatewayUrl = `${FAMGATEWAY_BASE_URL.replace(/\/$/, '')}/api/create-order?api_key=${encodeURIComponent(FAMGATEWAY_API_KEY)}&order_id=${encodeURIComponent(orderId)}&amount=${numericAmount}&customer_mobile=${encodeURIComponent(mobile || '9999999999')}&purpose=${encodeURIComponent('Gun: ' + weaponTitle)}`;
                
                const response = await fetch(famgatewayUrl, { method: 'GET' });
                if (response.ok) {
                    const data = await response.json();
                    paymentUrl = data?.payment_url || data?.checkout_url || data?.data?.payment_url || "";
                    isLiveGateway = true;
                }
            } catch (gatewayErr) {
                console.warn("FamGateway live API request notice:", gatewayErr);
            }
        }

        // Save order in memory
        ORDERS_DB[orderId] = {
            order_id: orderId,
            gun_id: String(gun_id),
            gun_name: String(weaponTitle),
            amount: numericAmount,
            player_bgmi_id: String(bgmi_id || "COMMANDER"),
            customer_mobile: String(mobile || "9999999999"),
            upi_id: upi_id ? String(upi_id) : undefined,
            status: "PENDING",
            created_at: Date.now(),
            upi_intent: upiIntentUri,
            qr_url: qrCodeUrl,
            payment_url: paymentUrl || upiIntentUri
        };

        return res.json({
            success: true,
            order_id: orderId,
            amount: numericAmount,
            gun_id,
            gun_name: weaponTitle,
            upi_id: FAMGATEWAY_UPI_ID,
            upi_intent: upiIntentUri,
            qr_url: qrCodeUrl,
            payment_url: paymentUrl || upiIntentUri,
            is_live_gateway: isLiveGateway,
            status: "PENDING",
            message: "Payment order session initialized successfully."
        });

    } catch (err: any) {
        console.error("Payment creation error:", err);
        return res.status(500).json({
            success: false,
            error: err?.message || "Internal server error creating payment session."
        });
    }
};

app.post("/pay", handleCreatePay);
app.post("/api/pay", handleCreatePay);
app.post("/create-payment", handleCreatePay);

// ------------------------------------------------------------------------------
// 2. PAYMENT STATUS CHECKING ROUTE (/payment-status, /api/payment-status)
// ------------------------------------------------------------------------------
const handlePaymentStatus = async (req: express.Request, res: express.Response) => {
    try {
        const orderId = String(req.query.order_id || req.body?.order_id || "");

        if (!orderId || !ORDERS_DB[orderId]) {
            return res.json({
                success: false,
                status: "NOT_FOUND",
                error: "Order ID not found."
            });
        }

        const order = ORDERS_DB[orderId];

        // If live FamGateway API key is set, check external status
        if (order.status === "PENDING" && FAMGATEWAY_API_KEY && FAMGATEWAY_API_KEY !== "MY_FAMGATEWAY_API_KEY") {
            try {
                const checkUrl = `${FAMGATEWAY_BASE_URL.replace(/\/$/, '')}/api/check-status?api_key=${encodeURIComponent(FAMGATEWAY_API_KEY)}&order_id=${encodeURIComponent(orderId)}`;
                const response = await fetch(checkUrl, { method: 'GET' });
                if (response.ok) {
                    const data = await response.json();
                    const statusStr = (data?.status || data?.data?.status || "").toUpperCase();
                    if (statusStr === "SUCCESS" || statusStr === "PAID" || statusStr === "COMPLETED") {
                        order.status = "PAID";
                    } else if (statusStr === "FAILED" || statusStr === "CANCELLED") {
                        order.status = "FAILED";
                    }
                }
            } catch (checkErr) {
                console.warn("Status check notice:", checkErr);
            }
        }

        return res.json({
            success: true,
            order_id: order.order_id,
            gun_id: order.gun_id,
            gun_name: order.gun_name,
            amount: order.amount,
            status: order.status,
            created_at: order.created_at
        });

    } catch (err: any) {
        return res.status(500).json({
            success: false,
            error: err?.message || "Error checking payment status"
        });
    }
};

app.get("/payment-status", handlePaymentStatus);
app.get("/api/payment-status", handlePaymentStatus);
app.post("/payment-status", handlePaymentStatus);
app.get("/verify", handlePaymentStatus);
app.post("/verify", handlePaymentStatus);
app.get("/api/verify", handlePaymentStatus);

// ------------------------------------------------------------------------------
// 3. VERIFY / COMPLETE PAYMENT (For instant test verification & collect requests)
// ------------------------------------------------------------------------------
app.post("/api/verify-payment", (req, res) => {
    const { order_id, outcome, user_upi_id } = req.body || {};
    if (!order_id || !ORDERS_DB[order_id]) {
        return res.status(404).json({ success: false, error: "Order not found" });
    }

    if (user_upi_id) {
        ORDERS_DB[order_id].upi_id = user_upi_id;
    }

    ORDERS_DB[order_id].status = outcome === "failed" ? "FAILED" : "PAID";
    return res.json({
        success: true,
        order_id,
        status: ORDERS_DB[order_id].status,
        gun_id: ORDERS_DB[order_id].gun_id
    });
});

app.post("/mock-complete-pay", (req, res) => {
    const order_id = req.body?.order_id || req.query?.order_id;
    const outcome = req.body?.outcome || "success";
    if (order_id && ORDERS_DB[order_id]) {
        ORDERS_DB[order_id].status = outcome === "success" ? "PAID" : "FAILED";
    }
    return res.json({ success: true, status: ORDERS_DB[order_id]?.status || "PAID" });
});

// ------------------------------------------------------------------------------
// 4. VITE MIDDLEWARE & STATIC ASSET SERVER
// ------------------------------------------------------------------------------
async function startServer() {
    if (process.env.NODE_ENV !== "production") {
        const vite = await createViteServer({
            server: { middlewareMode: true },
            appType: "spa",
        });
        app.use(vite.middlewares);
    } else {
        const distPath = path.join(process.cwd(), "dist");
        app.use(express.static(distPath));
        app.get("*", (req, res) => {
            res.sendFile(path.join(distPath, "index.html"));
        });
    }

    app.listen(PORT, "0.0.0.0", () => {
        console.log(`🚀 Pro FPS Jungle Warfare & FamGateway Server running on http://0.0.0.0:${PORT}`);
    });
}

startServer();
