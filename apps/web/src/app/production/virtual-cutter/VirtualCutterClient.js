"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./VirtualCutter.module.css";

const DEFAULT_JOB = {
  schemaVersion: "0.1",
  jobId: "SF-DEMO-1001",
  approval: { status: "approved", approvedArtworkVersion: 1 },
  customer: { displayName: "Marc Spencer", organizationName: "Lightkeeper Realty" },
  product: { productType: "vinyl_cut", name: "18 × 24 Open House Directional", widthInches: 24, heightInches: 18, quantity: 1 },
  artwork: {
    format: "svg",
    physicalWidthInches: 24,
    physicalHeightInches: 18,
    textOutlined: true,
    source: {
      kind: "inline",
      inlineSvg: '<svg xmlns="http://www.w3.org/2000/svg" width="24in" height="18in" viewBox="0 0 960 720"><rect x="80" y="80" width="800" height="560" fill="none" stroke="#000000" stroke-width="4"/><path d="M180 360 H650 V280 L820 360 L650 440 V360 Z" fill="none" stroke="#000000" stroke-width="4"/></svg>'
    }
  },
  material: { category: "adhesive_vinyl", brand: "ORAFOL", series: "Oracal 651", colorName: "White", rollWidthInches: 24 },
  production: { copies: 1, mirror: false, weedBorder: true, weedBorderMarginInches: 0.25, spacingInches: 0.25, operatorConfirmationRequired: true },
  machine: { targetType: "virtual_cutter", profileId: "virtual-gs24-default", settings: { speedCmPerSecond: 15, forceGrams: 90, bladeOffsetMm: 0.25, passes: 1 } }
};

function distance(a, b) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function parseNumbers(value) {
  return value.trim().split(/[ ,]+/).map(Number).filter(Number.isFinite);
}

function parsePathData(data) {
  const tokens = data.match(/[a-zA-Z]|-?\d*\.?\d+/g) || [];
  const segments = [];
  let index = 0;
  let command = null;
  let current = { x: 0, y: 0 };
  let start = { x: 0, y: 0 };

  while (index < tokens.length) {
    if (/^[a-zA-Z]$/.test(tokens[index])) command = tokens[index++];
    if (!command) break;
    const relative = command === command.toLowerCase();
    const upper = command.toUpperCase();

    if (upper === "M" || upper === "L") {
      const x = Number(tokens[index++]);
      const y = Number(tokens[index++]);
      if (!Number.isFinite(x) || !Number.isFinite(y)) break;
      const next = { x: relative ? current.x + x : x, y: relative ? current.y + y : y };
      if (upper === "M") start = next;
      else segments.push({ from: current, to: next, kind: "cut" });
      current = next;
      if (upper === "M") command = relative ? "l" : "L";
    } else if (upper === "H") {
      const x = Number(tokens[index++]);
      const next = { x: relative ? current.x + x : x, y: current.y };
      segments.push({ from: current, to: next, kind: "cut" });
      current = next;
    } else if (upper === "V") {
      const y = Number(tokens[index++]);
      const next = { x: current.x, y: relative ? current.y + y : y };
      segments.push({ from: current, to: next, kind: "cut" });
      current = next;
    } else if (upper === "Z") {
      segments.push({ from: current, to: start, kind: "cut" });
      current = start;
      command = null;
    } else {
      break;
    }
  }
  return segments;
}

function parseSvg(svg) {
  if (typeof DOMParser === "undefined") return null;
  const doc = new DOMParser().parseFromString(svg, "image/svg+xml");
  if (doc.querySelector("parsererror")) throw new Error("Artwork contains invalid SVG markup.");
  const root = doc.documentElement;
  const viewBox = parseNumbers(root.getAttribute("viewBox") || "0 0 1000 1000");
  const [minX = 0, minY = 0, width = 1000, height = 1000] = viewBox;
  const paths = [];

  root.querySelectorAll("rect").forEach((rect) => {
    const x = Number(rect.getAttribute("x") || 0);
    const y = Number(rect.getAttribute("y") || 0);
    const w = Number(rect.getAttribute("width") || 0);
    const h = Number(rect.getAttribute("height") || 0);
    paths.push([
      { x, y }, { x: x + w, y }, { x: x + w, y: y + h }, { x, y: y + h }, { x, y }
    ]);
  });

  root.querySelectorAll("polyline, polygon").forEach((shape) => {
    const nums = parseNumbers(shape.getAttribute("points") || "");
    const points = [];
    for (let i = 0; i < nums.length - 1; i += 2) points.push({ x: nums[i], y: nums[i + 1] });
    if (shape.tagName.toLowerCase() === "polygon" && points.length) points.push(points[0]);
    if (points.length > 1) paths.push(points);
  });

  root.querySelectorAll("path").forEach((path) => {
    const segments = parsePathData(path.getAttribute("d") || "");
    if (!segments.length) return;
    const points = [segments[0].from, ...segments.map((segment) => segment.to)];
    paths.push(points);
  });

  return { minX, minY, width, height, paths };
}

function buildPlan(parsed, job) {
  const moves = [];
  let cursor = { x: parsed.minX, y: parsed.minY };
  parsed.paths.forEach((path, pathIndex) => {
    const first = path[0];
    if (distance(cursor, first) > 0) moves.push({ from: cursor, to: first, kind: "travel", pathIndex });
    for (let i = 1; i < path.length; i += 1) moves.push({ from: path[i - 1], to: path[i], kind: "cut", pathIndex });
    cursor = path[path.length - 1];
  });

  const cutDistance = moves.filter((move) => move.kind === "cut").reduce((sum, move) => sum + distance(move.from, move.to), 0);
  const travelDistance = moves.filter((move) => move.kind === "travel").reduce((sum, move) => sum + distance(move.from, move.to), 0);
  const scaleInches = job.artwork.physicalWidthInches / parsed.width;
  const cutInches = cutDistance * scaleInches;
  const travelInches = travelDistance * scaleInches;
  const speedInchesPerSecond = (job.machine.settings.speedCmPerSecond || 10) / 2.54;
  const estimatedSeconds = (cutInches / speedInchesPerSecond) + (travelInches / (speedInchesPerSecond * 1.6)) + parsed.paths.length * 0.35;

  return {
    moves,
    stats: {
      paths: parsed.paths.length,
      cutInches,
      travelInches,
      bladeLifts: parsed.paths.length,
      estimatedSeconds,
      materialLengthInches: job.product.heightInches * (job.production.copies || 1) + Math.max(0, (job.production.copies || 1) - 1) * (job.production.spacingInches || 0)
    }
  };
}

function formatDistance(value) {
  return `${value.toFixed(1)} in`;
}

function formatTime(seconds) {
  const rounded = Math.max(0, Math.round(seconds));
  return `${Math.floor(rounded / 60)}m ${String(rounded % 60).padStart(2, "0")}s`;
}

export default function VirtualCutterClient() {
  const [jobText, setJobText] = useState(JSON.stringify(DEFAULT_JOB, null, 2));
  const [job, setJob] = useState(DEFAULT_JOB);
  const [parsed, setParsed] = useState(null);
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState("");
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(5);
  const timerRef = useRef(null);

  function loadJob(raw = jobText) {
    try {
      const nextJob = JSON.parse(raw);
      if (nextJob.approval?.status !== "approved") throw new Error("Production job must be approved before simulation.");
      if (nextJob.product?.productType !== "vinyl_cut") throw new Error("Virtual Cutter v0.1 only accepts vinyl_cut jobs.");
      const svg = nextJob.artwork?.source?.inlineSvg;
      if (!svg) throw new Error("This release requires inline SVG artwork.");
      const nextParsed = parseSvg(svg);
      if (!nextParsed?.paths.length) throw new Error("No supported cut paths were found. v0.1 supports rect, polygon, polyline and basic M/L/H/V/Z paths.");
      const nextPlan = buildPlan(nextParsed, nextJob);
      setJob(nextJob);
      setParsed(nextParsed);
      setPlan(nextPlan);
      setStep(0);
      setPlaying(false);
      setError("");
    } catch (loadError) {
      setError(loadError.message || "Unable to load production job.");
      setPlan(null);
      setParsed(null);
    }
  }

  useEffect(() => {
    loadJob(jobText);
    // Initial demonstration load only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!playing || !plan) return undefined;
    const interval = Math.max(30, 380 / playbackSpeed);
    timerRef.current = window.setInterval(() => {
      setStep((current) => {
        if (current >= plan.moves.length) {
          setPlaying(false);
          return current;
        }
        return current + 1;
      });
    }, interval);
    return () => window.clearInterval(timerRef.current);
  }, [playing, playbackSpeed, plan]);

  const currentMove = plan?.moves[Math.max(0, step - 1)] || null;
  const progress = plan?.moves.length ? Math.round((step / plan.moves.length) * 100) : 0;

  function handleFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const raw = String(reader.result || "");
      setJobText(raw);
      loadJob(raw);
    };
    reader.readAsText(file);
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className="eyebrow">Milestone 2</p>
          <h1>Virtual Cutter</h1>
          <p>Load the same approved production job that will eventually be sent to the Linux engine and Roland adapter.</p>
        </div>
        <div className={styles.headerActions}>
          <label className="button secondary">Import job<input accept="application/json,.json" hidden onChange={handleFile} type="file" /></label>
          <button className="button primary" onClick={() => loadJob()} type="button">Validate & simulate</button>
        </div>
      </header>

      <section className={styles.layout}>
        <aside className={styles.jobPanel}>
          <div className={styles.panelTitle}><span>Production job</span><strong>{job.jobId}</strong></div>
          <textarea aria-label="Production job JSON" onChange={(event) => setJobText(event.target.value)} spellCheck="false" value={jobText} />
          {error && <p className={styles.error}>{error}</p>}
          <div className={styles.jobFacts}>
            <span>Approval<strong>{job.approval?.status || "unknown"}</strong></span>
            <span>Material<strong>{job.material?.series || "—"} {job.material?.colorName || ""}</strong></span>
            <span>Machine<strong>{job.machine?.profileId || "—"}</strong></span>
          </div>
        </aside>

        <section className={styles.simulatorPanel}>
          <div className={styles.simToolbar}>
            <div>
              <strong>{job.product?.name}</strong>
              <span>{job.product?.widthInches} × {job.product?.heightInches} in · {job.production?.copies} copy</span>
            </div>
            <div className={styles.playbackControls}>
              <button onClick={() => setStep(0)} type="button">Reset</button>
              <button onClick={() => setStep((value) => Math.max(0, value - 1))} type="button">Step −</button>
              <button className={styles.playButton} disabled={!plan} onClick={() => setPlaying((value) => !value)} type="button">{playing ? "Pause" : "Play"}</button>
              <button onClick={() => setStep((value) => Math.min(plan?.moves.length || 0, value + 1))} type="button">Step +</button>
              <select aria-label="Playback speed" onChange={(event) => setPlaybackSpeed(Number(event.target.value))} value={playbackSpeed}>
                <option value="1">1×</option><option value="5">5×</option><option value="20">20×</option><option value="100">100×</option>
              </select>
            </div>
          </div>

          <div className={styles.matWrap}>
            <svg className={styles.mat} viewBox={parsed ? `${parsed.minX} ${parsed.minY} ${parsed.width} ${parsed.height}` : "0 0 960 720"}>
              <defs>
                <pattern height="40" id="grid" patternUnits="userSpaceOnUse" width="40"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="#cbd5e1" strokeOpacity=".18" strokeWidth="1" /></pattern>
              </defs>
              <rect fill="#f8fafc" height="100%" width="100%" />
              <rect fill="url(#grid)" height="100%" width="100%" />
              {plan?.moves.map((move, index) => (
                <line
                  className={index < step ? styles.completedMove : index === step ? styles.currentMove : move.kind === "cut" ? styles.futureCut : styles.futureTravel}
                  key={`${move.kind}-${index}`}
                  x1={move.from.x} x2={move.to.x} y1={move.from.y} y2={move.to.y}
                />
              ))}
              {plan?.moves[0] && <circle className={styles.startPoint} cx={plan.moves[0].from.x} cy={plan.moves[0].from.y} r="9" />}
              {currentMove && <g className={styles.toolHead}><circle cx={currentMove.to.x} cy={currentMove.to.y} r="13" /><path d={`M ${currentMove.to.x - 18} ${currentMove.to.y} H ${currentMove.to.x + 18} M ${currentMove.to.x} ${currentMove.to.y - 18} V ${currentMove.to.y + 18}`} /></g>}
            </svg>
          </div>

          <div className={styles.progressRow}><div><span style={{ width: `${progress}%` }} /></div><strong>{progress}%</strong></div>
          <div className={styles.legend}><span><i className={styles.legendCut} />Cut path</span><span><i className={styles.legendTravel} />Travel</span><span><i className={styles.legendDone} />Completed</span><span><i className={styles.legendHead} />Toolhead</span></div>
        </section>

        <aside className={styles.inspector}>
          <div className={styles.panelTitle}><span>Motion plan</span><strong>{plan ? "Ready" : "Waiting"}</strong></div>
          <div className={styles.statGrid}>
            <article><span>Cut distance</span><strong>{plan ? formatDistance(plan.stats.cutInches) : "—"}</strong></article>
            <article><span>Travel distance</span><strong>{plan ? formatDistance(plan.stats.travelInches) : "—"}</strong></article>
            <article><span>Blade lifts</span><strong>{plan?.stats.bladeLifts ?? "—"}</strong></article>
            <article><span>Estimated time</span><strong>{plan ? formatTime(plan.stats.estimatedSeconds) : "—"}</strong></article>
            <article><span>Material length</span><strong>{plan ? formatDistance(plan.stats.materialLengthInches) : "—"}</strong></article>
            <article><span>Motion segments</span><strong>{plan?.moves.length ?? "—"}</strong></article>
          </div>
          <section className={styles.console}>
            <p>Virtual cutter console</p>
            <code>JOB {job.jobId}</code>
            <code>APPROVAL {job.approval?.status?.toUpperCase()}</code>
            <code>PATHS {plan?.stats.paths ?? 0}</code>
            <code>STEP {step}/{plan?.moves.length ?? 0}</code>
            <code>MODE {currentMove?.kind?.toUpperCase() || "IDLE"}</code>
            <code>OPERATOR_CONFIRMATION {job.production?.operatorConfirmationRequired ? "REQUIRED" : "NOT REQUIRED"}</code>
          </section>
          <div className={styles.safetyNotice}><strong>Simulation only</strong><p>No machine commands or USB data are produced in this milestone.</p></div>
        </aside>
      </section>
    </main>
  );
}
