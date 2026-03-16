import "./globals.css";
import { getCurrentSessionServer } from "@/lib/server/auth";
import { getNotificationSummaryServer } from "@/lib/server/notifications";
import { Navbar } from "@/shared/components/Navbar";

export const metadata = {
  title: "Neplance",
  description: "Connect with world-class talent. Build remarkable projects.",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'><polygon points='100,30 60,140 140,140' fill='white'/><polygon points='60,140 40,140 70,90' fill='%23a1a1aa'/><polygon points='140,140 160,140 130,90' fill='%2371717a'/></svg>",
  },
};

export default async function RootLayout({ children }) {
  const session = await getCurrentSessionServer();
  const notificationSummary = session?.user
    ? await getNotificationSummaryServer()
    : { unreadCount: 0 };

  return (
    <html lang="en">
      <body>
        <Navbar
          activeRole={session?.activeRole}
          unreadCount={notificationSummary.unreadCount}
          user={session?.user}
        />
        {children}
      </body>
    </html>
  );
}
