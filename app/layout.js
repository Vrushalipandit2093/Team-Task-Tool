import "./globals.css";

export const metadata = {
  title: "Team Task Manager",
  description: "Daily task assignment, tracking, and reminders for teams.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
