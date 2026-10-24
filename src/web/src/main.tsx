import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/index.css";
import { App } from "./App";

// Follow the host's colour scheme: data-theme="dark|light" when set explicitly, otherwise the OS setting.
const root = document.documentElement;
const syncScheme = () => {
  const theme = root.getAttribute("data-theme");
  root.setAttribute("data-color-scheme", theme === "dark" || theme === "light" ? theme : "auto");
};
syncScheme();
new MutationObserver(syncScheme).observe(root, { attributes: true, attributeFilter: ["data-theme"] });

const container = document.getElementById("root");
if (!container) throw new Error("index.html has no #root element");
createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
