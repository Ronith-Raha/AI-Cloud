import type { ReactNode } from "react";

export const metadata = {
  title: "AI Cloud Backend",
  description: "Backend-only API for multi-provider chat memory."
};

export default function RootLayout({
  children
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

