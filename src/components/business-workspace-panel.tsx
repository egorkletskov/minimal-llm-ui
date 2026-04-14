"use client";

import {
  type BusinessPrompt,
  type BusinessWorkspace,
  type BusinessWorkspaceId,
  businessWorkspaces,
} from "@/utils/business-workspaces";
import { cn } from "@/utils/cn";
import { motion } from "framer-motion";

type Props = {
  activeWorkspace: BusinessWorkspace;
  activeModel: string;
  onSelectWorkspace: (workspaceId: BusinessWorkspaceId) => void;
  onUsePrompt: (prompt: BusinessPrompt) => void;
};

const workspaceAccent: Record<BusinessWorkspaceId, string> = {
  "engineering-review": "border-sky-300/40 bg-sky-300/10 text-sky-100",
  "founder-briefing": "border-amber-300/40 bg-amber-300/10 text-amber-100",
  "revenue-research":
    "border-emerald-300/40 bg-emerald-300/10 text-emerald-100",
  "support-ops": "border-cyan-300/40 bg-cyan-300/10 text-cyan-100",
};

export default function BusinessWorkspacePanel({
  activeWorkspace,
  activeModel,
  onSelectWorkspace,
  onUsePrompt,
}: Props) {
  return (
    <aside className="hidden min-h-screen w-[25rem] shrink-0 border-l border-white/10 bg-[#050505]/95 px-5 py-5 text-white xl:flex xl:flex-col">
      <div>
        <p className="text-white/35 text-[10px] font-semibold uppercase tracking-[0.34em]">
          Local Business Console
        </p>
        <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em]">
          Workspace Mode
        </h2>
        <p className="text-white/45 mt-2 text-sm leading-6">
          Opinionated prompt packs for running private Ollama models against
          real business work.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-2">
        {businessWorkspaces.map((workspace) => (
          <button
            className={cn(
              "text-white/55 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3 text-left text-xs transition hover:border-white/25 hover:bg-white/[0.06]",
              activeWorkspace.id === workspace.id &&
                workspaceAccent[workspace.id],
            )}
            key={workspace.id}
            onClick={() => onSelectWorkspace(workspace.id)}
            type="button"
          >
            <span className="block font-semibold text-white">
              {workspace.label}
            </span>
            <span className="mt-1 block leading-4">{workspace.operator}</span>
          </button>
        ))}
      </div>

      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="mt-6 rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-5 shadow-2xl shadow-black/30"
        initial={{ opacity: 0, y: 10 }}
        key={activeWorkspace.id}
        transition={{ duration: 0.22 }}
      >
        <div
          className={cn(
            "inline-flex rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em]",
            workspaceAccent[activeWorkspace.id],
          )}
        >
          {activeWorkspace.label}
        </div>
        <h3 className="mt-4 text-xl font-semibold tracking-[-0.03em]">
          {activeWorkspace.title}
        </h3>
        <p className="text-white/55 mt-2 text-sm leading-6">
          {activeWorkspace.subtitle}
        </p>

        <div className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-4">
          <p className="text-white/35 text-[10px] font-semibold uppercase tracking-[0.24em]">
            Model note
          </p>
          <p className="mt-2 text-sm leading-5 text-white/70">
            {activeModel || "No local model selected"}
          </p>
          <p className="mt-1 text-xs leading-5 text-white/40">
            {activeWorkspace.modelHint}
          </p>
        </div>
      </motion.div>

      <div className="mt-6">
        <p className="text-white/35 text-[10px] font-semibold uppercase tracking-[0.28em]">
          Context checklist
        </p>
        <div className="mt-3 grid gap-2">
          {activeWorkspace.contextChecklist.map((item) => (
            <div
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.025] px-3 py-2 text-sm text-white/60"
              key={item}
            >
              <span className="size-1.5 bg-white/35 rounded-full" />
              {item}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 min-h-0 flex-1">
        <p className="text-white/35 text-[10px] font-semibold uppercase tracking-[0.28em]">
          Prompt pack
        </p>
        <div className="mt-3 grid gap-2">
          {activeWorkspace.prompts.map((prompt) => (
            <button
              className="group rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-left transition hover:border-white/25 hover:bg-white/[0.07]"
              key={prompt.title}
              onClick={() => onUsePrompt(prompt)}
              type="button"
            >
              <span className="block text-sm font-semibold text-white">
                {prompt.title}
              </span>
              <span className="text-white/45 group-hover:text-white/65 mt-1 block text-xs leading-5">
                {prompt.intent}
              </span>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
