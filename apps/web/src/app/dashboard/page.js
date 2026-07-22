const stats = [
  ["Open quotes", "12", "$18,460"],
  ["Proofs awaiting approval", "5", "2 overdue"],
  ["Jobs in production", "9", "4 due this week"],
  ["Ready for pickup", "3", "$1,285 balance"],
];

const jobs = [
  { id: "SF-1008", customer: "Lightkeeper Realty", item: "18×24 yard signs + riders", stage: "Cutting", due: "Today" },
  { id: "SF-1009", customer: "Cape Fear Builders", item: "Truck door lettering", stage: "Proof approval", due: "Tomorrow" },
  { id: "SF-1010", customer: "Southport Coffee Co.", item: "Storefront hours + decals", stage: "Design", due: "Jul 25" },
  { id: "SF-1011", customer: "Oak Island Athletics", item: "36 screen-printed shirts", stage: "Garments ordered", due: "Jul 29" },
];

const pipeline = [
  ["New request", 4],
  ["Design", 3],
  ["Approval", 5],
  ["Production", 9],
  ["Ready", 3],
];

export default function DashboardPage() {
  return (
    <main className="dashboardShell">
      <section className="dashboardHeader">
        <div>
          <p className="eyebrow">Production command center</p>
          <h1 className="dashboardTitle">Good evening, Marc.</h1>
          <p className="lede">Here is what needs attention across signs, apparel, and sublimation.</p>
        </div>
        <div className="dashboardActions" id="new-job">
          <a className="button secondary" href="#quotes">Create quote</a>
          <a className="button primary" href="#production">Start production job</a>
        </div>
      </section>

      <section className="statGrid" aria-label="Business overview">
        {stats.map(([label, value, note]) => (
          <article className="statCard" key={label}>
            <p>{label}</p>
            <strong>{value}</strong>
            <span>{note}</span>
          </article>
        ))}
      </section>

      <section className="dashboardGrid">
        <article className="panel panelWide" id="production">
          <div className="panelHeading">
            <div>
              <p className="eyebrow">Active work</p>
              <h2>Production queue</h2>
            </div>
            <a href="#">View all jobs</a>
          </div>
          <div className="jobTable" role="table" aria-label="Production jobs">
            <div className="jobRow jobHead" role="row">
              <span>Job</span><span>Customer</span><span>Product</span><span>Stage</span><span>Due</span>
            </div>
            {jobs.map((job) => (
              <div className="jobRow" role="row" key={job.id}>
                <strong>{job.id}</strong>
                <span>{job.customer}</span>
                <span>{job.item}</span>
                <span><em className="statusPill">{job.stage}</em></span>
                <span>{job.due}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="panel" id="quotes">
          <div className="panelHeading">
            <div>
              <p className="eyebrow">Workflow</p>
              <h2>Job pipeline</h2>
            </div>
          </div>
          <div className="pipelineList">
            {pipeline.map(([label, count]) => (
              <div className="pipelineItem" key={label}>
                <span>{label}</span>
                <strong>{count}</strong>
              </div>
            ))}
          </div>
        </article>

        <article className="panel" id="inventory">
          <div className="panelHeading">
            <div>
              <p className="eyebrow">Materials</p>
              <h2>Low inventory</h2>
            </div>
          </div>
          <ul className="attentionList">
            <li><span>24-inch white calendared vinyl</span><strong>18 ft</strong></li>
            <li><span>18×24 coroplast blanks</span><strong>14</strong></li>
            <li><span>Black XL shirts</span><strong>6</strong></li>
            <li><span>11 oz sublimation mugs</span><strong>8</strong></li>
          </ul>
        </article>

        <article className="panel panelWide" id="customers">
          <div className="panelHeading">
            <div>
              <p className="eyebrow">Quick start</p>
              <h2>Build the next order</h2>
            </div>
          </div>
          <div className="quickGrid">
            <a href="#"><strong>Real-estate sign package</strong><span>Signs, riders, posts, QR codes</span></a>
            <a href="#"><strong>Business lettering</strong><span>Windows, doors, vehicles, walls</span></a>
            <a href="#"><strong>Screen-printed apparel</strong><span>Garments, colors, locations, sizes</span></a>
            <a href="#"><strong>Sublimation product</strong><span>Mugs, tumblers, shirts, panels</span></a>
          </div>
        </article>
      </section>
    </main>
  );
}
