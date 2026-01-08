import { useEffect, useState } from "react";
import { getRootLocation } from "@/api/locations";
import { parseErrorMessage } from "@/api/errors";
import { useToasts } from "@/hooks/useToasts";

export const useBootstrapRootLocation = () => {
  const { warning } = useToasts();
  const [rootId, setRootId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem("thingdex.rootLocationId");
  });

  useEffect(() => {
    if (!rootId) {
      void getRootLocation()
        .then((location) => {
          window.localStorage.setItem("thingdex.rootLocationId", location.id);
          setRootId(location.id);
        })
        .catch((error) => {
          warning("Root bootstrap failed", parseErrorMessage(error));
        });
    }
  }, [rootId, warning]);

  return rootId;
};
