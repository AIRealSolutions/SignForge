const quoteLines = [
  { product: "18 × 24 real-estate sign", details: "4mm coroplast · double-sided · full color", quantity: 6, unit: "$32.00", total: "$192.00" },
  { product: "6 × 24 name rider", details: "White aluminum · black cut vinyl", quantity: 6, unit: "$24.00", total: "$144.00" },
  { product: "H-stake", details: "Heavy-duty galvanized stake", quantity: 6, unit: "$6.50", total: "$39.00" },
];

const recentQuotes = [
  ["Q-1008", "Lightkeeper Realty", "Real-estate sign package", "$375.00", "Draft"],
  ["Q-1007", "Cape Fear Builders", "Jobsite signs and truck lettering", "$1,840.00", "Sent"],
  ["Q-1006", "Southport Community Church", "Volunteer shirts", "$1,150.00", "Accepted"],
];

export default function QuotesPage() {
  return (
    <main className="appShell">
      <section className="pageHeader">
        <div>
          <p className="eyebrow">Pricing and estimating</p>
          <h1 className="pageTitle">Quote builder</h1>
          <p className="pageIntro">Create repeatable estimates for signs, decals, apparel, screen printing, and sublimation products.</p>
        </div>
        <a className="button secondary" href="#recent-quotes">View recent quotes</a>
      </section>

      <section className="quoteLayout">
        <div className="panel widePanel">
          <div className="panelHeader"><div><p className="eyebrow">Quote Q-1008</p><h2>Real-estate sign package</h2></div><span className="statusPill warning">Draft</span></div>
          <div className="formGrid">
            <label>Customer<select><option>Lightkeeper Realty</option><option>Cape Fear Builders</option><option>Southport Community Church</option></select></label>
            <label>Due date<input type="date" defaultValue="2026-08-01" /></label>
            <label>Salesperson<input defaultValue="Marc Spencer" /></label>
            <label>Pricing level<select><option>Standard retail</option><option>Brokerage contract</option><option>Wholesale</option></select></label>
          </div>

          <div className="tableWrap quoteTableWrap">
            <table className="dataTable">
              <thead><tr><th>Product</th><th>Qty.</th><th>Unit price</th><th>Total</th></tr></thead>
              <tbody>{quoteLines.map((line) => <tr key={line.product}><td><strong>{line.product}</strong><small>{line.details}</small></td><td>{line.quantity}</td><td>{line.unit}</td><td><strong>{line.total}</strong></td></tr>)}</tbody>
            </table>
          </div>

          <div className="quoteActions"><button className="button secondary" type="button">Add product</button><button className="button secondary" type="button">Add custom line</button></div>
          <label className="fullField">Customer notes<textarea rows="3" defaultValue="Includes one digital proof. Production begins after artwork approval and deposit." /></label>
        </div>

        <aside className="panel quoteSummary">
          <p className="eyebrow">Quote summary</p>
          <div className="summaryLine"><span>Products</span><strong>$375.00</strong></div>
          <div className="summaryLine"><span>Artwork setup</span><strong>$45.00</strong></div>
          <div className="summaryLine"><span>Discount</span><strong>−$20.00</strong></div>
          <div className="summaryLine"><span>Sales tax</span><strong>$27.00</strong></div>
          <div className="summaryLine grandTotal"><span>Total</span><strong>$427.00</strong></div>
          <label>Deposit required<select><option>50% · $213.50</option><option>Paid in full</option><option>No deposit</option></select></label>
          <button className="button primary" type="button">Save and send quote</button>
          <button className="button secondary" type="button">Save draft</button>
          <p className="formNote">Sending and payment collection will activate after the database and email services are connected.</p>
        </aside>
      </section>

      <section className="panel recentSection" id="recent-quotes">
        <div className="panelHeader"><div><p className="eyebrow">Sales pipeline</p><h2>Recent quotes</h2></div></div>
        <div className="tableWrap"><table className="dataTable"><thead><tr><th>Quote</th><th>Customer</th><th>Project</th><th>Total</th><th>Status</th></tr></thead><tbody>{recentQuotes.map(([number, customer, project, total, status]) => <tr key={number}><td><strong>{number}</strong></td><td>{customer}</td><td>{project}</td><td>{total}</td><td><span className={`statusPill ${status === "Accepted" ? "success" : status === "Sent" ? "info" : "warning"}`}>{status}</span></td></tr>)}</tbody></table></div>
      </section>
    </main>
  );
}
