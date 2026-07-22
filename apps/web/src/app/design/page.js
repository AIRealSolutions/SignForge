import styles from "./DesignStudioClient.module.css";
import DesignStudioClient from "./DesignStudioClient";

export default function DesignStudioPage() {
  void styles;
  return (
    <>
      <div className="designLaunchBar">
        <span>Phase 1 Design Studio</span>
        <a href="/design/templates">Browse production templates →</a>
      </div>
      <DesignStudioClient />
    </>
  );
}
