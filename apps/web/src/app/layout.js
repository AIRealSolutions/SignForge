import "./globals.css";

export const metadata = {
  title: "SignForge",
  description: "Sign, apparel, and promotional production management",
};

const navigation = [
  ["Dashboard", "/dashboard"],
  ["Customers", "/customers"],
  ["Quotes", "/quotes"],
  ["Production", "/dashboard#production"],
  ["Inventory", "/dashboard#inventory"],
];

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <header className="siteHeader">
          <a className="brand" href="/">
            <span className="brandMark">SF</span>
            <span>SignForge</span>
          </a>
          <nav className="siteNav" aria-label="Main navigation">
            {navigation.map(([label, href]) => (
              <a href={href} key={label}>{label}</a>
            ))}
          </nav>
          <a className="button primary compact" href="/quotes">New quote</a>
        </header>
        {children}
      </body>
    </html>
  );
}
