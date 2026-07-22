const modules = [
  {
    title: "Design Studio",
    description: "Create yard signs, riders, decals, apparel graphics, and cut-ready SVG artwork.",
    href: "/design",
    action: "Launch designer",
  },
  {
    title: "Customers",
    description: "Manage businesses, brokerages, agents, contacts, and saved brand assets.",
    href: "/customers",
    action: "Open customers",
  },
  {
    title: "Quotes",
    description: "Price signs, apparel, and sublimation jobs with repeatable product rules.",
    href: "/quotes",
    action: "Build a quote",
  },
  {
    title: "Artwork & Proofs",
    description: "Upload artwork, track revisions, collect comments, and record approvals.",
    href: "/design",
    action: "Open artwork",
  },
  {
    title: "Production",
    description: "Move jobs through design, cutting, printing, pressing, finishing, and delivery.",
    href: "/dashboard#production",
    action: "View production",
  },
  {
    title: "Inventory",
    description: "Track vinyl, substrates, garments, inks, blanks, and reorder points.",
    href: "/dashboard#inventory",
    action: "View inventory",
  },
];

export default function HomePage() {
  return (
    <main>
      <section className="hero">
        <p className="eyebrow">Sign, apparel, and promotional production</p>
        <h1>Build it. Approve it. Produce it.</h1>
        <p className="lede">
          SignForge brings customer management, quoting, artwork approval,
          production, inventory, and reordering into one dependable system.
        </p>
        <div className="heroActions">
          <a className="button primary" href="/design">
            Launch Design Studio
          </a>
          <a className="button secondary" href="/quotes">
            Create New Quote
          </a>
        </div>
      </section>

      <section className="audience" aria-label="Primary markets">
        <span>Real Estate</span>
        <span>Local Business</span>
        <span>Contractors</span>
        <span>Schools & Churches</span>
        <span>Sign Shops</span>
      </section>

      <section id="modules" className="modules">
        <div className="sectionHeading">
          <p className="eyebrow">SignForge workspace</p>
          <h2>Start with the tool you need</h2>
        </div>
        <div className="grid">
          {modules.map((module) => (
            <a className="card moduleLinkCard" href={module.href} key={module.title}>
              <div>
                <h3>{module.title}</h3>
                <p>{module.description}</p>
              </div>
              <strong>{module.action} →</strong>
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
