import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import ModalSelector from "@/components/modal/modal-selector";
import { ModalProvider } from "./context/ModalContext";
import { PromptsProvider } from "./context/PromptContext";

const montserrat = Montserrat({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Local Business AI Console",
  description:
    "A minimal Ollama UI extended with business workspaces and prompt packs.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <ModalProvider>
        <PromptsProvider>
          <ModalSelector></ModalSelector>
          <body className={montserrat.className}>{children}</body>
        </PromptsProvider>
      </ModalProvider>
    </html>
  );
}
