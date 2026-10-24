import { nb } from "./nb";
import { en } from "./en";

export type Lang = "nb" | "en";
export const LANGS: readonly Lang[] = ["nb", "en"];
export const LANGUAGE_NAMES: Record<Lang, string> = { nb: "Norsk bokmål", en: "English" };

export type Dictionary = typeof nb;
const dictionaries: Record<Lang, Dictionary> = { nb, en: en as Dictionary };

export type Params = Record<string, string | number | undefined>;

/** Flattens a nested dictionary into dotted keys. */
export function flattenKeys(value: unknown, prefix = ""): string[] {
  if (value === null || typeof value !== "object") return [prefix];
  return Object.entries(value as Record<string, unknown>).flatMap(([k, v]) => flattenKeys(v, prefix ? `${prefix}.${k}` : k));
}

function lookup(dictionary: Dictionary, key: string): string | undefined {
  // Code-keyed namespaces (feedback, explain) hold dotted codes as literal keys: try "namespace" + "the rest" first.
  const dot = key.indexOf(".");
  if (dot > 0) {
    const namespace = (dictionary as Record<string, unknown>)[key.slice(0, dot)];
    const remainder = key.slice(dot + 1);
    if (namespace && typeof namespace === "object" && typeof (namespace as Record<string, unknown>)[remainder] === "string") {
      return (namespace as Record<string, string>)[remainder];
    }
  }
  let node: unknown = dictionary;
  for (const part of key.split(".")) {
    if (node === null || typeof node !== "object" || !(part in (node as Record<string, unknown>))) return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === "string" ? node : undefined;
}

const isDevelopment = import.meta.env.MODE !== "production";

/**
 * Resolves a dictionary key with `{name}` placeholders. A missing key throws in development and tests
 * (dictionary parity is a build-time contract) and returns the key with a console error in production.
 */
export function translate(lang: Lang, key: string, params?: Params): string {
  const text = lookup(dictionaries[lang], key);
  if (text === undefined) {
    const message = `Missing dictionary key "${key}" for language "${lang}"`;
    if (isDevelopment) throw new Error(message);
    console.error(message);
    return key;
  }
  return text.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = params?.[name];
    return value === undefined ? match : String(value);
  });
}

/** Code-keyed lookups (feedback, status, outcome, tag, step texts) share the translate path. */
export function translateCode(lang: Lang, namespace: string, code: string, params?: Params): string {
  return translate(lang, `${namespace}.${code}`, params);
}
