import { cache } from "react";
import Stripe from "stripe";

function getStripe(): Stripe | null {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  return new Stripe(process.env.STRIPE_SECRET_KEY, { typescript: true });
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type FinanceKPIs = {
  mrr: number;
  mrrDelta: number;
  arr: number;
  arrDelta: number;
  activeSubscribers: number;
  activeSubscribersDelta: number;
  churnRate: number;
  churnRateDelta: number;
  avgLtv: number;
  avgLtvDelta: number;
};

export type StripeTransaction = {
  id: string;
  amount: number;
  currency: string;
  customer_email: string | null;
  status: string;
  created: number;
};

export type TransactionsResult = {
  data: StripeTransaction[];
  hasMore: boolean;
};

export type MrrDataPoint = {
  date: string;
  mrr: number;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Sum of all active/trialing subscriptions amounts in euros */
async function computeMrr(stripe: Stripe): Promise<number> {
  let total = 0;
  let hasMore = true;
  let startingAfter: string | undefined;

  while (hasMore) {
    const page = await stripe.subscriptions.list({
      status: "active",
      limit: 100,
      expand: ["data.items.data.price"],
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });

    for (const sub of page.data) {
      for (const item of sub.items.data) {
        const price = item.price;
        const amount = price.unit_amount ?? 0;
        if (price.recurring?.interval === "year") {
          total += amount / 12;
        } else {
          total += amount;
        }
      }
    }

    // Also count trialing subscriptions
    const trialPage = await stripe.subscriptions.list({
      status: "trialing",
      limit: 100,
      expand: ["data.items.data.price"],
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });

    for (const sub of trialPage.data) {
      for (const item of sub.items.data) {
        const price = item.price;
        const amount = price.unit_amount ?? 0;
        if (price.recurring?.interval === "year") {
          total += amount / 12;
        } else {
          total += amount;
        }
      }
    }

    hasMore = page.has_more;
    if (hasMore && page.data.length > 0) {
      startingAfter = page.data[page.data.length - 1].id;
    } else {
      hasMore = false;
    }
  }

  return total / 100; // cents → euros
}

async function countActiveSubscribers(stripe: Stripe): Promise<number> {
  const [active, trialing] = await Promise.all([
    stripe.subscriptions.list({ status: "active", limit: 1 }),
    stripe.subscriptions.list({ status: "trialing", limit: 1 }),
  ]);
  // Stripe doesn't expose total_count directly; use list with limit 1 and check has_more
  // For a precise count we need to paginate — use a simpler approach via search count
  let count = 0;
  let hasMore = true;
  let startingAfter: string | undefined;

  while (hasMore) {
    const page = await stripe.subscriptions.list({
      status: "active",
      limit: 100,
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });
    count += page.data.length;
    hasMore = page.has_more;
    if (hasMore && page.data.length > 0) {
      startingAfter = page.data[page.data.length - 1].id;
    } else {
      hasMore = false;
    }
  }

  hasMore = true;
  startingAfter = undefined;
  while (hasMore) {
    const page = await stripe.subscriptions.list({
      status: "trialing",
      limit: 100,
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });
    count += page.data.length;
    hasMore = page.has_more;
    if (hasMore && page.data.length > 0) {
      startingAfter = page.data[page.data.length - 1].id;
    } else {
      hasMore = false;
    }
  }

  // suppress unused var warnings
  void active;
  void trialing;

  return count;
}

async function countCanceledLast30Days(stripe: Stripe): Promise<number> {
  const thirtyDaysAgo = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;
  let count = 0;
  let hasMore = true;
  let startingAfter: string | undefined;

  while (hasMore) {
    const page = await stripe.subscriptions.list({
      status: "canceled",
      limit: 100,
      created: { gte: thirtyDaysAgo },
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });
    count += page.data.length;
    hasMore = page.has_more;
    if (hasMore && page.data.length > 0) {
      startingAfter = page.data[page.data.length - 1].id;
    } else {
      hasMore = false;
    }
  }

  return count;
}

// ─── Exported query functions ─────────────────────────────────────────────────

export const getFinanceKPIs = cache(async (): Promise<FinanceKPIs> => {
  const zero: FinanceKPIs = {
    mrr: 0,
    mrrDelta: 0,
    arr: 0,
    arrDelta: 0,
    activeSubscribers: 0,
    activeSubscribersDelta: 0,
    churnRate: 0,
    churnRateDelta: 0,
    avgLtv: 0,
    avgLtvDelta: 0,
  };

  try {
    const stripe = getStripe();
    if (!stripe) return zero;

    const [mrr, activeSubscribers, canceledLast30d] = await Promise.all([
      computeMrr(stripe),
      countActiveSubscribers(stripe),
      countCanceledLast30Days(stripe),
    ]);

    const arr = mrr * 12;

    // Churn rate: canceled in last 30d / (active + canceled) * 100
    const totalAtStartOfMonth = activeSubscribers + canceledLast30d;
    const churnRate =
      totalAtStartOfMonth > 0
        ? (canceledLast30d / totalAtStartOfMonth) * 100
        : 0;

    // Avg LTV: simplified MRR / churnRate * 100  (months to churn = 1/churnRate)
    const avgLtv = churnRate > 0 ? (mrr / churnRate) * 100 : mrr * 24;

    // Previous month approximation: fetch invoices ~30-60 days ago
    // We approximate delta as a simple heuristic since Stripe has no native
    // "MRR at date X" endpoint. We use invoice volume as proxy for delta direction.
    const sixtyDaysAgo = Math.floor(Date.now() / 1000) - 60 * 24 * 60 * 60;
    const thirtyDaysAgo = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;

    const [prevMonthInvoices, currMonthInvoices] = await Promise.all([
      stripe.invoices.list({
        limit: 100,
        created: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
        status: "paid",
      }),
      stripe.invoices.list({
        limit: 100,
        created: { gte: thirtyDaysAgo },
        status: "paid",
      }),
    ]);

    const prevRevenue = prevMonthInvoices.data.reduce(
      (s, inv) => s + (inv.amount_paid ?? 0),
      0
    );
    const currRevenue = currMonthInvoices.data.reduce(
      (s, inv) => s + (inv.amount_paid ?? 0),
      0
    );

    function pctDelta(curr: number, prev: number): number {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return ((curr - prev) / prev) * 100;
    }

    const revenueDelta = pctDelta(currRevenue, prevRevenue);

    return {
      mrr,
      mrrDelta: revenueDelta,
      arr,
      arrDelta: revenueDelta,
      activeSubscribers,
      activeSubscribersDelta: 0, // not available without historical snapshot
      churnRate,
      churnRateDelta: 0,
      avgLtv,
      avgLtvDelta: 0,
    };
  } catch (err) {
    console.error("[admin-finances] getFinanceKPIs error:", err);
    return zero;
  }
});

export const getTransactions = cache(
  async (
    page = 1,
    limit = 25
  ): Promise<TransactionsResult> => {
    try {
      const stripe = getStripe();
      if (!stripe) return { data: [], hasMore: false };

      // Use invoices for a richer dataset (includes status paid/void/uncollectible)
      const offset = (page - 1) * limit;
      const invoices = await stripe.invoices.list({
        limit: Math.min(limit + 1, 100), // fetch one extra to detect hasMore
        expand: ["data.customer"],
        // Stripe invoices.list doesn't support offset; use starting_after for cursor
        // For simplicity at page=1 we list from latest; deep pagination needs cursor
        ...(offset > 0
          ? {} // deep pagination not natively supported without cursor; return empty beyond p1
          : {}),
      });

      // If page > 1 we'd need cursor-based pagination; return empty for now
      if (page > 1) {
        return { data: [], hasMore: false };
      }

      const hasMore = invoices.data.length > limit;
      const slice = invoices.data.slice(0, limit);

      const data: StripeTransaction[] = slice.map((inv) => {
        const customer = inv.customer as Stripe.Customer | null;
        return {
          id: inv.id,
          amount: (inv.amount_paid ?? 0) / 100,
          currency: inv.currency,
          customer_email: customer?.email ?? inv.customer_email ?? null,
          status: inv.status ?? "unknown",
          created: inv.created,
        };
      });

      return { data, hasMore };
    } catch (err) {
      console.error("[admin-finances] getTransactions error:", err);
      return { data: [], hasMore: false };
    }
  }
);

export const getMrrHistory = cache(async (): Promise<MrrDataPoint[]> => {
  try {
    const stripe = getStripe();
    if (!stripe) return [];

    const months: MrrDataPoint[] = [];
    const now = new Date();

    // Build last 12 months from paid invoices
    // Group invoice amounts by month
    const twelveMonthsAgo = new Date(now);
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const buckets: Record<string, number> = {};

    // Pre-fill 12 months with 0
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleDateString("fr-FR", {
        month: "short",
        year: "2-digit",
      });
      buckets[key] = 0;
    }

    let hasMore = true;
    let startingAfter: string | undefined;

    while (hasMore) {
      const page = await stripe.invoices.list({
        limit: 100,
        status: "paid",
        created: { gte: Math.floor(twelveMonthsAgo.getTime() / 1000) },
        ...(startingAfter ? { starting_after: startingAfter } : {}),
      });

      for (const inv of page.data) {
        const d = new Date(inv.created * 1000);
        const key = d.toLocaleDateString("fr-FR", {
          month: "short",
          year: "2-digit",
        });
        if (key in buckets) {
          buckets[key] += (inv.amount_paid ?? 0) / 100;
        }
      }

      hasMore = page.has_more;
      if (hasMore && page.data.length > 0) {
        startingAfter = page.data[page.data.length - 1].id;
      } else {
        hasMore = false;
      }
    }

    for (const [date, mrr] of Object.entries(buckets)) {
      months.push({ date, mrr });
    }

    return months;
  } catch (err) {
    console.error("[admin-finances] getMrrHistory error:", err);
    return [];
  }
});
