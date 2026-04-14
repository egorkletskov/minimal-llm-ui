"use client";

import { ChatOllama } from "langchain/chat_models/ollama";
import { baseUrl } from "@/utils/constants";
import { useEffect, useRef, useState } from "react";

type Props = {
  documentName: string;
  setDocumentName: Function;
  activeModel: string;
  availableModels: any[];
  setActiveModel: Function;
  setOllama: Function;
  workspaceLabel: string;
};

export default function AppNavbar({
  documentName,
  setDocumentName,
  activeModel,
  availableModels,
  setActiveModel,
  setOllama,
  workspaceLabel,
}: Props) {
  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setDocumentName(value); // Call the callback function to update the parent component
  };

  useEffect(() => {
    const handleDocumentClick = (event: any) => {
      if (
        isShareMenuOpen &&
        shareMenuRef.current &&
        !shareMenuRef.current.contains(event.target)
      ) {
        setIsShareMenuOpen(false);
      }

      if (
        isProfileMenuOpen &&
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target)
      ) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener("click", handleDocumentClick);

    return () => {
      document.removeEventListener("click", handleDocumentClick);
    };
  }, [isShareMenuOpen, isProfileMenuOpen]);

  function toggleModel() {
    if (availableModels.length === 0) return;

    const i =
      (availableModels.findIndex((x) => x.name == activeModel) + 1) %
      availableModels.length;
    console.log(i, activeModel, availableModels);
    setActiveModel(availableModels[i].name);
    const newOllama = new ChatOllama({
      baseUrl: baseUrl,
      model: availableModels[i]?.name,
    });
    //store in local storage
    localStorage.setItem("initialLocalLM", availableModels[i]?.name);
    setOllama(newOllama);
  }

  const shareMenuRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <nav className="sticky left-0 top-0 z-20 w-full border-b border-white/10 bg-[#050505]/90 backdrop-blur-xl">
        <div className="mx-auto flex flex-wrap items-center justify-between gap-3 px-5 py-3 sm:px-8">
          <div className="flex items-center gap-4">
            <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-white/40">
              {workspaceLabel}
            </div>
            <input
              className="ring-none flex w-52 cursor-text items-center gap-x-2 rounded-md border-transparent bg-transparent px-2 py-1 text-xs font-medium text-white outline-none placeholder:text-white/50 hover:bg-white/10 sm:w-72"
              placeholder="New local session"
              value={documentName}
              onChange={handleInputChange}
            ></input>
          </div>
          <button
            className="cursor-pointer rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            contentEditable={false}
            onClick={toggleModel}
            type="button"
          >
            {activeModel || "Connect Ollama"}
          </button>
        </div>
      </nav>
    </>
  );
}
