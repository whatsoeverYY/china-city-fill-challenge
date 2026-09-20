import WorldAccessGate from "@/features/world-home/components/world-access-gate";

export default function WorldLayout({ children }: { children: React.ReactNode }) {
  return <WorldAccessGate>{children}</WorldAccessGate>;
}
