type SeoContentProps = {
  content: string;
};

function parseMarkdown(md: string): string {
  return (
    md
      // H3 (FAQ questions)
      .replace(
        /^### (.+)$/gm,
        '<h3 class="text-lg font-semibold text-[var(--text-primary)] mt-6 mb-2">$1</h3>'
      )
      // H2
      .replace(
        /^## (.+)$/gm,
        '<h2 class="text-xl font-bold text-[var(--text-primary)] mt-10 mb-4 first:mt-0">$1</h2>'
      )
      // Bold
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      // Paragraphs: split by double newlines
      .split(/\n\n+/)
      .map((block) => {
        const trimmed = block.trim();
        if (
          trimmed.startsWith("<h2") ||
          trimmed.startsWith("<h3") ||
          trimmed === ""
        ) {
          return trimmed;
        }
        return `<p class="text-[var(--text-secondary)] leading-relaxed mb-4">${trimmed.replace(/\n/g, "<br />")}</p>`;
      })
      .join("\n")
  );
}

export default function SeoContent({ content }: SeoContentProps) {
  const html = parseMarkdown(content);

  return (
    <section className="mt-16 pt-10 border-t border-[var(--border-color)]">
      <div
        className="max-w-3xl prose-custom"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </section>
  );
}
