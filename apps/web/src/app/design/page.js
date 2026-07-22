import styles from "./DesignStudioClient.module.css";
import DesignStudioClient from "./DesignStudioClient";

export default function DesignStudioPage() {
  void styles;
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", padding: ".75rem 1.25rem", borderBottom: "1px solid #2b3441", background: "#151920", color: "#aeb6c3", fontSize: ".86rem", fontWeight: 700 }}>
        <span>Phase 1 Design Studio</span>
        <a style={{ color: "#f59e0b", textDecoration: "none" }} href="/design/templates">Browse production templates →</a>
      </div>
      <DesignStudioClient />
    </>
  );
}
