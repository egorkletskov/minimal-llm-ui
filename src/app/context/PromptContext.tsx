"use client";

import {
  businessPromptTemplates,
  type PromptTemplate,
} from "@/utils/business-workspaces";
import { createContext, useContext, useEffect, useState } from "react";

// create an interface for the prompt template
const PromptsContext = createContext<any>(null);

export function usePrompts() {
  return useContext(PromptsContext);
}

export function PromptsProvider({ children }: { children: React.ReactNode }) {
  const [promptTemplate, setPromptTemplate] = useState<PromptTemplate[]>([]);

  //add a state to manage the active prompt template
  const [activePromptTemplate, setActivePromptTemplate] =
    useState<PromptTemplate>();

  // Load prompts from local storage on component mount
  useEffect(() => {
    updatePromptTemplate();
  }, []);

  function updatePromptTemplate() {
    const storedPromptsString = localStorage.getItem("prompts");
    let storedPrompts: PromptTemplate[] = [];

    try {
      storedPrompts = storedPromptsString
        ? (JSON.parse(storedPromptsString) as PromptTemplate[])
        : [];
    } catch {
      storedPrompts = [];
    }

    const promptByName = new Map<string, PromptTemplate>();
    for (const prompt of [...businessPromptTemplates, ...storedPrompts]) {
      promptByName.set(prompt.name, prompt);
    }

    const mergedPrompts = [...promptByName.values()];
    setPromptTemplate(mergedPrompts);
    localStorage.setItem("prompts", JSON.stringify(mergedPrompts));
  }

  function addPromptTemplate(prompt: {
    name: string;
    content: string;
    inputs: string[];
  }) {
    const newPromptTemplate = [...promptTemplate, prompt];
    setPromptTemplate(newPromptTemplate);
    localStorage.setItem("prompts", JSON.stringify(newPromptTemplate));
  }

  const value = {
    promptTemplate,
    updatePromptTemplate,
    addPromptTemplate,
    activePromptTemplate,
    setActivePromptTemplate,
  };

  return (
    <PromptsContext.Provider value={value}>{children}</PromptsContext.Provider>
  );
}
