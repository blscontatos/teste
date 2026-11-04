import type { BusinessType, LeadStatus, PropertyStatus, PropertyType } from "./types";

export const COMPANY = {
  name: "Luiz Vieira Negócios Imobiliários",
  shortName: "Luiz Vieira",
  tagline: "Negócios Imobiliários",
  city: "Rio de Janeiro",
  state: "RJ",
};

export const PROPERTY_TYPES: { value: PropertyType; label: string; plural: string }[] = [
  { value: "apartamento", label: "Apartamento", plural: "Apartamentos" },
  { value: "cobertura", label: "Cobertura", plural: "Coberturas" },
  { value: "casa", label: "Casa", plural: "Casas" },
  { value: "casa_condominio", label: "Casa em condomínio", plural: "Casas em condomínio" },
  { value: "terreno", label: "Terreno", plural: "Terrenos" },
  { value: "sala_comercial", label: "Sala comercial", plural: "Salas comerciais" },
  { value: "loja", label: "Loja", plural: "Lojas" },
  { value: "outros", label: "Outros", plural: "Outros" },
];

export const typeLabel = (t: PropertyType | string | null | undefined) =>
  PROPERTY_TYPES.find((p) => p.value === t)?.label ?? "Imóvel";

export const BUSINESS_LABEL: Record<BusinessType, string> = {
  venda: "Venda",
  aluguel: "Aluguel",
  ambos: "Venda e aluguel",
};

export const STATUS_LABEL: Record<PropertyStatus, string> = {
  draft: "Rascunho",
  published: "Publicado",
  archived: "Arquivado",
};

export const LEAD_STATUS_LABEL: Record<LeadStatus, string> = {
  novo: "Novo contato",
  em_atendimento: "Em atendimento",
  concluido: "Concluído",
};

export const NEIGHBORHOODS = [
  "Recreio dos Bandeirantes",
  "Barra da Tijuca",
  "Barra Olímpica",
  "Jacarepaguá",
  "Vargem Grande",
  "Vargem Pequena",
  "Itanhangá",
  "Joá",
  "Camorim",
  "Grumari",
];

export const PRICE_RANGES = [
  { value: "0-500000", label: "Até R$ 500 mil" },
  { value: "500000-1000000", label: "R$ 500 mil a R$ 1 milhão" },
  { value: "1000000-2000000", label: "R$ 1 a 2 milhões" },
  { value: "2000000-4000000", label: "R$ 2 a 4 milhões" },
  { value: "4000000-", label: "Acima de R$ 4 milhões" },
];

export const RENT_RANGES = [
  { value: "0-5000", label: "Até R$ 5 mil" },
  { value: "5000-10000", label: "R$ 5 a 10 mil" },
  { value: "10000-20000", label: "R$ 10 a 20 mil" },
  { value: "20000-", label: "Acima de R$ 20 mil" },
];

export const DEFAULT_WHATSAPP_MESSAGE =
  "Olá! Acessei o site Luiz Vieira Negócios Imobiliários e gostaria de obter mais informações.";
