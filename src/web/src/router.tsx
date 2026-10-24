// A small history router: four routes, no dependency.
import { createContext, useContext, useEffect, useState, type MouseEvent, type ReactNode } from "react";

interface RouterState {
  path: string;
  navigate(path: string): void;
}

const RouterContext = createContext<RouterState>({ path: "/", navigate: () => undefined });

export function RouterProvider({ children, initialPath }: { children: ReactNode; initialPath?: string }) {
  const [path, setPath] = useState(initialPath ?? (typeof window !== "undefined" ? window.location.pathname : "/"));
  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  const navigate = (next: string) => {
    if (typeof window !== "undefined" && next !== window.location.pathname) window.history.pushState(null, "", next);
    setPath(next);
  };
  return <RouterContext.Provider value={{ path, navigate }}>{children}</RouterContext.Provider>;
}

export const useRouter = () => useContext(RouterContext);

interface LinkProps {
  to: string;
  children: ReactNode;
  className?: string;
  /** Runs on every activation of the link, pointer or keyboard, before the navigation. */
  onActivate?: () => void;
  "data-testid"?: string;
}

export function Link({ to, children, className, onActivate, "data-testid": testId }: LinkProps) {
  const { navigate } = useRouter();
  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.defaultPrevented) return;
    onActivate?.(); // Enter on the focused anchor arrives here as a click, like a pointer press
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    navigate(to);
  };
  return (
    <a href={to} onClick={onClick} className={className} data-testid={testId}>
      {children}
    </a>
  );
}

export type Route =
  | { name: "lessons" }
  | { name: "lesson"; id: string }
  | { name: "practice"; skillId: string }
  | { name: "record" }
  | { name: "unknown" };

export function matchRoute(path: string): Route {
  const parts = path.split("/").filter(Boolean).map(decodeURIComponent);
  if (parts.length === 0) return { name: "lessons" };
  if (parts[0] === "lessons" && parts[1]) return { name: "lesson", id: parts[1] };
  if (parts[0] === "practice" && parts[1]) return { name: "practice", skillId: parts[1] };
  if (parts[0] === "record") return { name: "record" };
  return { name: "unknown" };
}
