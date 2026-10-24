// TEMPORARY: palette comparison for the Style Your Element section, on develop only. Delete once a palette is chosen.
import { TrendPanels, type TrendTheme } from "@/components/trend-panels";
import { TRENDS } from "@/lib/trends";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Palette preview", robots: { index: false } };

const OPTIONS: [string, TrendTheme][] = [
  ["Current · Beige & Brown", { bg: "#e8dccb", title: "#0b0b0b", tab: "#7a5a3a", tabText: "#ffffff", btn: "rgba(180,154,127,0.9)", btnText: "#ffffff", btnBorder: "rgba(255,255,255,0.7)", btnHover: "#7a5a3a", btnHoverText: "#ffffff" }],
  ["A · Onyx & Silver", { bg: "#141414", title: "#ffffff", tab: "#2a2a2a", tabText: "#ffffff", btn: "#ffffff", btnText: "#0b0b0b", btnBorder: "#ffffff", btnHover: "transparent", btnHoverText: "#ffffff" }],
  ["B · Stone & Ink", { bg: "#ece9e4", title: "#0b0b0b", tab: "#0b0b0b", tabText: "#ffffff", btn: "#0b0b0b", btnText: "#ffffff", btnBorder: "rgba(255,255,255,0.6)", btnHover: "#ffffff", btnHoverText: "#0b0b0b" }],
  ["C · Steel Slate", { bg: "#dde2e6", title: "#1e272e", tab: "#34434f", tabText: "#ffffff", btn: "#34434f", btnText: "#ffffff", btnBorder: "rgba(255,255,255,0.6)", btnHover: "#1e272e", btnHoverText: "#ffffff" }],
  ["D · Espresso & Gold", { bg: "#2b221c", title: "#e9dcc9", tab: "#a8834a", tabText: "#ffffff", btn: "rgba(43,34,28,0.75)", btnText: "#e9dcc9", btnBorder: "#a8834a", btnHover: "#a8834a", btnHoverText: "#ffffff" }],
];

export default function Palettes() {
  return OPTIONS.map(([name, theme]) => (
    <div key={name} id={name[0]}>
      <TrendPanels title={`Style Your Element — ${name}`} panels={TRENDS} theme={theme} />
    </div>
  ));
}
