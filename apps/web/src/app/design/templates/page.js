const templates = [
  {
    title: "Open House Directional",
    category: "Real Estate",
    size: "18 × 24 in",
    description: "Bold directional layout with brokerage name, phone number, and high-visibility arrow.",
    preview: "OPEN HOUSE",
    accent: "#f59e0b",
  },
  {
    title: "For Sale Yard Sign",
    category: "Real Estate",
    size: "18 × 24 in",
    description: "Agent-forward yard sign with space for a logo, portrait, phone number, and website.",
    preview: "FOR SALE",
    accent: "#2563eb",
  },
  {
    title: "Under Contract Rider",
    category: "Real Estate",
    size: "6 × 24 in",
    description: "Single-line rider designed for fast vinyl cutting and easy reuse across listings.",
    preview: "UNDER CONTRACT",
    accent: "#dc2626",
  },
  {
    title: "Storefront Hours",
    category: "Business",
    size: "24 × 18 in",
    description: "Clean window-lettering layout for business name, hours, phone number, and web address.",
    preview: "BUSINESS HOURS",
    accent: "#10b981",
  },
  {
    title: "Contractor Vehicle Door",
    category: "Business",
    size: "24 × 12 in",
    description: "Simple two-color vehicle lettering layout with company name, trade, and phone number.",
    preview: "YOUR COMPANY",
    accent: "#f97316",
  },
  {
    title: "Team T-Shirt Front",
    category: "Apparel",
    size: "12 × 14 in",
    description: "Centered heat-transfer design area for schools, churches, teams, and community groups.",
    preview: "TEAM NAME",
    accent: "#8b5cf6",
  },
];

export default function TemplateLibraryPage() {
  return (
    <main className="appShell">
      <section className="pageHeader">
        <div>
          <p className="eyebrow">Phase 1 design tools</p>
          <h1 className="pageTitle">Template Library</h1>
          <p className="pageIntro">Start from a repeatable production layout instead of rebuilding common signs and apparel artwork from scratch.</p>
        </div>
        <a className="button primary" href="/design">Open blank editor</a>
      </section>

      <section className="templateLibraryGrid">
        {templates.map((template) => (
          <article className="templateCard" key={template.title}>
            <div className="templatePreview" style={{ "--template-accent": template.accent }}>
              <span>{template.category}</span>
              <strong>{template.preview}</strong>
              <small>{template.size}</small>
            </div>
            <div className="templateCardBody">
              <p className="eyebrow">{template.category}</p>
              <h2>{template.title}</h2>
              <p>{template.description}</p>
              <div className="templateCardActions">
                <a className="button primary compact" href="/design">Use template</a>
                <span>{template.size}</span>
              </div>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
