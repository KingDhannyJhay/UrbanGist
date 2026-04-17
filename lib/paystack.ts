/**
 * lib/paystack.ts
 *
 * Server-side Paystack API helpers.
 * ⚠️  NEVER import this in Client Components — it uses PAYSTACK_SECRET_KEY.
 * Import only from: API routes, Server Actions, Server Components.
 */

const PAYSTACK_BASE = 'https://api.paystack.co';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PaystackVerifyResponse {
  status:  boolean;
  message: string;
  data: {
    id:         number;
    status:     'success' | 'failed' | 'abandoned';
    reference:  string;
    amount:     number;   // kobo
    paid_at:    string;
    currency:   string;
    customer: {
      email: string;
      id:    number;
    };
    metadata?: Record<string, unknown>;
  };
}

// ─── Core verify function ─────────────────────────────────────────────────────

/**
 * Verify a Paystack transaction reference against Paystack's servers.
 * This is the authoritative check — never trust the client alone.
 *
 * @throws Error if the network request fails or Paystack returns an error
 */
export async function verifyPaystackTransaction(
  reference: string,
): Promise<PaystackVerifyResponse> {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    throw new Error('PAYSTACK_SECRET_KEY environment variable is not set.');
  }

  // Sanitise reference — prevent path traversal
  const safeRef = encodeURIComponent(reference.trim());
  if (!safeRef || safeRef.length > 100) {
    throw new Error('Invalid payment reference.');
  }

  const res = await fetch(`${PAYSTACK_BASE}/transaction/verify/${safeRef}`, {
    method:  'GET',
    headers: {
      Authorization:  `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
    },
    // 8-second timeout — well within Vercel's 10s limit
    signal: AbortSignal.timeout(8_000),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(
      `Paystack API error: HTTP ${res.status}${body ? ` — ${body.slice(0, 200)}` : ''}`,
    );
  }

  const data = await res.json() as PaystackVerifyResponse;

  if (!data.status) {
    throw new Error(`Paystack verification failed: ${data.message}`);
  }

  return data;
}

/**
 * Verify AND assert the transaction was successful with the expected amount.
 * Returns the verified data or throws a descriptive error.
 */
export async function verifyAndAssertPayment(
  reference:      string,
  expectedAmountNgn: number,
): Promise<PaystackVerifyResponse['data']> {
  const result = await verifyPaystackTransaction(reference);
  const tx     = result.data;

  // Must be 'success' — not 'failed', not 'abandoned'
  if (tx.status !== 'success') {
    throw new Error(
      `Payment not completed. Status: ${tx.status}. Please complete payment before activating.`,
    );
  }

  // Amount check: convert kobo to naira, allow ±1 naira rounding tolerance
  const paidNgn = tx.amount / 100;
  if (Math.abs(paidNgn - expectedAmountNgn) > 1) {
    console.error(
      `[paystack] Amount mismatch: paid ₦${paidNgn}, expected ₦${expectedAmountNgn}`,
    );
    throw new Error('Payment amount does not match the selected plan.');
  }

  return tx;
}

// ─── Reference generator ──────────────────────────────────────────────────────

/**
 * Generate a cryptographically unique Paystack reference on the server.
 * NEVER generate references on the client — they can be tampered.
 */
export function generateReference(prefix = 'UG'): string {
  // 16 random bytes = 32 hex chars — effectively impossible to guess
  const random = crypto.randomUUID().replace(/-/g, '').slice(0, 16).toUpperCase();
  const ts     = Date.now().toString(36).toUpperCase();
  return `${prefix}-${ts}-${random}`;
}
