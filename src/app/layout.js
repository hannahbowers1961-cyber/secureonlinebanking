import "./globals.css";

export const metadata = {
  title: "Apex Global Vault",
  description: "Secure Wealth Management",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}