import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "../src/App";
import { createFakeApi } from "./fakeApi";

describe("App", () => {
  it("lists lessons from the service in the active language", async () => {
    render(<App api={createFakeApi()} initialPath="/" />);
    expect(await screen.findByText("Tiervenner")).toBeTruthy();
    expect(screen.getByTestId("app-root")).toBeTruthy();
  });

  it("shows a lesson's title, objective, body, and practice entries in the selected language", async () => {
    render(<App api={createFakeApi()} initialPath="/lessons/number-bonds-to-ten" />);
    await screen.findByTestId("lesson-page");
    expect(screen.getByText("Tiervenner")).toBeTruthy();
    expect(screen.getByText("Du lærer tiervennene.")).toBeTruthy();
    expect(await screen.findByRole("heading", { level: 2, name: /Hva er tiervenner\?/ })).toBeTruthy();
    expect((await screen.findByTestId("practice-numbers.addition.within-10")).textContent).toBe("Øv: Summen er høyst 10.");
    expect(document.documentElement.lang).toBe("nb");
  });
});
