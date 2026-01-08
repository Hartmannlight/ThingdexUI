import { StatusBanner } from "@/components/StatusBanner";
import { ItemTypeBuilder } from "@/features/itemTypes/ItemTypeBuilder";
import { getRuntimeConfig } from "@/config/runtime";

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
      <div className="muted">Define the schema and label template for a new item type.</div>
      <ItemTypeBuilder onCreated={() => undefined} />
    </div>
  );
};

export default CreateItemTypePage;
