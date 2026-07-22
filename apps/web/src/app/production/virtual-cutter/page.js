import VirtualCutterClient from "./VirtualCutterClient";

export const metadata = {
  title: "Virtual Cutter | SignForge",
  description: "Validate and simulate approved vinyl-cut production jobs before sending them to a machine.",
};

export default function VirtualCutterPage() {
  return <VirtualCutterClient />;
}
