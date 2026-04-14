"use client";
import AppNavbar from "@/components/app-navbar";
import BusinessWorkspacePanel from "@/components/business-workspace-panel";
import CommandMenu from "@/components/command-menu";
import CommandTextInput from "@/components/command-text-input";
import ExpandingTextInput from "@/components/expanding-text-input";
import { CopyIcon } from "@/components/icons/copy-icon";
import { RefreshIcon } from "@/components/icons/refresh-icon";
import { SaveIcon } from "@/components/icons/save-icon";
import { TrashIcon } from "@/components/icons/trash-icon";
import Sidebar from "@/components/sidebar";
import { cn } from "@/utils/cn";
import { baseUrl, fallbackModel } from "@/utils/constants";
import generateRandomString from "@/utils/generateRandomString";
import {
  type BusinessPrompt,
  type BusinessWorkspaceId,
  businessWorkspaces,
  getBusinessWorkspace,
} from "@/utils/business-workspaces";
import { useCycle } from "framer-motion";
import { ChatOllama } from "langchain/chat_models/ollama";
import { AIMessage, HumanMessage } from "langchain/schema";
import { useEffect, useRef, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AppModal, useModal } from "./context/ModalContext";
import { usePrompts } from "./context/PromptContext";

export default function Home() {
  const { setModalConfig } = useModal();
  const { activePromptTemplate, setActivePromptTemplate } = usePrompts();
  const [newPrompt, setNewPrompt] = useState("");
  const [messages, setMessages] = useState<
    {
      type: string;
      id: any;
      timestamp: number;
      content: string;
      model?: string;
    }[]
  >([]);
  const [availableModels, setAvailableModels] = useState<any[]>([]);
  const [activeModel, setActiveModel] = useState<string>("");
  const [ollama, setOllama] = useState<ChatOllama>();
  const [conversations, setConversations] = useState<
    { title: string; filePath: string }[]
  >([]);
  const [activeConversation, setActiveConversation] = useState<string>("");
  const [activeWorkspaceId, setActiveWorkspaceId] =
    useState<BusinessWorkspaceId>("support-ops");
  const [menuState, toggleMenuState] = useCycle(false, true);
  const msgContainerRef = useRef<HTMLDivElement>(null);
  const activeWorkspace = getBusinessWorkspace(activeWorkspaceId);

  useEffect(() => {
    scrollToBottom();
  }, [activeConversation]);

  useEffect(() => {
    // Get the initial model
    getInitialModel();

    // Get existing conversations
    getExistingConvos();
  }, []);

  function getInitialModel() {
    fetch(`${baseUrl}/api/tags`)
      .then((response) => response.json())
      .then((data) => {
        const models = Array.isArray(data.models) ? data.models : [];
        setAvailableModels(models);

        if (models.length === 0) return;

        // get initial model from local storage
        const storedModel = localStorage.getItem("initialLocalLM");
        if (
          storedModel &&
          storedModel !== "" &&
          models.findIndex(
            (m: { name: string }) =>
              m.name.toLowerCase() === storedModel.toLowerCase(),
          ) > -1
        ) {
          setActiveModel(storedModel);
          const newOllama = new ChatOllama({
            baseUrl: baseUrl,
            model: storedModel,
          });
          setOllama(newOllama);
        } else {
          // set initial model to first model in list
          setActiveModel(models[0]?.name);
          const initOllama = new ChatOllama({
            baseUrl: baseUrl,
            model: models[0]?.name,
          });
          setOllama(initOllama);
        }
      })
      .catch(() => setAvailableModels([]));
  }

  function applyBusinessPrompt(prompt: BusinessPrompt) {
    setActivePromptTemplate(undefined);
    setNewPrompt(prompt.prompt);
  }

  function selectBusinessWorkspace(workspaceId: BusinessWorkspaceId) {
    const isPromptPackDraft = businessWorkspaces.some((workspace) =>
      workspace.prompts.some((prompt) => prompt.prompt === newPrompt),
    );

    if (isPromptPackDraft) {
      setNewPrompt("");
    }

    setActiveWorkspaceId(workspaceId);
  }

  async function getExistingConvos() {
    fetch("../api/fs/get-convos", {
      method: "POST", // or 'GET', 'PUT', etc.
      body: JSON.stringify({
        conversationPath: "./conversations",
      }),
      headers: {
        Accept: "*/*",
        "Content-Type": "application/json",
      },
    }).then((response) => {
      // console.log(response),
      response.json().then((data) => setConversations(data));
    });
  }

  async function triggerPrompt(input: string = newPrompt) {
    if (!ollama) return;
    scrollToBottom();
    if (messages.length == 0) getName(input);
    const msg = {
      type: "human",
      id: generateRandomString(8),
      timestamp: Date.now(),
      content: input,
    };
    const model = activeModel;
    let streamedText = "";
    messages.push(msg);
    const msgCache = [...messages];
    const stream = await ollama.stream(
      messages.map((m) =>
        m.type == "human"
          ? new HumanMessage(m.content)
          : new AIMessage(m.content),
      ),
    );
    setNewPrompt("");
    setActivePromptTemplate(undefined);
    let updatedMessages = [...msgCache];
    let c = 0;
    for await (const chunk of stream) {
      streamedText += chunk.content;
      const aiMsg = {
        type: "ai",
        id: generateRandomString(8),
        timestamp: Date.now(),
        content: streamedText,
        model,
      };
      updatedMessages = [...msgCache, aiMsg];
      setMessages(() => updatedMessages);
      c++;
      if (c % 8 == 0) scrollToBottom();
    }

    scrollToBottom();
    persistConvo(updatedMessages);
  }

  async function persistConvo(messages: any[]) {
    let name = activeConversation;
    if (name == "") {
      name = (await getName(newPrompt)).trim();
      // console.log(name.trim());
      setActiveConversation(name.trim());
    }

    fetch("../api/fs/persist-convo", {
      method: "POST", // or 'GET', 'PUT', etc.
      body: JSON.stringify({
        conversationPath: "./conversations",
        messages: messages,
        convoTitle: name.trim().replaceAll('"', ""),
        filename:
          name
            .toLowerCase()
            .replaceAll(" ", "_")
            .replaceAll(":", "-")
            .replaceAll('"', "") + ".json",
      }),
    }).then(() => getExistingConvos());
  }

  function deleteMessage(activeMsg: {
    type: string;
    id: any;
    timestamp: number;
    content: string;
    model?: string;
  }) {
    let filtered = messages.filter((m, i) => m.id != activeMsg.id);
    setMessages(() => filtered);
    persistConvo(filtered);
  }

  async function refreshMessage(activeMsg: {
    type: string;
    id: any;
    timestamp: number;
    content: string;
    model?: string;
  }) {
    if (!ollama) return;
    let index =
      messages.findIndex((m) => m.id == activeMsg.id) -
      (activeMsg.type == "human" ? 0 : 1);
    let filtered = messages.filter((m, i) => index >= i);
    // console.log("filtered", filtered);

    setMessages(() => filtered);
    // useEffect on change here if the last value was a human message?

    const model = activeModel;
    let streamedText = "";
    const msgCache = [...filtered];
    const stream = await ollama.stream(
      filtered.map((m) =>
        m.type == "human"
          ? new HumanMessage(m.content)
          : new AIMessage(m.content),
      ),
    );
    setNewPrompt("");
    let updatedMessages = [...msgCache];
    let c = 0;
    for await (const chunk of stream) {
      streamedText += chunk.content;
      const aiMsg = {
        type: "ai",
        id: generateRandomString(8),
        timestamp: Date.now(),
        content: streamedText,
        model,
      };
      updatedMessages = [...msgCache, aiMsg];
      setMessages(() => updatedMessages);
      c++;
      if (c % 8 == 0) scrollToBottom();
    }

    scrollToBottom();
    persistConvo(updatedMessages);
  }

  const scrollToBottom = () => {
    if (msgContainerRef.current) {
      msgContainerRef.current.scrollTo({
        top: msgContainerRef.current.scrollHeight + 10000,
        behavior: "smooth",
      });
    }
  };

  function getName(input: string) {
    const nameOllama = new ChatOllama({
      baseUrl: baseUrl,
      model:
        activeModel && activeModel.trim() !== "" ? activeModel : fallbackModel,
      verbose: false,
    });
    return nameOllama!
      .predict(
        "You're a tool, that receives an input and responds exclusively with a 2-5 word summary of the topic (and absolutely no prose) based specifically on the words used in the input (not the expected output). Each word in the summary should be carefully chosen so that it's perfecly informative - and serve as a perfect title for the input. Now, return the summary for the following input:\n" +
          input,
      )
      .then((name) => name);
  }

  return (
    <main className="relative flex max-h-screen min-h-screen w-screen max-w-[100vw] items-center justify-between overflow-hidden bg-[#050505]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_12%,rgba(34,211,238,0.12),transparent_28%),radial-gradient(circle_at_78%_16%,rgba(245,158,11,0.10),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent_42%)]" />
      <Sidebar
        activeConversation={activeConversation}
        conversations={conversations}
        menuState={menuState}
        setActiveConversation={setActiveConversation}
        setConversations={setConversations}
        setMessages={setMessages}
        setNewPrompt={setNewPrompt}
        toggleMenuState={toggleMenuState}
      />
      <div className="relative flex min-w-0 flex-1 flex-col">
        <AppNavbar
          documentName={activeConversation}
          setDocumentName={() => {}}
          activeModel={activeModel}
          availableModels={availableModels}
          setActiveModel={setActiveModel}
          setOllama={setOllama}
          workspaceLabel={activeWorkspace.label}
        />
        <div className="border-b border-white/10 px-4 py-3 xl:hidden">
          <div className="flex gap-2 overflow-x-auto">
            {businessWorkspaces.map((workspace) => (
              <button
                className={cn(
                  "text-white/55 whitespace-nowrap rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs",
                  activeWorkspace.id === workspace.id &&
                    "border-cyan-300/40 bg-cyan-300/10 text-cyan-100",
                )}
                key={workspace.id}
                onClick={() => selectBusinessWorkspace(workspace.id)}
                type="button"
              >
                {workspace.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex w-full flex-1 flex-shrink flex-col items-center justify-end gap-y-4 overflow-hidden whitespace-break-spaces">
          <div className="flex w-full flex-1 flex-col items-center justify-end gap-y-4 overflow-scroll whitespace-break-spaces">
            <div
              ref={msgContainerRef}
              className="block h-fit w-full flex-col items-center justify-center gap-y-1 overflow-scroll rounded-md p-4"
            >
              {messages.length === 0 && (
                <div className="mx-auto flex min-h-[calc(100vh-16rem)] w-full max-w-5xl flex-col justify-center">
                  <div className="max-w-3xl">
                    <p className="mb-4 inline-flex rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.26em] text-cyan-100">
                      {activeWorkspace.label}
                    </p>
                    <h1 className="text-balance text-5xl font-semibold tracking-[-0.06em] text-white md:text-7xl">
                      {activeWorkspace.title}
                    </h1>
                    <p className="text-white/52 mt-5 max-w-2xl text-base leading-7">
                      {activeWorkspace.subtitle}
                    </p>
                  </div>

                  <div className="mt-8 grid gap-3 md:grid-cols-3">
                    {activeWorkspace.prompts.map((prompt) => (
                      <button
                        className="group rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4 text-left shadow-2xl shadow-black/20 transition hover:-translate-y-1 hover:border-white/25 hover:bg-white/[0.075]"
                        key={prompt.title}
                        onClick={() => applyBusinessPrompt(prompt)}
                        type="button"
                      >
                        <span className="text-sm font-semibold text-white">
                          {prompt.title}
                        </span>
                        <span className="text-white/45 group-hover:text-white/65 mt-2 block text-xs leading-5">
                          {prompt.intent}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((msg) => (
                <div
                  key={"message-" + msg.id}
                  className={cn(
                    "flex h-fit max-w-[80%] cursor-pointer flex-col items-start gap-y-1 rounded-md px-2 py-1",
                    { "ml-auto": msg.type == "human" },
                    { "mr-auto": msg.type == "ai" },
                  )}
                >
                  <div
                    className={cn(
                      "flex h-fit max-w-full cursor-pointer flex-col items-center gap-y-1 rounded-md border border-[#191919] px-2 py-1",
                      { "ml-auto": msg.type == "human" },
                      { "mr-auto": msg.type == "ai" },
                    )}
                  >
                    <p className="mr-auto text-xs text-white/50">
                      {(msg?.model?.split(":")[0] || "user") +
                        " • " +
                        new Date(msg.timestamp).toLocaleDateString() +
                        " " +
                        new Date(msg.timestamp).toLocaleTimeString()}
                    </p>
                    <Markdown
                      remarkPlugins={[[remarkGfm, { singleTilde: false }]]}
                      className={
                        "mr-auto flex w-full flex-col text-sm text-white"
                      }
                    >
                      {msg.content.trim()}
                    </Markdown>
                  </div>
                  <div
                    className={cn(
                      "my-2 flex gap-x-1",
                      { "ml-auto": msg.type == "human" },
                      { "mr-auto": msg.type == "ai" },
                    )}
                  >
                    {msg.type == "human" && (
                      <SaveIcon
                        onClick={() => {
                          setModalConfig({
                            modal: AppModal.SAVE_PROMPT,
                            data: msg,
                          });
                        }}
                        className="h-4 w-4 fill-white/50 hover:fill-white/90"
                      />
                    )}
                    <RefreshIcon
                      onClick={() => refreshMessage(msg)}
                      className="h-4 w-4 fill-white/50 hover:fill-white/90"
                    />
                    <CopyIcon
                      onClick={() => {
                        navigator.clipboard.writeText(msg.content);
                      }}
                      className="h-4 w-4 fill-white/50 hover:fill-white/90"
                    />
                    <TrashIcon
                      onClick={() => {
                        deleteMessage(msg);
                      }}
                      className="h-4 w-4 fill-white/50 hover:fill-white/90"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-y-2 px-4">
          <CommandMenu
            showMenu={
              !activePromptTemplate &&
              !!newPrompt &&
              newPrompt.startsWith("/") &&
              newPrompt == "/" + newPrompt.replace(/[^a-zA-Z0-9_]/g, "")
            }
            filterString={newPrompt.substring(1)}
          />
          {/* TODO: Include Active Prompt Template when selected above so we know what's beind done or insert placeholder input as it's being populated */}
          <div className="mb-4 flex max-h-[200px] min-h-[56px] w-full flex-shrink-0 resize-none appearance-none overflow-hidden rounded-md text-sm font-normal text-white outline-0 focus:outline-0 focus:ring-white/10 md:flex">
            {activePromptTemplate ? (
              <>
                <CommandTextInput
                  onKeyDown={(x) => {
                    if (
                      x.e.key === "Enter" &&
                      !x.e.metaKey &&
                      !x.e.shiftKey &&
                      !x.e.altKey &&
                      newPrompt !== ""
                    ) {
                      triggerPrompt(x.input);
                    }
                  }}
                />
              </>
            ) : (
              <ExpandingTextInput
                onChange={(e: any) => {
                  if (e.target.value != "\n") setNewPrompt(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter" &&
                    !e.metaKey &&
                    !e.shiftKey &&
                    !e.altKey &&
                    newPrompt !== ""
                  ) {
                    triggerPrompt();
                  } else if (
                    e.key === "Enter" &&
                    (e.metaKey || !e.shiftKey || !e.altKey)
                  ) {
                    // console.log(e);
                  }
                }}
                value={newPrompt}
                placeholder={`Ask ${activeWorkspace.label.toLowerCase()} to analyze something...`}
              />
            )}
          </div>
        </div>
      </div>
      <BusinessWorkspacePanel
        activeModel={activeModel}
        activeWorkspace={activeWorkspace}
        onSelectWorkspace={selectBusinessWorkspace}
        onUsePrompt={applyBusinessPrompt}
      />
    </main>
  );
}
