const modules = [
  {
    title: "Customers",
    description: "Manage businesses, brokerages, agents, contacts, and saved brand assets.",
  },
  {
    title: "Quotes",
    description: "Price signs, apparel, and sublimation jobs with repeatable product rules.",
  },
  {
    title: "Artwork & Proofs",
    description: "Upload artwork, track revisions, collect comments, and record approvals.",
  },
  {
    title: "Production",
    description: "Move jobs through design, cutting, printing, pressing, finishing, and delivery.",
  },
  {
    title: "Inventory",
    description: "Track vinyl, substrates, garments, inks, blanks, and reorder points.",
  },
  {
    title: "Machine Bridge",
    description: "Prepare for direct local control of the Roland CAMM-1 GS-24.",
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
          <a className="button primary" href="#modules">
            Explore the MVP
          </a>
          <a className="button secondary" href="/docs/product-requirements.md">
            Product requirements
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
          <p className="eyebrow">MVP foundation</p>
          <h2>The complete job workflow</h2>
        </div>
        <div className="grid">
          {modules.map((module) => (
            <article className="card" key={module.title}>
              <h3>{module.title}</h3>
              <p>{module.description}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
