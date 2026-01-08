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
