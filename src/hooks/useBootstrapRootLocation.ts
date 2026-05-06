import { useEffect, useState } from "react";
import { bootstrapRootLocation, getLocation, getRootLocation } from "@/api/locations";
import { parseErrorMessage } from "@/api/errors";
import { useToasts } from "@/hooks/useToasts";

const ROOT_LOCATION_STORAGE_KEY = "thingdex.rootLocationId";

export const useBootstrapRootLocation = () => {
  const { warning } = useToasts();
  const [rootId, setRootId] = useState<string | null>(null);

  useEffect(() => {
    const storeRoot = (id: string) => {
      window.localStorage.setItem(ROOT_LOCATION_STORAGE_KEY, id);
      setRootId(id);
    };

    const bootstrapRoot = () =>
      getRootLocation().catch(bootstrapRootLocation).then((location) => {
        storeRoot(location.id);
      });

    const storedRootId = window.localStorage.getItem(ROOT_LOCATION_STORAGE_KEY);
    const validateOrBootstrap = storedRootId ? getLocation(storedRootId).then(() => storeRoot(storedRootId)).catch(bootstrapRoot) : bootstrapRoot();

    void validateOrBootstrap.catch((error) => {
      warning("Root bootstrap failed", parseErrorMessage(error));
    });
  }, [warning]);

  return rootId;
};
