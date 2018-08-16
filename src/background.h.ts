import { browser } from "../lib/browser-polyfill";

export interface View {
  port: browser.runtime.Port;
  monotron: number;
}
