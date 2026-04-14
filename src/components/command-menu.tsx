"use client";
import { usePrompts } from "@/app/context/PromptContext";
import { motion } from "framer-motion";

type Props = {
  showMenu: boolean;
  filterString: string;
};

export default function CommandMenu({ showMenu, filterString }: Props) {
  const { promptTemplate, setActivePromptTemplate } = usePrompts();
  const filteredTemplates = promptTemplate.filter(
    (template: { name: string }) =>
      template.name.toLowerCase().includes(filterString.toLowerCase()),
  );

  return (
    <>
      {showMenu && (
        <motion.div className="flex max-h-72 flex-col overflow-y-auto rounded-2xl border border-white/10 bg-[#070707]/95 p-2 text-sm font-normal text-white shadow-2xl shadow-black/40 backdrop-blur-xl">
          <div className="px-4 py-2 text-[10px] font-bold uppercase tracking-[0.24em] text-white/40">
            Prompt Packs
          </div>
          {filteredTemplates.map(
            (t: { name: string; content: string; inputs: string[] }) => (
              <motion.div
                animate={{ opacity: 1, height: "auto" }}
                className="cursor-pointer rounded-xl px-4 py-3 transition hover:bg-white/[0.06]"
                exit={{ opacity: 0, height: 0 }}
                initial={{ opacity: 0, height: 0 }}
                key={t.name}
                layout
                layoutId={t.name}
                onClick={() => setActivePromptTemplate(t)}
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="font-medium text-white">{t.name}</span>
                  <div className="inline-flex gap-x-1">
                    {t.inputs?.map((input: string) => (
                      <span
                        className="rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] text-white/60"
                        key={t.name + "-" + input}
                      >
                        {input.slice(5)}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-white/45 mt-1 line-clamp-2 text-xs leading-5">
                  {t.content}
                </p>
              </motion.div>
            ),
          )}
        </motion.div>
      )}
    </>
  );
}
