import "./globals.css"; import type { Metadata } from "next";
export const metadata: Metadata={title:"eSuport One",description:"One platform. Every conversation."};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
