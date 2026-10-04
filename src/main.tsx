import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/tokens.css";
import "./styles/global.css";
import "./styles/refine.css";
import "./styles/study.css";
import "./styles/round3.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

if (import.meta.env.DEV) {
  // dev tools: drive the ticker by hand when the tab is in the background
  void import("./lib/motion").then(({ gsap, ScrollTrigger, scrollToY }) => Object.assign(window, { __gsap: gsap, __ST: ScrollTrigger, __scrollTo: (y: number) => scrollToY(y, 0) }));
}
