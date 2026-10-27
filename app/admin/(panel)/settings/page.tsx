import { loadCatalogData } from "@/lib/server/catalog";
import { PageHead } from "../ui";
import { SettingsForm } from "./settings-form";

export const metadata = { title: "Site Settings" };

export default async function SettingsPage() {
  const { settings } = await loadCatalogData();
  return (
    <>
      <PageHead title="Site Settings" />
      <SettingsForm settings={settings} />
    </>
  );
}
