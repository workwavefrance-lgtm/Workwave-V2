type SeoContentProps = {
  content: string;
};

/** Strip dangerous HTML tags and event handlers */
function sanitize(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "")
    .replace(/<embed\b[^>]*>/gi, "")
    .replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "");
}

/** Parse inline markdown: bold, italic, links */
function parseInline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, "<em>$1</em>")
    .replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" class="text-[var(--accent)] hover:underline" rel="noopener noreferrer">$1</a>'
    );
}

/** Generate an anchor id from a heading title */
function toAnchor(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function parseMarkdown(md: string): string {
  const lines = md.split("\n");
  const output: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const trimmed = lines[i].trim();

    // Empty line — skip
    if (trimmed === "") {
      i++;
      continue;
    }

    // H2 with anchor id (for table of contents links)
    const h2Match = trimmed.match(/^## (.+)$/);
    if (h2Match) {
      const title = h2Match[1];
      const anchor = toAnchor(title);
      output.push(
        `<h2 id="${anchor}" class="text-xl font-bold text-[var(--text-primary)] mt-10 mb-4 first:mt-0">${parseInline(title)}</h2>`
      );
      i++;
      continue;
    }

    // H3
    const h3Match = trimmed.match(/^### (.+)$/);
    if (h3Match) {
      output.push(
        `<h3 class="text-lg font-semibold text-[var(--text-primary)] mt-6 mb-2">${parseInline(h3Match[1])}</h3>`
      );
      i++;
      continue;
    }

    // Unordered list (- item or * item)
    if (/^[-*] /.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*] /.test(lines[i].trim())) {
        items.push(parseInline(lines[i].trim().replace(/^[-*] /, "")));
        i++;
      }
      output.push(
        `<ul class="list-disc list-inside space-y-1 text-[var(--text-secondary)] leading-relaxed mb-4 ml-2">${items.map((it) => `<li>${it}</li>`).join("")}</ul>`
      );
      continue;
    }

    // Ordered list (1. item)
    if (/^\d+\. /.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\. /.test(lines[i].trim())) {
        items.push(parseInline(lines[i].trim().replace(/^\d+\. /, "")));
        i++;
      }
      output.push(
        `<ol class="list-decimal list-inside space-y-1 text-[var(--text-secondary)] leading-relaxed mb-4 ml-2">${items.map((it) => `<li>${it}</li>`).join("")}</ol>`
      );
      continue;
    }

    // Table (| col | col |)
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      const rows: string[][] = [];
      while (
        i < lines.length &&
        lines[i].trim().startsWith("|") &&
        lines[i].trim().endsWith("|")
      ) {
        const rowLine = lines[i].trim();
        // Skip separator row (|---|---|)
        if (/^\|[\s\-:|]+\|$/.test(rowLine)) {
          i++;
          continue;
        }
        const cells = rowLine
          .split("|")
          .slice(1, -1)
          .map((c) => parseInline(c.trim()));
        rows.push(cells);
        i++;
      }
      if (rows.length > 0) {
        let tableHtml =
          '<div class="overflow-x-auto mb-6"><table class="w-full text-sm text-[var(--text-secondary)] border-collapse">';
        // First row as header
        tableHtml += "<thead><tr>";
        for (const cell of rows[0]) {
          tableHtml += `<th class="text-left font-semibold text-[var(--text-primary)] px-4 py-2 border-b border-[var(--border-color)]">${cell}</th>`;
        }
        tableHtml += "</tr></thead>";
        // Body
        if (rows.length > 1) {
          tableHtml += "<tbody>";
          for (let r = 1; r < rows.length; r++) {
            tableHtml += "<tr>";
            for (const cell of rows[r]) {
              tableHtml += `<td class="px-4 py-2 border-b border-[var(--border-color)]">${cell}</td>`;
            }
            tableHtml += "</tr>";
          }
          tableHtml += "</tbody>";
        }
        tableHtml += "</table></div>";
        output.push(tableHtml);
      }
      continue;
    }

    // Blockquote (> text)
    if (trimmed.startsWith("> ")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("> ")) {
        quoteLines.push(parseInline(lines[i].trim().replace(/^> /, "")));
        i++;
      }
      output.push(
        `<blockquote class="border-l-4 border-[var(--accent)] pl-4 py-2 my-4 text-[var(--text-secondary)] italic">${quoteLines.join("<br />")}</blockquote>`
      );
      continue;
    }

    // Horizontal rule
    if (/^[-*_]{3,}$/.test(trimmed)) {
      output.push('<hr class="my-8 border-[var(--border-color)]" />');
      i++;
      continue;
    }

    // Paragraph — collect consecutive non-special lines
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !/^#{2,3} /.test(lines[i].trim()) &&
      !/^[-*] /.test(lines[i].trim()) &&
      !/^\d+\. /.test(lines[i].trim()) &&
      !(lines[i].trim().startsWith("|") && lines[i].trim().endsWith("|")) &&
      !lines[i].trim().startsWith("> ") &&
      !/^[-*_]{3,}$/.test(lines[i].trim())
    ) {
      paraLines.push(lines[i].trim());
      i++;
    }
    if (paraLines.length > 0) {
      output.push(
        `<p class="text-[var(--text-secondary)] leading-relaxed mb-4">${parseInline(paraLines.join(" "))}</p>`
      );
    }
  }

  return sanitize(output.join("\n"));
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
