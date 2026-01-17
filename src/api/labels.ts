import { getRuntimeConfig } from "@/config/runtime";
import { externalRequest } from "@/api/external";

export type LabelTemplateSummary = {
  id: string;
  name?: string | null;
};

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
  const { labelServiceBaseUrl } = getRuntimeConfig();
  const data = await externalRequest<unknown>(labelServiceBaseUrl, "/templates");
  if (Array.isArray(data)) return data as LabelTemplateSummary[];
  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    const items = record.templates ?? record.data ?? record.results;
    if (Array.isArray(items)) return items as LabelTemplateSummary[];
  }
  return [];
};

export const getLabelTemplate = async (templateId: string) => {
  const { labelServiceBaseUrl } = getRuntimeConfig();
  return externalRequest<LabelTemplateDetail>(labelServiceBaseUrl, `/templates/${templateId}`);
};
