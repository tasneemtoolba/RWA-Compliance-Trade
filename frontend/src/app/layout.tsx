import "./globals.css";
import { Providers } from "@/lib/providers";
import { AppShell } from "@/components/AppShell";

export const metadata = { title: "CloakSwap", description: "Private Compliance AMM" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
