const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

type BrevoAttachment = {
  name: string;
  content: string; // base64
};

type BrevoSendParams = {
  to: string;
  subject: string;
  htmlContent: string;
  attachments?: BrevoAttachment[];
};

type BrevoResponse = {
  messageId: string;
};

/**
 * Envoie un email via l'API transactionnelle Brevo.
 * Retry avec backoff exponentiel (3 tentatives max).
 */
export async function sendBrevoEmail(
  params: BrevoSendParams
): Promise<BrevoResponse> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    throw new Error("BREVO_API_KEY is not configured");
  }

  const senderEmail =
    process.env.BREVO_SENDER_EMAIL || "contact@workwave.fr";
  const senderName = process.env.BREVO_SENDER_NAME || "Willy Gauvrit";

  const body: Record<string, unknown> = {
    sender: { name: senderName, email: senderEmail },
    to: [{ email: params.to }],
    subject: params.subject,
    htmlContent: params.htmlContent,
    headers: {
      "X-Mailin-Tag": "cold-email",
      "X-Mailin-Track-Click": "0",
      "X-Mailin-Track-Open": "0",
    },
  };

  if (params.attachments && params.attachments.length > 0) {
    body.attachment = params.attachments.map((a) => ({
      name: a.name,
      content: a.content,
    }));
  }

  const delays = [1000, 4000, 16000]; // backoff exponentiel
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(BREVO_API_URL, {
        method: "POST",
        headers: {
          "api-key": apiKey,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
      });

      if (res.status === 429) {
        // Rate limit — respecter Retry-After
        const retryAfter = res.headers.get("Retry-After");
        const waitMs = retryAfter ? parseInt(retryAfter) * 1000 : delays[attempt];
        await sleep(waitMs);
        continue;
      }

      if (!res.ok) {
        const errorBody = await res.text();
        throw new Error(
          `Brevo API error ${res.status}: ${errorBody}`
        );
      }

      const data = await res.json();
      return { messageId: data.messageId };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < 2) {
        await sleep(delays[attempt]);
      }
    }
  }

  throw lastError || new Error("Brevo: echec apres 3 tentatives");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
