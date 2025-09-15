import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import ClientOnly from "@/components/ClientOnly"
import { ThemeProvider } from "@/contexts/ThemeContext"
import { AuthProvider } from "@/contexts/AuthContext"
import { InvitationProvider } from "@/contexts/InvitationContext"
import { ProcessingProvider } from "@/contexts/ProcessingContext"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "MotionLabs AI - Gymnastics Analytics",
  description: "Advanced AI-powered gymnastics motion analysis and performance tracking",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <div id="root">
          <ClientOnly>
            <ThemeProvider>
              <AuthProvider>
                <InvitationProvider>
                  <ProcessingProvider>
                    {children}
                  </ProcessingProvider>
                </InvitationProvider>
              </AuthProvider>
            </ThemeProvider>
          </ClientOnly>
        </div>
      </body>
    </html>
  )
}
