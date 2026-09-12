import { detectPii } from "../ai/detect-pii";
import type { AiQualification, Project, ProjectLead } from "../types/database";

type SourceProject = Pick<Project, "id" | "first_name" | "email" | "phone" | "description" | "urgency" | "budget" | "ai_qualification"> & {
  cleaned_description?: string | null;
  has_contact_in_description?: boolean | null;
  category: { name: string };
  city: { name: string; department: { code: string } | null } | null;
};

export type LeadDetailData = Pick<ProjectLead, "id" | "status" | "sent_at" | "contacted_at"> & {
  project: Pick<SourceProject, "id" | "first_name" | "email" | "phone" | "description" | "urgency" | "budget" | "category" | "city" | "ai_qualification">;
};

/** Liste explicite des données autorisées à traverser la frontière serveur/navigateur. */
export function toLeadDetailData(
  lead: Pick<ProjectLead, "id" | "status" | "sent_at" | "contacted_at"> & { project: SourceProject },
  unlocked: boolean,
): LeadDetailData {
  const p = lead.project;
  const text = (value: string) => unlocked ? value : detectPii(value).cleanedText;
  const sourceAi = p.ai_qualification;
  const ai: AiQualification | null = sourceAi ? {
    suggested_category: text(sourceAi.suggested_category),
    category_match: sourceAi.category_match,
    urgency_assessment: text(sourceAi.urgency_assessment),
    real_urgency: sourceAi.real_urgency,
    budget_realistic: sourceAi.budget_realistic,
    budget_comment: text(sourceAi.budget_comment),
    keywords: (sourceAi.keywords ?? []).map(text),
    summary: text(sourceAi.summary),
    suspicion_score: sourceAi.suspicion_score,
  } : null;
  return {
    id: lead.id,
    status: lead.status,
    sent_at: lead.sent_at,
    contacted_at: lead.contacted_at,
    project: {
      id: p.id,
      first_name: unlocked ? p.first_name : "",
      email: unlocked ? p.email : "",
      phone: unlocked ? p.phone : "",
      description: text(!unlocked && p.has_contact_in_description ? p.cleaned_description ?? "" : p.description),
      urgency: p.urgency,
      budget: p.budget,
      ai_qualification: ai,
      category: { name: p.category.name },
      city: p.city ? { name: p.city.name, department: p.city.department ? { code: p.city.department.code } : null } : null,
    },
  };
}
