export type BusinessWorkspaceId =
  | "support-ops"
  | "revenue-research"
  | "founder-briefing"
  | "engineering-review";

export type BusinessPrompt = {
  title: string;
  intent: string;
  prompt: string;
};

export type BusinessWorkspace = {
  id: BusinessWorkspaceId;
  label: string;
  title: string;
  subtitle: string;
  operator: string;
  modelHint: string;
  contextChecklist: string[];
  prompts: BusinessPrompt[];
};

export type PromptTemplate = {
  name: string;
  content: string;
  inputs: string[];
};

export const businessWorkspaces: BusinessWorkspace[] = [
  {
    id: "support-ops",
    label: "Support Ops",
    title: "Customer Escalation Desk",
    subtitle:
      "Turn raw tickets into priority, root cause, reply plan, and owner-ready action.",
    operator: "Support lead",
    modelHint:
      "Use a fast local model for routing, larger model for response QA",
    contextChecklist: [
      "Ticket text",
      "Customer tier",
      "SLA policy",
      "Recent order or account events",
    ],
    prompts: [
      {
        title: "Triage ticket",
        intent: "Classify urgency and owner",
        prompt:
          "Act as a senior support operations analyst. Triage this ticket into priority, customer sentiment, likely root cause, responsible owner, SLA risk, and the next two actions. Return a compact table and a draft internal note.\n\nTicket:\n",
      },
      {
        title: "Draft reply",
        intent: "Customer-safe response",
        prompt:
          "Write a concise customer support reply. Keep it calm, specific, and action-oriented. Include what we know, what we are checking, the next update time, and one clear ask if needed.\n\nContext:\n",
      },
      {
        title: "Find failure pattern",
        intent: "Extract recurring issue",
        prompt:
          "Review these support notes and extract recurring failure patterns. Group by product area, severity, likely cause, and recommended automation or engineering fix.\n\nNotes:\n",
      },
    ],
  },
  {
    id: "revenue-research",
    label: "Revenue Research",
    title: "B2B Lead Intelligence",
    subtitle:
      "Score accounts, prepare discovery notes, and produce sales-ready outreach angles.",
    operator: "Growth or sales team",
    modelHint: "Prefer factual local models and ask for uncertainty flags",
    contextChecklist: [
      "Company website",
      "Lead role",
      "Known pain points",
      "Product positioning",
    ],
    prompts: [
      {
        title: "Score lead",
        intent: "ICP fit and next action",
        prompt:
          "Act as a B2B revenue analyst. Score this lead from 0-100 for ICP fit, urgency, and buying intent. Explain the top signals, missing information, objections, and the next best action.\n\nLead context:\n",
      },
      {
        title: "Discovery brief",
        intent: "Prepare sales call",
        prompt:
          "Create a pre-call discovery brief for this account. Include business context, likely operational pain, relevant AI automation use cases, discovery questions, and a concise opening message.\n\nAccount:\n",
      },
      {
        title: "Outbound angle",
        intent: "Personalized message",
        prompt:
          "Write three short outbound angles for this prospect. Each angle should connect a concrete business pain to an AI automation outcome. Avoid hype and keep it executive-readable.\n\nProspect context:\n",
      },
    ],
  },
  {
    id: "founder-briefing",
    label: "Founder Briefing",
    title: "Executive Decision Room",
    subtitle:
      "Compress messy context into decisions, tradeoffs, risks, and next-step memos.",
    operator: "Founder or operator",
    modelHint: "Use a reasoning model when decisions have multiple tradeoffs",
    contextChecklist: [
      "Goal",
      "Constraints",
      "Options",
      "Timeline",
      "Known risks",
    ],
    prompts: [
      {
        title: "Decision memo",
        intent: "Options and tradeoffs",
        prompt:
          "Act as an operator writing a decision memo. Summarize the situation, options, tradeoffs, risks, recommendation, and a 7-day execution plan. Be direct and specific.\n\nContext:\n",
      },
      {
        title: "Risk review",
        intent: "Find weak assumptions",
        prompt:
          "Review this plan like a skeptical COO. Identify weak assumptions, execution risks, missing data, operational bottlenecks, and the cheapest validation steps.\n\nPlan:\n",
      },
      {
        title: "Investor update",
        intent: "Short weekly update",
        prompt:
          "Turn this raw weekly context into a crisp investor/operator update with wins, metrics, blockers, asks, and next week priorities.\n\nRaw notes:\n",
      },
    ],
  },
  {
    id: "engineering-review",
    label: "Engineering Review",
    title: "AI Systems Review",
    subtitle:
      "Review prompts, architectures, incidents, and implementation plans before shipping.",
    operator: "Engineering team",
    modelHint: "Use code-capable local models for implementation review",
    contextChecklist: [
      "System goal",
      "Architecture",
      "Failure cases",
      "Evaluation criteria",
      "Cost constraints",
    ],
    prompts: [
      {
        title: "Architecture critique",
        intent: "Review system design",
        prompt:
          "Review this AI automation architecture as a senior software engineer. Call out correctness risks, scaling risks, security concerns, observability gaps, and the smallest robust implementation path.\n\nArchitecture:\n",
      },
      {
        title: "Prompt QA",
        intent: "Improve prompt reliability",
        prompt:
          "Audit this production prompt. Identify ambiguity, injection risk, missing output constraints, evaluation gaps, and propose a tighter version with a test checklist.\n\nPrompt:\n",
      },
      {
        title: "Incident analysis",
        intent: "Root cause and fixes",
        prompt:
          "Analyze this AI workflow incident. Produce timeline, root cause hypotheses, immediate mitigation, long-term fix, monitoring signals, and regression tests.\n\nIncident notes:\n",
      },
    ],
  },
];

export const businessPromptTemplates: PromptTemplate[] = businessWorkspaces
  .flatMap((workspace) =>
    workspace.prompts.map((prompt) => ({
      name: `${workspace.label}: ${prompt.title}`,
      content: `${prompt.prompt}%var:context`,
      inputs: ["%var:context"],
    })),
  )
  .sort((a, b) => a.name.localeCompare(b.name));

export function getBusinessWorkspace(
  workspaceId: BusinessWorkspaceId,
): BusinessWorkspace {
  const fallbackWorkspace = businessWorkspaces[0];

  if (!fallbackWorkspace) {
    throw new Error("No business workspaces configured");
  }

  return (
    businessWorkspaces.find((workspace) => workspace.id === workspaceId) ||
    fallbackWorkspace
  );
}
