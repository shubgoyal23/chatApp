import { randomUUID } from "node:crypto";

const MAX_ATTEMPTS = 3;
const MAX_WAIT_SECONDS = 5;

// Sends an email through the Email Worker HTTP API (see email.md).
// The same job_id is reused on every retry so the email is never queued twice.
export async function sendEmail(email, jobId = randomUUID()) {
   const { EMAIL_WORKER_URL, EMAIL_WORKER_KEY } = process.env;
   if (!EMAIL_WORKER_URL || !EMAIL_WORKER_KEY) {
      throw new Error("EMAIL_WORKER_URL and EMAIL_WORKER_KEY must be set");
   }

   for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const res = await fetch(`${EMAIL_WORKER_URL}/emails`, {
         method: "POST",
         headers: {
            Authorization: `Bearer ${EMAIL_WORKER_KEY}`,
            "Content-Type": "application/json",
         },
         body: JSON.stringify({ job_id: jobId, ...email }),
         signal: AbortSignal.timeout(10000),
      }).catch(() => null); // network error → retry

      if (res && (res.status === 200 || res.status === 202)) {
         return (await res.json()).job_id;
      }
      if (res && res.status < 500 && res.status !== 429) {
         const body = await res.json().catch(() => ({}));
         throw new Error(`email rejected: ${res.status} ${body.error ?? ""}`);
      }
      if (attempt === MAX_ATTEMPTS) break;

      const wait = Math.min(
         Number(res?.headers.get("retry-after")) || 2 ** attempt,
         MAX_WAIT_SECONDS
      );
      await new Promise((r) => setTimeout(r, wait * 1000));
   }
   throw new Error("email API unavailable");
}
