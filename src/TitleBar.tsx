import "antd/lib/divider/style";
import "antd/lib/icon/style";
import "antd/lib/tooltip/style";

import Divider from "antd/lib/divider";
import Icon from "antd/lib/icon";
import Tooltip from "antd/lib/tooltip";
import * as React from "react";

import { Consumer } from "./context";
import { HelpPanel } from "./HelpPanel";
import { createIntention } from "./message";
import { RootSelector } from "./RootSelector";
import * as texts from "./texts";
import { ViewModel } from "./view-model";

export class TitleBar extends React.Component {
  model?: ViewModel;

  render() {
    return (
      <Consumer>
        {(model: ViewModel | null) => {
          if (!model) return;
          this.model = model;
          return (
            <div className="title-bar">
              {this.model.state.id ? (
                [
                  <span className="root-title">{model.state.name}</span>,
                  <Divider type="vertical" />,
                  <Tooltip
                    title={texts.changeBookmarkFolder}
                    placement="bottom"
                  >
                    <a onClick={this.onClickChangeRoot}>
                      <Icon type="book" />
                    </a>
                  </Tooltip>
                ]
              ) : (
                <a onClick={this.onClickChangeRoot}>
                  {texts.failedRoot + " "}
                  <Icon type="book" />
                </a>
              )}
              <RootSelector />
              <span className="elastic-space" />
              {this.model.state.graph.ids.length > 0
                ? [
                    <a
                      className="secondary-link"
                      onClick={this.onClickShowHelp}
                    >
                      {texts.help + " "}
                      <Icon type="question-circle-o" />
                    </a>,
                    <HelpPanel />
                  ]
                : null}
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
