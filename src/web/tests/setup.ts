import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// The lesson body is a lazily loaded chunk (specs/003 R1). Load it once here so React.lazy resolves from the
// module cache in tests instead of racing Testing Library's default wait with the first transform of remark.
await import("../src/lesson/LessonView");

afterEach(() => {
  cleanup();
});
