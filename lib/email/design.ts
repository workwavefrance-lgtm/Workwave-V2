import { load } from "cheerio";

/** Shared, email-safe design. body is composed HTML; escape all user values. */
export function escapeEmail(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]!));
}

export function emailParagraph(text: string): string {
  return `<p style="margin:0 0 20px;font-size:16px;line-height:1.8;color:#53606a">${escapeEmail(text).replace(/\n/g, "<br>")}</p>`;
}

export function emailButton(label: string, url: string): string {
  if (!/^https?:\/\//i.test(url)) throw new Error("Email button requires an HTTP(S) URL");
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:28px 0"><tr><td bgcolor="#c64b1c" style="border-radius:100px;text-align:center;mso-padding-alt:16px 28px"><a href="${escapeEmail(url)}" style="display:inline-block;padding:16px 28px;border:1px solid #c64b1c;border-radius:100px;color:#ffffff;text-decoration:none;font-size:16px;font-weight:600;line-height:1.5">${escapeEmail(label)} &nbsp;→</a></td></tr></table>`;
}

export function emailDetails(rows: Array<[string, unknown]>): string {
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:24px 0;background:#f5f6f7;border-radius:22px;table-layout:fixed">${rows.map(([label, value]) => `<tr><td style="padding:14px 18px;width:30%;vertical-align:top;color:#66727c;font-size:14px;line-height:1.7">${escapeEmail(label)}</td><td style="padding:14px 18px;vertical-align:top;color:#20282c;font-size:15px;line-height:1.7;overflow-wrap:anywhere;word-break:break-word">${escapeEmail(value).replace(/\n/g, "<br>")}</td></tr>`).join("")}</table>`;
}

export function renderEmail(options: {
  title: string;
  subtitle?: string;
  preheader?: string;
  body: string;
  category?: string;
  locale?: "fr" | "en";
}): string {
  const en = options.locale === "en";
  const preview = options.preheader || [options.title, options.subtitle].filter(Boolean).join(" ");
  return `<!doctype html><html lang="${en ? "en" : "fr"}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${escapeEmail(options.title)} · Workwave</title><style>@media(max-width:480px){.ww-outer{padding:12px 8px!important}.ww-pad{padding-left:22px!important;padding-right:22px!important}.ww-title{font-size:30px!important;letter-spacing:-1px!important}.ww-content table{max-width:100%!important}.ww-content td{overflow-wrap:anywhere;word-break:break-word}}a:focus-visible{outline:3px solid #20282c;outline-offset:4px}</style></head>
<body style="margin:0;padding:0;background:#f1f3f4;color:#20282c;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;-webkit-text-size-adjust:100%">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all">${escapeEmail(preview)}</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td class="ww-outer" align="center" style="padding:32px 16px">
<!--[if mso]><table role="presentation" width="620"><tr><td><![endif]-->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:620px;background:#ffffff;border:1px solid #e7eaec;border-radius:30px;overflow:hidden">
<tr><td class="ww-pad" style="padding:36px 44px 30px"><p style="margin:0;font-size:27px;font-weight:700;letter-spacing:-1.2px">${en ? "Workwave AI" : 'workwave<span style="color:#c64b1c">.</span>fr'}</p></td></tr>
<tr><td class="ww-pad ww-content" style="padding:4px 44px 36px;overflow-wrap:anywhere;word-break:break-word">
<p style="margin:0 0 20px;color:#66727c;font-size:11px;font-weight:600;letter-spacing:1.8px;text-transform:uppercase">${escapeEmail(options.category || (en ? "Workwave AI" : "Workwave"))}</p>
<h1 class="ww-title" style="margin:0 0 26px;font-size:38px;line-height:1.15;letter-spacing:-1.5px;font-weight:650;color:#20282c">${escapeEmail(options.title)}${options.subtitle ? `<br><span style="color:#707c85">${escapeEmail(options.subtitle)}</span>` : ""}</h1>
${options.body}
</td></tr>
<tr><td style="padding:22px 28px;background:#fafbfc;border-top:1px solid #edf0f2;text-align:center;color:#66727c;font-size:12px;line-height:1.8">${en ? "The Workwave team" : "Un premier pas. Et ça commence."}<br><a href="mailto:contact@workwave.fr" style="color:#596670;text-decoration:underline">${en ? "Contact our team" : "Contacter l’équipe"}</a></td></tr></table>
<!--[if mso]></td></tr></table><![endif]-->
</td></tr></table></body></html>`;
}

/** Preserve actionable URLs in the text alternative, including signed links. */
export function emailContent(html: string): { html: string; text: string } {
  const $ = load(html);
  $("head,style,script,[style*='display:none']").remove();
  $("a").each((_, node) => {
    const a = $(node);
    const label = a.text().trim();
    const url = a.attr("href");
    a.replaceWith($("<span>").text(url && url !== label ? `${label} (${url})` : label));
  });
  $("br").replaceWith("\n");
  $("p,h1,h2,h3,tr,table,div,li").append("\n");
  $("td").append(" ");
  return { html, text: $("body").text().replace(/[ \t]+/g, " ").replace(/ *\n */g, "\n").replace(/\n{3,}/g, "\n\n").trim() };
}
