import { StatusBanner } from "@/components/StatusBanner";
import { ItemTypeBuilder } from "@/features/itemTypes/ItemTypeBuilder";
import { getRuntimeConfig } from "@/config/runtime";
import { PageHeader } from "@/components/PageHeader";

const CreateItemTypePage = () => {
  const { featureFlags } = getRuntimeConfig();

  if (!featureFlags.itemTypes) {
    return (
      <div className="page">
        <StatusBanner kind="warning" title="Feature disabled" message="Item type creation is disabled." />
      </div>
    );
  }

  return (
    <div className="page">
      <PageHeader title="Item Type anlegen" eyebrow="Desktop-Verwaltung" />
      <div className="info-panel"><div><strong>Schema-gesteuertes Formular</strong><p>Felder, Validierung, Verlauf und Label-Template werden hier gemeinsam definiert. Die JSON-Ansicht bleibt als Expertenmodus verfügbar.</p></div></div>
      <ItemTypeBuilder onCreated={() => undefined} />
    </div>
  );
};

export default CreateItemTypePage;
