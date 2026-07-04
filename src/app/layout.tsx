import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Strata | Inbox Dashboard",
  description: "Inbox message hub for portfolio contact submissions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
