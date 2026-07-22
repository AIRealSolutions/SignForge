const customers = [
  {
    name: "Lightkeeper Realty",
    type: "Real estate brokerage",
    contact: "Marc Spencer",
    email: "marcspencer28461@gmail.com",
    phone: "910-363-6147",
    jobs: 8,
    value: "$4,860",
    status: "Active",
  },
  {
    name: "Cape Fear Builders",
    type: "Builder & contractor",
    contact: "Jordan Ellis",
    email: "jordan@capefearbuilders.com",
    phone: "910-555-0148",
    jobs: 4,
    value: "$3,240",
    status: "Active",
  },
  {
    name: "Southport Community Church",
    type: "Church",
    contact: "Angela Moore",
    email: "office@southportcommunity.org",
    phone: "910-555-0182",
    jobs: 2,
    value: "$1,150",
    status: "Lead",
  },
];

export default function CustomersPage() {
  return (
    <main className="appShell">
      <section className="pageHeader">
        <div>
          <p className="eyebrow">Customer relationship management</p>
          <h1 className="pageTitle">Customers</h1>
          <p className="pageIntro">
            Manage brokerages, businesses, schools, churches, contractors, and repeat buyers from one place.
          </p>
        </div>
        <a className="button primary" href="#new-customer">Add customer</a>
      </section>

      <section className="metricGrid compactMetrics">
        <article className="metricCard"><span>Total customers</span><strong>26</strong><small>18 active accounts</small></article>
        <article className="metricCard"><span>Open opportunities</span><strong>9</strong><small>$12,480 estimated value</small></article>
        <article className="metricCard"><span>Repeat customers</span><strong>61%</strong><small>Past 12 months</small></article>
        <article className="metricCard"><span>Artwork profiles</span><strong>14</strong><small>Saved logos and brand colors</small></article>
      </section>

      <section className="workspaceGrid">
        <div className="panel widePanel">
          <div className="panelHeader">
            <div><p className="eyebrow">Account directory</p><h2>Customer list</h2></div>
            <div className="toolbar"><input aria-label="Search customers" placeholder="Search customers" /><select aria-label="Filter customer type"><option>All customer types</option><option>Real estate</option><option>Business</option><option>Contractor</option><option>Church or school</option></select></div>
          </div>
          <div className="tableWrap">
            <table className="dataTable">
              <thead><tr><th>Customer</th><th>Primary contact</th><th>Jobs</th><th>Lifetime value</th><th>Status</th></tr></thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.name}>
                    <td><strong>{customer.name}</strong><small>{customer.type}</small></td>
                    <td><strong>{customer.contact}</strong><small>{customer.email} · {customer.phone}</small></td>
                    <td>{customer.jobs}</td><td>{customer.value}</td><td><span className={`statusPill ${customer.status === "Lead" ? "warning" : "success"}`}>{customer.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="panel" id="new-customer">
          <div className="panelHeader"><div><p className="eyebrow">New account</p><h2>Add customer</h2></div></div>
          <form className="stackedForm">
            <label>Business or customer name<input name="name" placeholder="Example: Coastal Realty Group" /></label>
            <label>Customer type<select name="type"><option>Real estate brokerage</option><option>Individual real estate agent</option><option>Local business</option><option>Builder or contractor</option><option>Church or school</option><option>Other</option></select></label>
            <div className="formRow"><label>Contact name<input name="contact" /></label><label>Phone<input name="phone" type="tel" /></label></div>
            <label>Email<input name="email" type="email" /></label>
            <label>Notes<textarea name="notes" rows="4" placeholder="Brand colors, preferred products, tax status, delivery notes..." /></label>
            <button className="button primary" type="button">Save customer</button>
            <p className="formNote">The form is visual only until Supabase is connected.</p>
          </form>
        </aside>
      </section>
    </main>
  );
}
