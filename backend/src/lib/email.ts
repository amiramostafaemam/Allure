import { Resend } from "resend";
import type { Env } from "./env";
import type { CheckoutSessionLine, OrderStatus } from "../db/schema";

// Resend is optional — skip sending (log only) rather than fail the caller,
// same pattern as POLAR_ACCESS_TOKEN being optional elsewhere.
function getResendClient(env: Env): Resend | null {
  if (!env.RESEND_API_KEY) return null;
  return new Resend(env.RESEND_API_KEY);
}

async function send(env: Env, to: string, subject: string, html: string) {
  const client = getResendClient(env);
  if (!client) {
    console.log(`[email] RESEND_API_KEY not set, skipping "${subject}" to ${to}`);
    return;
  }

  try {
    const { error } = await client.emails.send({
      from: env.RESEND_FROM_EMAIL,
      to,
      subject,
      html,
    });
    if (error) {
      console.error(`[email] Resend rejected "${subject}" to ${to}:`, error);
    }
  } catch (err) {
    console.error(`[email] Failed to send "${subject}" to ${to}:`, err);
  }
}

function layout(bodyHtml: string): string {
  return `
    <div style="font-family:system-ui,-apple-system,sans-serif;max-width:520px;margin:0 auto;color:#1f2937">
      <h1 style="font-size:20px;margin:0 0 16px">Allure</h1>
      ${bodyHtml}
      <p style="margin-top:32px;font-size:12px;color:#6b7280">
        This is an automated message from Allure Supply.
      </p>
    </div>
  `;
}

function formatPounds(pounds: number): string {
  return `EGP ${pounds.toLocaleString("en-EG")}`;
}

export async function sendOrderConfirmationEmail(
  env: Env,
  params: { to: string; orderId: string; totalPounds: number; lines: CheckoutSessionLine[] },
) {
  const { to, orderId, totalPounds, lines } = params;
  const itemsHtml = lines
    .map((l) => `<li>${l.quantity} × item — ${formatPounds(l.unitPricePounds * l.quantity)}</li>`)
    .join("");

  await send(
    env,
    to,
    `Order confirmed — #${orderId.slice(0, 8)}`,
    layout(`
      <p>Thanks for your order! We've received your payment and are getting it ready.</p>
      <p><strong>Order #${orderId.slice(0, 8)}</strong></p>
      <ul>${itemsHtml}</ul>
      <p><strong>Total: ${formatPounds(totalPounds)}</strong></p>
      <p>Track it any time from your <a href="${env.FRONTEND_URL}/orders/${orderId}">order page</a>.</p>
    `),
  );
}

const STATUS_COPY: Partial<Record<OrderStatus, string>> = {
  shipped: "Your order is on its way.",
  delivered: "Your order has been delivered.",
  cancelled: "Your order has been cancelled.",
  refunded: "Your order has been refunded.",
};

export async function sendOrderStatusEmail(
  env: Env,
  params: { to: string; orderId: string; status: OrderStatus },
) {
  const { to, orderId, status } = params;
  const line = STATUS_COPY[status] ?? `Your order status changed to ${status}.`;

  await send(
    env,
    to,
    `Order update — #${orderId.slice(0, 8)} ${status}`,
    layout(`
      <p>${line}</p>
      <p>
        See the full timeline on your
        <a href="${env.FRONTEND_URL}/orders/${orderId}">order page</a>.
      </p>
    `),
  );
}
