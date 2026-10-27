import { loadCatalogData } from "@/lib/server/catalog";
import { PageHead } from "../ui";
import { SettingsForm } from "./settings-form";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const { settings } = await loadCatalogData();
  return (
    <>
      <PageHead title="Settings" />
      <SettingsForm settings={settings} />
    </>
  );
}
