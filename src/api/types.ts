export type JsonRecord = Record<string, unknown>;

export type LocationCreate = {
  name: string;
  parent_id?: string | null;
  kind?: string | null;
  meta?: JsonRecord | null;
  label_print?: LabelPrintRequest | null;
};

export type LocationOut = {
  id: string;
  name: string;
  parent_id?: string | null;
  kind?: string | null;
  meta?: JsonRecord | null;
};

export type LocationUpdate = {
  parent_id?: string | null;
  name?: string | null;
  kind?: string | null;
  meta?: JsonRecord | null;
};

export type LocationPathItem = {
  id: string;
  name: string;
};

export type LocationTreeNode = {
  id: string;
  name: string;
  parent_id?: string | null;
  kind?: string | null;
  meta?: JsonRecord | null;
  children: LocationTreeNode[];
};

export type ItemTypeCreate = {
  name: string;
  schema?: JsonRecord | null;
  ui?: JsonRecord | null;
  label_template_id?: string | null;
};

export type ItemTypeUpdate = {
  name?: string | null;
  schema?: JsonRecord | null;
  ui?: JsonRecord | null;
  label_template_id?: string | null;
};

export type ItemTypeOut = {
  id: string;
  name: string;
  schema: JsonRecord;
  ui: JsonRecord;
  label_template_id?: string | null;
};

export type ItemCreate = {
  location_id?: string | null;
  status?: string | null;
  description?: string | null;
  props?: JsonRecord | null;
  type?: string | null;
  type_id?: string | null;
  label_print?: LabelPrintRequest | null;
};

export type ItemBulkCreateItem = {
  location_id?: string | null;
  status?: string | null;
  description?: string | null;
  props?: JsonRecord | null;
  type?: string | null;
  type_id?: string | null;
};

export type ItemBulkCreate = {
  items: ItemBulkCreateItem[];
};

export type ItemBulkUpdateItem = {
  id: string;
  status?: string | null;
  description?: string | null;
  props?: JsonRecord | null;
  source?: string | null;
};

export type ItemBulkUpdate = {
  items: ItemBulkUpdateItem[];
};

export type ItemBulkMove = {
  item_ids: string[];
  location_id: string;
};

export type ItemUpdate = {
  status?: string | null;
  description?: string | null;
};

export type ItemOut = {
  id: string;
  location_id?: string | null;
  status?: string | null;
  description?: string | null;
  props?: JsonRecord | null;
  type_id: string;
};

export type ItemDetailType = {
  id: string;
  name: string;
};

export type ItemDetailLocation = {
  physical_location_id?: string | null;
  effective_location_id?: string | null;
  effective_location_path?: LocationPathItem[] | null;
};

export type ItemDetailOut = {
  id: string;
  location_id?: string | null;
  status?: string | null;
  description?: string | null;
  props?: JsonRecord | null;
  type_id: string;
  type: ItemDetailType;
  location: ItemDetailLocation;
};

export type ItemMove = {
  location_id: string;
};

export type ItemPropsUpdate = {
  props: JsonRecord;
  source?: string | null;
};

export type ItemPropsReplace = {
  props: JsonRecord;
  source?: string | null;
};

export type ItemPropHistoryOut = {
  id: string;
  item_id: string;
  prop_key: string;
  captured_at: string;
  value: unknown;
  source?: string | null;
};

export type ItemSnapshotCreate = {
  kind: string;
  captured_at?: string | null;
  data_text?: string | null;
  data?: JsonRecord | null;
  meta?: JsonRecord | null;
};

export type ItemSnapshotOut = {
  id: string;
  item_id: string;
  kind: string;
  captured_at: string;
  data_text?: string | null;
  data?: JsonRecord | null;
  meta: JsonRecord;
};

export type ItemRelationCreate = {
  child_item_id: string;
  relation_type: "installed_in" | "uses" | "paired_with";
  quantity?: number | null;
  slot?: string | null;
  notes?: string | null;
};

export type ItemRelationDetach = {
  location_id?: string | null;
};

export type ItemRelationUpdate = {
  active?: boolean | null;
  quantity?: number | null;
  slot?: string | null;
  notes?: string | null;
};

export type ItemRelationOut = {
  id: string;
  parent_item_id: string;
  child_item_id: string;
  relation_type: string;
  active: boolean;
  quantity?: number | null;
  slot?: string | null;
  notes?: string | null;
  created_at: string;
};

export type LabelPrintRequest = {
  printer_id: string;
  return_preview?: boolean | null;
};

export type LabelReprintRequest = {
  printer_id: string;
  item_id?: string | null;
  location_id?: string | null;
  return_preview?: boolean | null;
};

export type PropsFilter = {
  path: string;
  op: "==" | "!=" | ">" | ">=" | "<" | "<=" | "contains" | "in";
  value: unknown;
};

export type SearchLocation = {
  root_location_id: string;
  include_descendants?: boolean;
};

export type SearchRequest = {
  type?: string | null;
  location?: SearchLocation | null;
  props_filters?: PropsFilter[] | null;
  in_use?: boolean | null;
};

export type ValidationErrorDetail = {
  loc: Array<string | number>;
  msg: string;
  type: string;
};

export type HttpValidationError = {
  detail: ValidationErrorDetail[];
};
