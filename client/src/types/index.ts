export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export interface Model3D {
  id: string;
  filename: string;
  original_name: string;
  format: string;
  status: "queued" | "processing" | "done" | "error";
  dim_x: number | null;
  dim_y: number | null;
  dim_z: number | null;
  volume: number | null;
  polygons: number | null;
  error_message: string | null;
  created_at: string;
}

export interface CalcParams {
  id: string;
  technology: string;
  material_density: number;
  material_price: number;
  waste_factor: number;
  infill: number;
  support_percent: number;
  print_time_h: number;
  post_process_time_h: number;
  modeling_time_h: number;
  quantity: number;
  is_batch: boolean;
  markup: number;
  reject_rate: number;
  tax_rate: number;
  depreciation_rate: number;
  energy_rate: number;
  hourly_rate: number;
  currency: string;
  language: string;
}

export interface CalcResult {
  id: string;
  weight: number;
  material_cost: number;
  energy_cost: number;
  depreciation: number;
  prep_cost: number;
  reject_cost: number;
  unit_cost: number;
  profit: number;
  tax: number;
  price_per_unit: number;
  total_price: number;
  calculated_at: string;
}

export interface AiText {
  id: string;
  description: string | null;
  commercial_text: string | null;
  description_en: string | null;
  description_ru: string | null;
  commercial_text_en: string | null;
  commercial_text_ru: string | null;
  created_at: string;
}

export interface ProjectListItem {
  id: string;
  name: string;
  date: string | null;
  client: string | null;
  contact: string | null;
  created_at: string;
  updated_at: string;
  has_model: boolean;
  model_status: string | null;
}

export interface ProjectDetail {
  id: string;
  name: string;
  date: string | null;
  client: string | null;
  contact: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  model: Model3D | null;
  calc_params: CalcParams | null;
  calc_result: CalcResult | null;
  ai_text: AiText | null;
}

export interface ProjectCreate {
  name: string;
  client?: string;
  contact?: string;
  notes?: string;
}
