import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { bootstrapRootLocation, getRootLocation } from "@/api/locations";
import { getHealth } from "@/api/system";
import { parseErrorMessage } from "@/api/errors";
import { getRuntimeConfig } from "@/config/runtime";
import { useScanner } from "@/scanner/ScannerProvider";
import { useToasts } from "@/hooks/useToasts";

const SystemPage = () => {
  const queryClient = useQueryClient();
  const toasts = useToasts();
  const { scannerActive } = useScanner();
  const config = getRuntimeConfig();
  const health = useQuery({ queryKey: ["system", "health"], queryFn: getHealth, retry: 0 });
  const root = useQuery({ queryKey: ["locations", "root"], queryFn: getRootLocation, retry: 0 });
  const bootstrap = useMutation({
    mutationFn: bootstrapRootLocation,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["locations"] });
      toasts.success("Root Location angelegt");
    },
    onError: (error) => toasts.error("Root konnte nicht angelegt werden", parseErrorMessage(error))
  });

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <p className="eyebrow">System</p>
          <h1>Stationszustand</h1>
        </div>
      </div>
      <section className="panel">
        <div className="system-grid">
          <div className="system-tile">
            <span>API</span>
            <strong>{health.data?.ok ? "online" : "offline"}</strong>
          </div>
          <div className="system-tile">
            <span>Scanner</span>
            <strong>{scannerActive ? "aktiv" : "inaktiv"}</strong>
          </div>
          <div className="system-tile">
            <span>Drucker</span>
            <strong>{config.defaults.defaultPrinterId || "Zebra-01"}</strong>
          </div>
          <div className="system-tile">
            <span>Station</span>
            <strong>Werkstatt</strong>
          </div>
          <div className="system-tile system-tile--wide">
            <span>Root Location</span>
            <strong>{root.data?.name || "nicht vorhanden"}</strong>
            {root.isError && (
              <button className="button button--primary" type="button" onClick={() => bootstrap.mutate()}>
                Root anlegen
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default SystemPage;
