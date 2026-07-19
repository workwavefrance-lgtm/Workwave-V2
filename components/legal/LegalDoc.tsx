import type { ReactNode } from "react";

/**
 * Rendu partagé des pages légales (CGU / CGV / mentions légales).
 *
 * Le contenu est passé sous forme de DONNÉES (chaînes JS), pas de JSX inline :
 * on évite ainsi l'échappement des apostrophes (react/no-unescaped-entities)
 * et les bugs de build sur du texte long. La mini-syntaxe supportée dans les
 * chaînes :
 *   - **gras**            → <strong>
 *   - [libellé](url)      → lien (target=_blank + rel si http)
 *   - contact@workwave.fr → auto-transformé en lien mailto
 */

export type LegalBlock = { p: string } | { ul: string[] };
export type LegalSection = { title: string; blocks: LegalBlock[] };

function autoLink(text: string, keyBase: string): ReactNode[] {
  const email = "contact@workwave.fr";
  if (!text.includes(email)) return [text];
  const parts = text.split(email);
  const nodes: ReactNode[] = [];
  parts.forEach((part, i) => {
    if (part) nodes.push(part);
    if (i < parts.length - 1) {
      nodes.push(
        <a
          key={`${keyBase}-m${i}`}
          href={`mailto:${email}`}
          className="text-[var(--accent)] hover:underline"
        >
          {email}
        </a>
      );
    }
  });
  return nodes;
}

function renderRich(text: string, keyBase: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const regex = /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)]+)\)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      nodes.push(...autoLink(text.slice(last, match.index), `${keyBase}-p${i}`));
    }
    if (match[1] !== undefined) {
      nodes.push(
        <strong
          key={`${keyBase}-b${i}`}
          className="font-semibold text-[var(--text-primary)]"
        >
          {autoLink(match[1], `${keyBase}-bi${i}`)}
        </strong>
      );
    } else {
      const label = match[2];
      const href = match[3];
      const external = href.startsWith("http");
      nodes.push(
        <a
          key={`${keyBase}-l${i}`}
          href={href}
          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          className="text-[var(--accent)] hover:underline"
        >
          {label}
        </a>
      );
    }
    last = regex.lastIndex;
    i++;
  }
  if (last < text.length) {
    nodes.push(...autoLink(text.slice(last), `${keyBase}-pend`));
  }
  return nodes;
}

export default function LegalDoc({
  title,
  lastUpdated,
  intro,
  sections,
  footerNote,
}: {
  title: string;
  lastUpdated?: string;
  intro?: string;
  sections: LegalSection[];
  footerNote?: string;
}) {
  return (
    <main className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)] mb-2">
        {title}
      </h1>
      {lastUpdated ? (
        <p className="text-sm text-[var(--text-tertiary)] mb-8">
          Dernière mise à jour : {lastUpdated}
        </p>
      ) : (
        <div className="mb-8" />
      )}
      <div className="bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-2xl p-6 sm:p-8 space-y-8 text-[var(--text-secondary)] leading-relaxed">
        {intro ? <p>{renderRich(intro, "intro")}</p> : null}
        {sections.map((s, si) => (
          <section key={si} className="space-y-3">
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">
              {s.title}
            </h2>
            {s.blocks.map((b, bi) =>
              "ul" in b ? (
                <ul key={bi} className="list-disc pl-5 space-y-1">
                  {b.ul.map((item, ii) => (
                    <li key={ii}>{renderRich(item, `${si}-${bi}-${ii}`)}</li>
                  ))}
                </ul>
              ) : (
                <p key={bi}>{renderRich(b.p, `${si}-${bi}`)}</p>
              )
            )}
          </section>
        ))}
        {footerNote ? (
          <p className="text-sm text-[var(--text-tertiary)] pt-2 border-t border-[var(--card-border)]">
            {renderRich(footerNote, "footer")}
          </p>
        ) : null}
      </div>
    </main>
  );
}
