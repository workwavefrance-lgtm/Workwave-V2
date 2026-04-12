"use client";

import { useState } from "react";

type FaqItem = { question: string; answer: string };

export default function FaqAccordion({ faqs }: { faqs: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (!faqs || faqs.length === 0) return null;

  return (
    <div className="mt-10">
      <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)] mb-6">
        Questions frequentes
      </h2>
      <div className="space-y-3">
        {faqs.map((faq, i) => (
          <div
            key={i}
            className="border border-[var(--card-border)] rounded-2xl overflow-hidden"
          >
            <button
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left bg-[var(--bg-secondary)] hover:bg-[var(--card-bg)] transition-colors duration-200"
            >
              <span className="text-sm font-medium text-[var(--text-primary)]">
                {faq.question}
              </span>
              <svg
                className={`w-5 h-5 shrink-0 text-[var(--text-tertiary)] transition-transform duration-200 ${
                  openIndex === i ? "rotate-180" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {openIndex === i && (
              <div className="px-6 py-4 text-sm text-[var(--text-secondary)] leading-relaxed">
                {faq.answer}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
