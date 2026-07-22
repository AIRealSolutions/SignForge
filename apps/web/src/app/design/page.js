const tools = ["Select", "Text", "Shape", "Upload", "QR Code", "Weed Box"];
const layers = [
  { name: "OPEN HOUSE", type: "Text", visible: true },
  { name: "Directional arrow", type: "Shape", visible: true },
  { name: "Lightkeeper Realty", type: "Text", visible: true },
  { name: "Phone number", type: "Text", visible: true },
];

export default function DesignStudioPage() {
  return (
    <main className="studioPage">
      <section className="studioTopbar">
        <div>
          <p className="eyebrow">Artwork workspace</p>
          <h1 className="studioTitle">Design Studio</h1>
        </div>
        <div className="studioActions">
          <button className="button secondary" type="button">Save draft</button>
          <button className="button secondary" type="button">Create proof</button>
          <button className="button primary" type="button">Prepare cut file</button>
        </div>
      </section>

      <section className="studioShell">
        <aside className="toolRail" aria-label="Design tools">
          {tools.map((tool, index) => (
            <button className={index === 0 ? "toolButton active" : "toolButton"} key={tool} type="button">
              <span>{tool.slice(0, 1)}</span>
              {tool}
            </button>
          ))}
        </aside>

        <section className="workspacePanel">
          <div className="workspaceToolbar">
            <div className="toolbarGroup">
              <label>Product
                <select defaultValue="18x24">
                  <option value="18x24">18 × 24 Yard Sign</option>
                  <option value="6x24">6 × 24 Rider</option>
                  <option value="24x36">24 × 36 Business Sign</option>
                </select>
              </label>
              <label>Zoom
                <select defaultValue="75">
                  <option value="50">50%</option>
                  <option value="75">75%</option>
                  <option value="100">100%</option>
                </select>
              </label>
            </div>
            <div className="toolbarGroup compactTools">
              <button type="button">Undo</button>
              <button type="button">Redo</button>
              <button type="button">Center</button>
              <button type="button">Mirror</button>
            </div>
          </div>

          <div className="canvasStage">
            <div className="ruler rulerTop" />
            <div className="ruler rulerLeft" />
            <div className="signCanvas" role="img" aria-label="Open house sign design preview">
              <div className="safeArea">
                <p className="signBrand">LIGHTKEEPER REALTY</p>
                <h2>OPEN HOUSE</h2>
                <div className="signArrow">➜</div>
                <p className="signPhone">910-363-6147</p>
              </div>
            </div>
          </div>

          <div className="canvasFooter">
            <span>18.00 × 24.00 in</span>
            <span>Safe margin: 0.50 in</span>
            <span>Cut colors: 2</span>
          </div>
        </section>

        <aside className="propertiesPanel">
          <section>
            <div className="panelHeading small">
              <div><p className="eyebrow">Object</p><h2>Text settings</h2></div>
            </div>
            <label className="fieldLabel">Text
              <input defaultValue="OPEN HOUSE" />
            </label>
            <div className="twoFieldGrid">
              <label className="fieldLabel">Font
                <select defaultValue="bold"><option value="bold">Montserrat Bold</option><option>Arial Black</option><option>Impact</option></select>
              </label>
              <label className="fieldLabel">Size
                <input defaultValue="112" type="number" />
              </label>
            </div>
            <div className="twoFieldGrid">
              <label className="fieldLabel">Width
                <input defaultValue="15.5" type="number" />
              </label>
              <label className="fieldLabel">Height
                <input defaultValue="2.8" type="number" />
              </label>
            </div>
            <label className="fieldLabel">Vinyl color
              <div className="colorChoice"><span className="colorSwatch orange" /> Safety Orange</div>
            </label>
          </section>

          <section className="layersSection">
            <div className="panelHeading small">
              <div><p className="eyebrow">Artwork</p><h2>Layers</h2></div>
              <button type="button">+</button>
            </div>
            <div className="layerList">
              {layers.map((layer) => (
                <div className="layerItem" key={layer.name}>
                  <span className="visibility">◉</span>
                  <div><strong>{layer.name}</strong><small>{layer.type}</small></div>
                  <span className="dragHandle">⋮⋮</span>
                </div>
              ))}
            </div>
          </section>

          <section className="productionCheck">
            <p className="eyebrow">Production check</p>
            <ul>
              <li><span>✓</span> Artwork inside safe area</li>
              <li><span>✓</span> Text ready for outlines</li>
              <li><span>✓</span> No raster images</li>
              <li className="warning"><span>!</span> Confirm vinyl inventory</li>
            </ul>
          </section>
        </aside>
      </section>
    </main>
  );
}
