import "./globals.css";

export const metadata = {
  title: "SignForge",
  description: "Sign, apparel, and promotional production management",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
