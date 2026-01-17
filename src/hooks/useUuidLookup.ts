import { useEffect, useState } from "react";
import { getItem } from "@/api/items";
import { getLocation } from "@/api/locations";
import { ApiError } from "@/api/errors";

type LookupState = {
  status: "idle" | "loading" | "found" | "not-found" | "error";
  kind?: "item" | "location";
  label?: string;
};

const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

export const useUuidLookup = (value?: string, enabled = true) => {
  const [state, setState] = useState<LookupState>({ status: "idle" });

  useEffect(() => {
    if (!enabled) {
      setState({ status: "idle" });
      return;
    }
    if (!value || typeof value !== "string") {
      setState({ status: "idle" });
      return;
    }

    const match = value.match(uuidRegex);
    if (!match) {
      setState({ status: "idle" });
      return;
    }

    const id = match[0];
    let cancelled = false;
    setState({ status: "loading" });

    const timer = setTimeout(async () => {
      try {
        const item = await getItem(id);
        if (cancelled) return;
        setState({
          status: "found",
          kind: "item",
          label: item.type?.name ?? item.type_id
        });
        return;
      } catch (error) {
        if (!(error instanceof ApiError) || error.status !== 404) {
          if (!cancelled) setState({ status: "error" });
          return;
        }
      }

      try {
        const location = await getLocation(id);
        if (cancelled) return;
        setState({
          status: "found",
          kind: "location",
          label: location.name
        });
      } catch (error) {
        if (cancelled) return;
        if (error instanceof ApiError && error.status === 404) {
          setState({ status: "not-found" });
        } else {
          setState({ status: "error" });
        }
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [enabled, value]);

  return state;
};
