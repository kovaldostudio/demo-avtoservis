import { load } from "js-yaml";
import raw from "../data/site.config.yaml?raw";

export type ThemeName = "oak" | "graphite" | "linen" | "ink";
export type HeroVariant = "split" | "fullbleed" | "editorial";
export type CatalogVariant = "grid" | "list";

export interface CatalogItem {
  name: string;
  desc: string;
  price: string;
  image: string;
  imageAlt: string;
}

export interface SiteConfig {
  brand: {
    name: string;
    legalName: string;
    tagline: string;
    city: string;
    since: number;
    about: string;
  };
  theme: ThemeName;
  heroVariant: HeroVariant;
  catalogVariant: CatalogVariant;
  /** true — замість фото малюються заглушки «Тут буде ваше фото». Режим вітрини й демо. */
  usePlaceholders: boolean;
  seo: {
    domain: string;
    title: string;
    description: string;
    ogImage: string;
    locale: string;
  };
  contacts: {
    phone: string;
    phoneHref: string;
    email: string;
    instagram: string;
    telegram: string;
    address: string;
    hours: string;
    mapUrl: string;
  };
  form: {
    endpoint: string;
    turnstileSiteKey: string;
    cta: string;
    successText: string;
  };
  hero: {
    headline: string;
    sub: string;
    image: string;
    imageAlt: string;
    points: string[];
  };
  advantages: { title: string; text: string }[];
  catalogTitle: string;
  catalog: CatalogItem[];
  processTitle: string;
  process: { step: string; text: string }[];
  testimonialsTitle: string;
  testimonials: { text: string; author: string; detail: string }[];
  faqTitle: string;
  faq: { q: string; a: string }[];
  finalCta: { title: string; text: string };
}

export const site = load(raw) as SiteConfig;

/**
 * Валідація перед збіркою. Ловить найчастішу помилку конвеєра —
 * поле з прикладу, яке забули замінити під клієнта.
 */
const placeholders = ["example", "Верстак", "+380 67 123 45 67"];

export function auditConfig(): string[] {
  const warnings: string[] = [];
  const flat = JSON.stringify(site);

  for (const p of placeholders) {
    if (flat.includes(p)) warnings.push(`у конфігу лишився приклад: "${p}"`);
  }
  if (!site.form.endpoint || site.form.endpoint.includes("example")) {
    warnings.push("form.endpoint не вказує на робочий Worker — форма нікуди не відправить");
  }
  if (site.catalog.length < 3) {
    warnings.push("у каталозі менше 3 позицій — сторінка виглядатиме порожньою");
  }
  if (site.testimonials.length === 0) {
    warnings.push("немає жодного відгуку — блок довіри вимкнеться");
  }
  return warnings;
}
