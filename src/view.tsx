import "antd/lib/style/index";
import "antd/lib/divider/style";

import "../style/view.less";

import Divider from "antd/lib/divider";
import * as React from "react";
import * as ReactDOM from "react-dom";

import { Provider } from "./context";
import { LinkStack } from "./LinkStack";
import * as texts from "./texts";
import { ViewModel } from "./view-model";

window.onload = async () => {
  const model = new ViewModel();
  (window as any).model = model;

  model.subscribe(state => {
    ReactDOM.render(
      <Provider value={model}>
        {[
          <LinkStack />,
          <div className="footer">
            <a href="https://www.github.com/gywn/link-stack">{texts.forkMe}</a>
            <Divider type="vertical" />
            <a href="https://www.github.com/gywn/link-stack/issues">
              {texts.reportBugs}
            </a>
          </div>
        ]}
      </Provider>,
      document.getElementById("link-stack")
    );
    document.title = texts.extTitle(state.graph.ids.length);
  });

  console.log("view loaded");
};
