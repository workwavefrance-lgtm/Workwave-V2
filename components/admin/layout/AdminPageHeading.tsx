import type { ReactNode } from "react";

export default function AdminPageHeading({ eyebrow, title, subtitle, description, actions }: {
  eyebrow: string; title: string; subtitle: string; description?: ReactNode; actions?: ReactNode;
}) {
  return <div className="admin-page-heading">
    <div><p className="admin-eyebrow">{eyebrow}</p><h1>{title}<span>{subtitle}</span></h1>
      {description && <div className="admin-page-description">{description}</div>}
    </div>{actions && <div className="shrink-0">{actions}</div>}
  </div>;
}
