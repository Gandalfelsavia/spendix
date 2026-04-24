import { Montserrat } from "next/font/google"
import "./globals.css"

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-montserrat",
})

export const metadata = {
  title: "Spendix — Scopri dove finiscono i tuoi soldi",
  description: "Analisi estratti conto bancari in 30 secondi. Carica il PDF e scopri subito dove vanno i tuoi soldi.",
}

export default function RootLayout({ children }) {
  return (
    <html lang="it" className={montserrat.variable}>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  )
}