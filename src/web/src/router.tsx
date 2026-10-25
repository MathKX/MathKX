// A small history router: four routes, no dependency.
import { createContext, useContext, useEffect, useState, type MouseEvent, type ReactNode } from "react";

interface RouterState {
  /** The path only; routes never see the query or fragment. */
  path: string;
  /** The query string of the current address, including its "?" (or ""). */
  search: string;
  navigate(to: string): void;
  /** Replaces the current address without a new history entry (used to drop a consumed query). */
  replace(to: string): void;
}

const RouterContext = createContext<RouterState>({ path: "/", search: "", navigate: () => undefined, replace: () => undefined });

/** Splits an address into its path and its query string; a fragment is dropped. */
export function splitAddress(address: string): { path: string; search: string } {
  const withoutHash = address.split("#")[0] ?? "";
  const q = withoutHash.indexOf("?");
  return q < 0 ? { path: withoutHash || "/", search: "" } : { path: withoutHash.slice(0, q) || "/", search: withoutHash.slice(q) };
}

/** Whether the app has navigated since it loaded (a link, or back and forward); a page heading takes focus then. */
let navigatedInApp = false;
export const hasNavigatedInApp = () => navigatedInApp;

const currentAddress = () => (typeof window !== "undefined" ? window.location.pathname + window.location.search : "/");

export function RouterProvider({ children, initialPath }: { children: ReactNode; initialPath?: string }) {
  const [address, setAddress] = useState(() => splitAddress(initialPath ?? currentAddress()));
  useEffect(() => {
    const onPop = () => {
      navigatedInApp = true;
      setAddress(splitAddress(currentAddress()));
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  const navigate = (to: string) => {
    navigatedInApp = true;
    if (typeof window !== "undefined" && to !== currentAddress()) window.history.pushState(null, "", to);
    setAddress(splitAddress(to));
  };
  const replace = (to: string) => {
    if (typeof window !== "undefined") window.history.replaceState(null, "", to);
    setAddress(splitAddress(to));
  };
  return <RouterContext.Provider value={{ ...address, navigate, replace }}>{children}</RouterContext.Provider>;
}

export const useRouter = () => useContext(RouterContext);

interface LinkProps {
  to: string;
  children: ReactNode;
  className?: string;
  /** Runs on every activation of the link, pointer or keyboard, before the navigation. */
  onActivate?: () => void;
  "data-testid"?: string;
  /** When the visible text alone does not name the target (a question's link names its date too). */
  "aria-label"?: string;
}

export function Link({ to, children, className, onActivate, "data-testid": testId, "aria-label": label }: LinkProps) {
  const { navigate } = useRouter();
  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.defaultPrevented) return;
    onActivate?.(); // Enter on the focused anchor arrives here as a click, like a pointer press
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    navigate(to);
  };
  return (
    <a href={to} onClick={onClick} className={className} data-testid={testId} aria-label={label}>
      {children}
    </a>
  );
}

export type Route =
  | { name: "lessons" }
  | { name: "lesson"; id: string }
  | { name: "practice"; skillId: string }
  | { name: "record" }
  | { name: "replay"; deliveryId: string }
  | { name: "unknown" };

export function matchRoute(address: string): Route {
  const parts = splitAddress(address).path.split("/").filter(Boolean).map(decodeURIComponent);
  if (parts.length === 0) return { name: "lessons" };
  if (parts[0] === "lessons" && parts[1]) return { name: "lesson", id: parts[1] };
  if (parts[0] === "practice" && parts[1]) return { name: "practice", skillId: parts[1] };
  if (parts[0] === "record" && parts[1]) return { name: "replay", deliveryId: parts[1] };
  if (parts[0] === "record") return { name: "record" };
  return { name: "unknown" };
}
