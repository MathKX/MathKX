// A page's h1 that takes focus when the page was reached by navigating inside the app, so keyboard and
// screen-reader users land at its start (specs/004 FR-016). On the app's first load focus stays where the browser puts it.
import { useEffect, useRef, type ReactNode } from "react";
import { Heading } from "@digdir/designsystemet-react";
import { hasNavigatedInApp } from "../router";

export function PageHeading({ children, "data-testid": testId }: { children: ReactNode; "data-testid"?: string }) {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (hasNavigatedInApp()) ref.current?.focus();
  }, []);
  return (
    <Heading level={1} data-size="lg" ref={ref} tabIndex={-1} className="mkx-page-heading" data-testid={testId}>
      {children}
    </Heading>
  );
}
