import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VitaLink — Dossier médical numérique",
  description: "Dossier médical numérique souverain",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,600;0,9..40,700;0,9..40,800;1,9..40,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        style={{
          fontFamily: "'DM Sans','Segoe UI',sans-serif",
          background: "#080D1A",
          margin: 0,
          color: "#F1F5F9",
        }}
      >
        {children}
      </body>
    </html>
  );
}
