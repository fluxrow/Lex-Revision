import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: "%s | Lex Revision",
    default: "Lex Revision | Contratos Prontos em Minutos",
  },
  description: "Plataforma avançada de revisão e geração de contratos utilizando inteligência artificial. Crie, revise e traduza contratos jurídicos em minutos.",
  keywords: ["contratos", "jurídico", "inteligência artificial", "revisão de contratos", "advocacia"],
  openGraph: {
    title: "Lex Revision | Contratos Prontos em Minutos",
    description: "Plataforma avançada de revisão e geração de contratos utilizando inteligência artificial.",
    type: "website",
    locale: "pt_BR",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${jetbrainsMono.variable}`} data-theme="dark">
      <body>
        {children}
      </body>
    </html>
  );
}
