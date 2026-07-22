"use client";

import { useMemo, useRef, useState } from "react";

const PRODUCT_SIZES = {
  "18x24": { label: "18 × 24 Yard Sign", width: 24, height: 18 },
  "6x24": { label: "6 × 24 Rider", width: 24, height: 6 },
  "24x36": { label: "24 × 36 Business Sign", width: 36, height: 24 },
};

const COLORS = [
  { name: "Safety Orange", value: "#f59e0b" },
  { name: "White", value: "#ffffff" },
  { name: "Black", value: "#111827" },
  { name: "Royal Blue", value: "#1d4ed8" },
  { name: "Red", value: "#dc2626" },
];

const initialObjects = [
  { id: "brand", type: "text", name: "Lightkeeper Realty", text: "LIGHTKEEPER REALTY", x: 50, y: 18, width: 72, height: 10, fontSize: 22, fontFamily: "Arial Black", color: "#ffffff", rotation: 0, visible: true },
  { id: "headline", type: "text", name: "OPEN HOUSE", text: "OPEN HOUSE", x: 50, y: 40, width: 82, height: 22, fontSize: 58, fontFamily: "Arial Black", color: "#f59e0b", rotation: 0, visible: true },
  { id: "arrow", type: "shape", name: "Directional arrow", shape: "arrow", x: 50, y: 64, width: 42, height: 18, color: "#f59e0b", rotation: 0, visible: true },
  { id: "phone", type: "text", name: "Phone number", text: "910-363-6147", x: 50, y: 84, width: 58, height: 10, fontSize: 24, fontFamily: "Arial Black", color: "#ffffff", rotation: 0, visible: true },
];

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export default function DesignStudioClient() {
  const [objects, setObjects] = useState(initialObjects);
  const [selectedId, setSelectedId] = useState("headline");
  const [productKey, setProductKey] = useState("18x24");
  const [zoom, setZoom] = useState(75);
  const [mirrored, setMirrored] = useState(false);
  const [showSafeArea, setShowSafeArea] = useState(true);
  const [status, setStatus] = useState("Ready");
  const stageRef = useRef(null);
  const dragRef = useRef(null);

  const product = PRODUCT_SIZES[productKey];
  const selected = objects.find((object) => object.id === selectedId) || null;
  const canvasAspect = product.width / product.height;

  const canvasStyle = useMemo(() => ({
    aspectRatio: `${product.width} / ${product.height}`,
    width: `${Math.min(100, zoom)}%`,
    transform: mirrored ? "scaleX(-1)" : "none",
  }), [product, zoom, mirrored]);

  function updateObject(id, patch) {
    setObjects((current) => current.map((object) => object.id === id ? { ...object, ...patch } : object));
  }

  function addText() {
    const id = `text-${Date.now()}`;
    setObjects((current) => [...current, {
      id,
      type: "text",
      name: "New text",
      text: "NEW TEXT",
      x: 50,
      y: 50,
      width: 45,
      height: 12,
      fontSize: 34,
      fontFamily: "Arial Black",
      color: "#ffffff",
      rotation: 0,
      visible: true,
    }]);
    setSelectedId(id);
  }

  function addShape(shape = "rectangle") {
    const id = `shape-${Date.now()}`;
    setObjects((current) => [...current, {
      id,
      type: "shape",
      name: shape === "arrow" ? "Arrow" : "Rectangle",
      shape,
      x: 50,
      y: 50,
      width: 30,
      height: 18,
      color: "#f59e0b",
      rotation: 0,
      visible: true,
    }]);
    setSelectedId(id);
  }

  function duplicateSelected() {
    if (!selected) return;
    const id = `${selected.type}-${Date.now()}`;
    setObjects((current) => [...current, { ...selected, id, name: `${selected.name} copy`, x: clamp(selected.x + 4, 5, 95), y: clamp(selected.y + 4, 5, 95) }]);
    setSelectedId(id);
  }

  function deleteSelected() {
    if (!selected) return;
    setObjects((current) => current.filter((object) => object.id !== selected.id));
    setSelectedId(null);
  }

  function centerSelected() {
    if (selected) updateObject(selected.id, { x: 50 });
  }

  function beginDrag(event, object) {
    event.preventDefault();
    event.stopPropagation();
    setSelectedId(object.id);
    const canvas = stageRef.current?.querySelector(".interactiveCanvas");
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    dragRef.current = { id: object.id, rect };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function dragObject(event) {
    if (!dragRef.current) return;
    const { id, rect } = dragRef.current;
    const x = clamp(((event.clientX - rect.left) / rect.width) * 100, 0, 100);
    const y = clamp(((event.clientY - rect.top) / rect.height) * 100, 0, 100);
    updateObject(id, { x, y });
  }

  function endDrag() {
    dragRef.current = null;
  }

  function toggleVisibility(id) {
    const object = objects.find((item) => item.id === id);
    if (object) updateObject(id, { visible: !object.visible });
  }

  function saveDraft() {
    localStorage.setItem("signforge-design-draft", JSON.stringify({ objects, productKey, mirrored }));
    setStatus("Draft saved locally");
    window.setTimeout(() => setStatus("Ready"), 1800);
  }

  function loadDraft() {
    const raw = localStorage.getItem("signforge-design-draft");
    if (!raw) {
      setStatus("No saved draft found");
      return;
    }
    const draft = JSON.parse(raw);
    setObjects(draft.objects || initialObjects);
    setProductKey(draft.productKey || "18x24");
    setMirrored(Boolean(draft.mirrored));
    setStatus("Draft loaded");
  }

  function exportSvg() {
    const width = product.width * 40;
    const height = product.height * 40;
    const svgObjects = objects.filter((object) => object.visible).map((object) => {
      const x = (object.x / 100) * width;
      const y = (object.y / 100) * height;
      const rotation = `rotate(${object.rotation || 0} ${x} ${y})`;
      if (object.type === "text") {
        return `<text x="${x}" y="${y}" fill="${object.color}" font-family="${object.fontFamily}" font-size="${object.fontSize}" font-weight="700" text-anchor="middle" dominant-baseline="middle" transform="${rotation}">${object.text.replaceAll("&", "&amp;").replaceAll("<", "&lt;")}</text>`;
      }
      if (object.shape === "arrow") {
        const w = (object.width / 100) * width;
        const h = (object.height / 100) * height;
        const points = `${x-w/2},${y-h/4} ${x+w/8},${y-h/4} ${x+w/8},${y-h/2} ${x+w/2},${y} ${x+w/8},${y+h/2} ${x+w/8},${y+h/4} ${x-w/2},${y+h/4}`;
        return `<polygon points="${points}" fill="${object.color}" transform="${rotation}" />`;
      }
      const w = (object.width / 100) * width;
      const h = (object.height / 100) * height;
      return `<rect x="${x-w/2}" y="${y-h/2}" width="${w}" height="${h}" fill="${object.color}" transform="${rotation}" />`;
    }).join("\n");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${product.width}in" height="${product.height}in" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#111827"/>${svgObjects}</svg>`;
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `signforge-${productKey}.svg`;
    anchor.click();
    URL.revokeObjectURL(url);
    setStatus("SVG exported");
  }

  return (
    <main className="studioPage">
      <section className="studioTopbar">
        <div>
          <p className="eyebrow">Phase 1 editor</p>
          <h1 className="studioTitle">Design Studio</h1>
          <p className="studioStatus">{status}</p>
        </div>
        <div className="studioActions">
          <button className="button secondary" onClick={loadDraft} type="button">Load draft</button>
          <button className="button secondary" onClick={saveDraft} type="button">Save draft</button>
          <button className="button primary" onClick={exportSvg} type="button">Export SVG</button>
        </div>
      </section>

      <section className="studioShell phaseOneStudio">
        <aside className="toolRail" aria-label="Design tools">
          <button className="toolButton active" type="button"><span>S</span>Select</button>
          <button className="toolButton" onClick={addText} type="button"><span>T</span>Text</button>
          <button className="toolButton" onClick={() => addShape("rectangle")} type="button"><span>R</span>Rectangle</button>
          <button className="toolButton" onClick={() => addShape("arrow")} type="button"><span>A</span>Arrow</button>
          <button className="toolButton" onClick={duplicateSelected} type="button"><span>D</span>Duplicate</button>
          <button className="toolButton dangerTool" onClick={deleteSelected} type="button"><span>×</span>Delete</button>
        </aside>

        <section className="workspacePanel">
          <div className="workspaceToolbar">
            <div className="toolbarGroup">
              <label>Product
                <select value={productKey} onChange={(event) => setProductKey(event.target.value)}>
                  {Object.entries(PRODUCT_SIZES).map(([key, size]) => <option key={key} value={key}>{size.label}</option>)}
                </select>
              </label>
              <label>Zoom
                <select value={zoom} onChange={(event) => setZoom(Number(event.target.value))}>
                  <option value="50">50%</option><option value="75">75%</option><option value="100">100%</option>
                </select>
              </label>
            </div>
            <div className="toolbarGroup compactTools">
              <button onClick={centerSelected} type="button">Center</button>
              <button className={mirrored ? "activeControl" : ""} onClick={() => setMirrored((value) => !value)} type="button">Mirror</button>
              <button className={showSafeArea ? "activeControl" : ""} onClick={() => setShowSafeArea((value) => !value)} type="button">Safe area</button>
            </div>
          </div>

          <div className="canvasStage interactiveStage" onPointerMove={dragObject} onPointerUp={endDrag} onPointerCancel={endDrag} ref={stageRef}>
            <div className="ruler rulerTop" />
            <div className="ruler rulerLeft" />
            <div className="interactiveCanvas signCanvas" onPointerDown={() => setSelectedId(null)} style={canvasStyle}>
              {showSafeArea && <div className="safeAreaGuide" />}
              {objects.map((object) => object.visible && (
                <div
                  className={`canvasObject ${selectedId === object.id ? "selectedObject" : ""} ${object.type === "shape" ? "shapeObject" : "textObject"}`}
                  key={object.id}
                  onPointerDown={(event) => beginDrag(event, object)}
                  style={{
                    left: `${object.x}%`, top: `${object.y}%`, width: `${object.width}%`, height: `${object.height}%`,
                    color: object.color, background: object.type === "shape" && object.shape !== "arrow" ? object.color : "transparent",
                    fontFamily: object.fontFamily, fontSize: `${Math.max(12, object.fontSize * zoom / 100)}px`, transform: `translate(-50%, -50%) rotate(${object.rotation || 0}deg)`,
                  }}
                >
                  {object.type === "text" ? object.text : object.shape === "arrow" ? <span className="cssArrow" style={{ background: object.color }} /> : null}
                  {selectedId === object.id && <><i className="resizeHandle handleNW" /><i className="resizeHandle handleNE" /><i className="resizeHandle handleSW" /><i className="resizeHandle handleSE" /></>}
                </div>
              ))}
            </div>
          </div>

          <div className="canvasFooter">
            <span>{product.height.toFixed(2)} × {product.width.toFixed(2)} in</span>
            <span>Objects: {objects.length}</span>
            <span>Aspect: {canvasAspect.toFixed(2)}</span>
          </div>
        </section>

        <aside className="propertiesPanel">
          <section>
            <div className="panelHeading small"><div><p className="eyebrow">Selected object</p><h2>{selected?.name || "Nothing selected"}</h2></div></div>
            {selected ? <div className="propertyForm">
              {selected.type === "text" && <>
                <label className="fieldLabel">Text<input value={selected.text} onChange={(event) => updateObject(selected.id, { text: event.target.value, name: event.target.value || "Text" })} /></label>
                <label className="fieldLabel">Font<select value={selected.fontFamily} onChange={(event) => updateObject(selected.id, { fontFamily: event.target.value })}><option>Arial Black</option><option>Arial</option><option>Impact</option><option>Georgia</option></select></label>
                <label className="fieldLabel">Font size<input min="8" max="180" type="number" value={selected.fontSize} onChange={(event) => updateObject(selected.id, { fontSize: Number(event.target.value) })} /></label>
              </>}
              <div className="twoFieldGrid">
                <label className="fieldLabel">X %<input type="number" value={selected.x.toFixed(1)} onChange={(event) => updateObject(selected.id, { x: clamp(Number(event.target.value), 0, 100) })} /></label>
                <label className="fieldLabel">Y %<input type="number" value={selected.y.toFixed(1)} onChange={(event) => updateObject(selected.id, { y: clamp(Number(event.target.value), 0, 100) })} /></label>
              </div>
              <div className="twoFieldGrid">
                <label className="fieldLabel">Width %<input min="2" max="100" type="number" value={selected.width} onChange={(event) => updateObject(selected.id, { width: clamp(Number(event.target.value), 2, 100) })} /></label>
                <label className="fieldLabel">Height %<input min="2" max="100" type="number" value={selected.height} onChange={(event) => updateObject(selected.id, { height: clamp(Number(event.target.value), 2, 100) })} /></label>
              </div>
              <label className="fieldLabel">Rotation<input min="-180" max="180" type="number" value={selected.rotation || 0} onChange={(event) => updateObject(selected.id, { rotation: Number(event.target.value) })} /></label>
              <label className="fieldLabel">Color<select value={selected.color} onChange={(event) => updateObject(selected.id, { color: event.target.value })}>{COLORS.map((color) => <option key={color.value} value={color.value}>{color.name}</option>)}</select></label>
            </div> : <p className="formNote">Click any object on the sign to edit it.</p>}
          </section>

          <section className="layersSection">
            <div className="panelHeading small"><div><p className="eyebrow">Artwork</p><h2>Layers</h2></div></div>
            <div className="layerList">
              {[...objects].reverse().map((object) => (
                <button className={`layerItem layerButton ${selectedId === object.id ? "selectedLayer" : ""}`} key={object.id} onClick={() => setSelectedId(object.id)} type="button">
                  <span className="visibility" onClick={(event) => { event.stopPropagation(); toggleVisibility(object.id); }}>{object.visible ? "◉" : "○"}</span>
                  <div><strong>{object.name}</strong><small>{object.type}</small></div>
                  <span className="dragHandle">⋮⋮</span>
                </button>
              ))}
            </div>
          </section>

          <section className="productionCheck">
            <p className="eyebrow">Phase 1 checklist</p>
            <ul>
              <li><span>✓</span> Add and edit text</li>
              <li><span>✓</span> Drag objects on canvas</li>
              <li><span>✓</span> Add shapes and arrows</li>
              <li><span>✓</span> Mirror artwork</li>
              <li><span>✓</span> Save draft locally</li>
              <li><span>✓</span> Export SVG</li>
            </ul>
          </section>
        </aside>
      </section>
    </main>
  );
}
