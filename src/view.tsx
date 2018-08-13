import { browser } from "../lib/browser-polyfill";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { ViewModel } from "./view-model";
import { Provider } from "./context";
import { LinkStack } from "./LinkStack";
import "../style/view.less";

window.onload = async () => {
  const model = new ViewModel();
  (window as any).model = model;

  model.subscribe(state => {
    ReactDOM.render(
      <Provider value={model}>
        <LinkStack />
      </Provider>,
      document.body
    );
    document.title =
      browser.i18n.getMessage(
        "extensionTitle",
        state.graph.ids.length.toString()
      ) +
      " | " +
      browser.i18n.getMessage("extensionName");
  });

  console.log("view loaded");
};
