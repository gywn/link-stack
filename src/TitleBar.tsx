import { browser } from "../lib/browser-polyfill";
import * as React from "react";
import { createIntention } from "./Message";
import { ViewModel } from "./view-model";
import { Consumer } from "./context";
import { RootSelector } from "./RootSelector";
import { HelpPanel } from "./HelpPanel";
import Divider from "antd/lib/divider";
import "antd/lib/divider/style";
import Icon from "antd/lib/icon";
import "antd/lib/icon/style";
import Tooltip from "antd/lib/tooltip";
import "antd/lib/tooltip/style";

export class TitleBar extends React.Component {
  model?: ViewModel;

  render() {
    return (
      <Consumer>
        {(model: ViewModel | null) => {
          if (!model) return;
          this.model = model;
          return (
            <div className="root">
              <span className="rootTitle">{model.state.name}</span>
              <Divider type="vertical" />
              <Tooltip
                title={browser.i18n.getMessage("changeBookmarkFolder")}
                placement="bottom"
              >
                <a onClick={this.onClickChangeRoot}>
                  <Icon type="book" />
                </a>
              </Tooltip>
              <RootSelector />
              <span className="elasticSpace" />
              <a className="secondaryLink" onClick={this.onClickShowHelp}>
                {browser.i18n.getMessage("help") + " "}
                <Icon type="question-circle-o" />
              </a>
              <HelpPanel />
            </div>
          );
        }}
      </Consumer>
    );
  }

  onClickChangeRoot = (e: React.MouseEvent) => {
    e.preventDefault();
    if (this.model) this.model.dispatch(createIntention("get-bookmark-tree"));
  };

  onClickShowHelp = (e: React.MouseEvent) => {
    e.preventDefault();
    if (this.model) this.model.dispatch(createIntention("show-help-panel"));
  };
}
