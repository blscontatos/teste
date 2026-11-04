export type AppRole = "admin" | "corretor";
export type PropertyStatus = "draft" | "published" | "archived";
export type BusinessType = "venda" | "aluguel" | "ambos";
export type PropertyType =
  | "casa"
  | "casa_condominio"
  | "apartamento"
  | "cobertura"
  | "terreno"
  | "sala_comercial"
  | "loja"
  | "outros";
export type LeadKind = "comprar" | "vender";
export type LeadStatus = "novo" | "em_atendimento" | "concluido";

export interface PropertyImage {
  id: string;
  property_id: string;
  storage_path: string;
  url: string;
  width: number | null;
  height: number | null;
  alt: string | null;
  position: number;
  is_cover: boolean;
}

export interface Property {
  id: string;
  code: string;
  slug: string;
  status: PropertyStatus;
  business: BusinessType;
  type: PropertyType;
  title: string;
  neighborhood: string | null;
  address?: string | null;
  public_address?: string | null;
  show_address: boolean;
  city: string;
  state: string;
  sale_price: number | null;
  rent_price: number | null;
  condo_fee: number | null;
  iptu: number | null;
  total_area: number | null;
  built_area: number | null;
  bedrooms: number | null;
  suites: number | null;
  bathrooms: number | null;
  parking_spots: number | null;
  description: string | null;
  features: string[];
  condo_features: string[];
  video_url: string | null;
  wizard_step?: number;
  published_at: string | null;
  updated_at: string;
  created_at?: string;
  property_images?: PropertyImage[];
}

export interface Testimonial {
  id: string;
  client_name: string;
  region: string | null;
  content: string;
  rating: number;
  published: boolean;
  position: number;
  created_at: string;
}

export interface Lead {
  id: string;
  kind: LeadKind;
  status: LeadStatus;
  full_name: string;
  email: string;
  phone: string;
  age: number | null;
  neighborhood: string | null;
  property_type: string | null;
  price_range: string | null;
  bedrooms: string | null;
  desired_value: number | null;
  approx_area: number | null;
  message: string | null;
  property_id: string | null;
  consent: boolean;
  consent_at: string;
  source: string | null;
  internal_notes: string | null;
  created_at: string;
  updated_at: string;
  properties?: { code: string; title: string; slug: string } | null;
}

export interface SiteSettings {
  id: number;
  featured_property_id: string | null;
  whatsapp_number: string;
  whatsapp_message: string;
  contact_email: string;
  contact_phone: string;
  creci: string;
  address: string;
  instagram_url: string;
  hero_title: string;
  hero_subtitle: string;
  hero_image_url: string;
  about_title: string;
  about_text: string;
  about_image_url: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  role: AppRole | null;
  active: boolean;
  created_at: string;
}
