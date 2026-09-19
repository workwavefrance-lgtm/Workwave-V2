import { sanitizeAcquisition } from './acquisition';

type ObservedEvent = { event_name: string; created_at: string; project_id: number | null; metadata: { acquisition?: unknown } | null };
export type AcquisitionRow = { path: string; family: string; sessions: number; ctaSessions: number; startedSessions: number; projects: number };
export type AcquisitionReport = { pages: AcquisitionRow[]; attributedProjects: number; unattributedProjects: number };

/** Independent volumes within the selected period, never an invented conversion rate.
 * Project IDs must also exist in the valid-project query (not just a browser event).
 * Validate an old attribution at its event date, not at report generation time.
 */
export function acquisitionReport(events: ObservedEvent[], validProjectIds: number[]): AcquisitionReport {
  const valid = new Set(validProjectIds), attributed = new Set<number>();
  const pages = new Map<string, { row: AcquisitionRow; sessions: Set<string>; ctas: Set<string>; starts: Set<string> }>();
  for (const event of events) {
    if (!['page_view', 'project_cta_clicked', 'project_form_viewed', 'project_form_started', 'project_step_reached', 'project_form_submitted'].includes(event.event_name)) continue;
    const time = Date.parse(event.created_at);
    if (!Number.isFinite(time)) continue;
    const context = sanitizeAcquisition(event.metadata?.acquisition, time);
    if (!context) continue;
    let page = pages.get(context.entryPath);
    if (!page) {
      page = { row: { path: context.entryPath, family: context.entryFamily, sessions: 0, ctaSessions: 0, startedSessions: 0, projects: 0 }, sessions: new Set(), ctas: new Set(), starts: new Set() };
      pages.set(context.entryPath, page);
    }
    page.sessions.add(context.sessionId);
    if (event.event_name === 'project_cta_clicked') page.ctas.add(context.sessionId);
    if (event.event_name === 'project_form_started') page.starts.add(context.sessionId);
    if (event.event_name === 'project_form_submitted' && event.project_id !== null && valid.has(event.project_id) && !attributed.has(event.project_id)) {
      attributed.add(event.project_id);
      page.row.projects++;
    }
  }
  return {
    pages: [...pages.values()].map(p => ({ ...p.row, sessions: p.sessions.size, ctaSessions: p.ctas.size, startedSessions: p.starts.size }))
      .sort((a,b) => b.projects-a.projects || b.startedSessions-a.startedSessions || b.sessions-a.sessions || a.path.localeCompare(b.path)).slice(0,30),
    attributedProjects: attributed.size,
    unattributedProjects: valid.size-attributed.size,
  };
}
