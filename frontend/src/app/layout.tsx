import type { Metadata } from "next";
import "./ui.css";
import { CompareTray, SiteFooter, SiteHeader } from "./components/Site";

export const metadata: Metadata = {
  title: "AI Car Advisor — ช่วยเลือกรถที่ใช่จากสิ่งที่สำคัญกับคุณ",
  description: "บอกว่าอะไรสำคัญกับคุณ แล้วดูว่ารถคันไหนในตลาดไทยเข้ากับคุณที่สุด พร้อมเหตุผลและที่มาของคะแนน",
  viewport: { width: "device-width", initialScale: 1 },
  themeColor: "#F3F5F7",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th">
      <body className="site-body">
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter />
        <CompareTray />
      </body>
    </html>
  );
}
