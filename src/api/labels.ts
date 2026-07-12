import { getOptionalPrinthub } from "@/api/optionalPrinthub";
import { getRuntimeConfig } from "@/config/runtime";

export type LabelTemplateSummary = { id: string; name?: string | null };

export type LabelTemplateVariable = {
  name: string;
  mode?: string | null;
};

export type LabelTemplateDetail = {
  id: string;
  name?: string | null;
  variables?: LabelTemplateVariable[] | null;
};

export const isValidLocationTemplate = (template?: LabelTemplateDetail | null) => {
  if (!template || !Array.isArray(template.variables) || template.variables.length === 0) return false;
  const names = template.variables
    .map((variable) => variable?.name)
    .filter((name): name is string => typeof name === "string");
  if (names.some((name) => name.includes("-"))) return false;
  const required = new Set(
    template.variables
      .filter((variable) => variable?.mode === "required")
      .map((variable) => variable?.name)
      .filter((name): name is string => typeof name === "string")
  );
  return required.has("location_uuid") && required.has("container_name");
};

export const listLabelTemplates = async () => {
  const items = await getOptionalPrinthub(getRuntimeConfig().labelServiceBaseUrl).listTemplates();
  return items.map((item) => ({ id: item.id, name: item.name ?? null }));
};

export const getLabelTemplate = async (templateId: string): Promise<LabelTemplateDetail> => {
  const detail = await getOptionalPrinthub(getRuntimeConfig().labelServiceBaseUrl).getTemplate(templateId);
  const variables = Array.isArray(detail.variables)
    ? detail.variables
        .map((variable) => {
          if (!variable || typeof variable !== "object") return null;
          const record = variable as Record<string, unknown>;
          return {
            name: typeof record.name === "string" ? record.name : "",
            mode: typeof record.mode === "string" ? record.mode : null
          };
        })
        .filter((variable) => Boolean(variable?.name))
    : null;
  return {
    id: detail.id,
    name: detail.name ?? null,
    variables: variables as LabelTemplateVariable[] | null
  };
};
