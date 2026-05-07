import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { bulkMoveItems, listItemsMissingLocation } from "@/api/items";
import { parseErrorMessage } from "@/api/errors";
import { useToasts } from "@/hooks/useToasts";
import { itemTitle, shortId } from "@/utils/entityLabels";

const MaintenancePage = () => {
  const queryClient = useQueryClient();
  const toasts = useToasts();
  const [selected, setSelected] = useState<string[]>([]);
  const [targetLocationId, setTargetLocationId] = useState("");
  const missing = useQuery({ queryKey: ["maintenance", "missing-location"], queryFn: listItemsMissingLocation });
  const mutation = useMutation({
    mutationFn: () => bulkMoveItems({ item_ids: selected, location_id: targetLocationId }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["maintenance"] });
      setSelected([]);
      toasts.success("Items verschoben");
    },
    onError: (error) => toasts.error("Items konnten nicht verschoben werden", parseErrorMessage(error))
  });

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <p className="eyebrow">Wartung</p>
          <h1>Items ohne Ort</h1>
        </div>
      </div>
      <section className="panel">
        <div className="touch-list">
          {missing.data?.map((item) => (
            <label className="touch-card touch-card--selectable" key={item.id}>
              <input
                type="checkbox"
                checked={selected.includes(item.id)}
                onChange={() =>
                  setSelected((current) => (current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id]))
                }
              />
              <strong>{itemTitle(item)}</strong>
              <span>{shortId(item.id)}</span>
            </label>
          ))}
        </div>
        <div className="bulk-toolbar">
          <input
            className="input"
            value={targetLocationId}
            onChange={(event) => setTargetLocationId(event.target.value)}
            placeholder="Zielort scannen oder suchen"
          />
          <button className="button button--primary button--lg" type="button" onClick={() => mutation.mutate()} disabled={!selected.length || !targetLocationId}>
            Ausgewählte verschieben
          </button>
        </div>
      </section>
    </div>
  );
};

export default MaintenancePage;
