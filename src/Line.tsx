import "antd/lib/icon/style";

import Icon from "antd/lib/icon";
import * as React from "react";

import { Consumer } from "./context";
import { Link } from "./Link";
import { Line as lsLine } from "./link-stack.h";
import { MsgType, createMessage } from "./message";
import * as texts from "./texts";
import { ViewModel } from "./view-model";

interface LineProps {
  id: string;
}

export class Line extends React.Component<LineProps> {
  model?: ViewModel;
  line?: lsLine;

  render() {
    const { id } = this.props;
    return (
      <Consumer>
        {(model: ViewModel | null) => {
          if (!model) return;
          this.model = model;
          const graph = model.state.graph;
          this.line = graph.lines[id];

          if (!this.line || !this.line.url) {
            return;
          }
          const mainLink = (
            <Link
              url={this.line.url}
              title={this.line.title}
              className="mainLink"
              onClick={this.onOpen}
            />
          );
          const removeLink = (
            <a
              className="remove"
              onClick={this.onRemove}
              title={texts.removeLink}
            >
              <Icon type="close" />
            </a>
          );
          if (this.line.sourceId !== null) {
            const source = graph.lines[this.line.sourceId];
            if (!source || !source.url) return;
            const sourceLink = (
              <Link
                url={source.url}
                title={source.title}
                className="sourceLink"
              />
            );
            return (
              <div className="line">
                {removeLink}
                {mainLink}
                <span className="sourceConn">
                  <Icon type="arrow-left" />
                </span>
                {sourceLink}
              </div>
            );
          } else {
            return (
              <div className="line">
                {removeLink}
                {mainLink}
              </div>
            );
          }
        }}
      </Consumer>
    );
  }

  remove() {
    if (!this.model || !this.line) return;
    this.model.dispatch(
      createMessage<MsgType.Id>({
        intention: "delete-id",
        type: MsgType.Id,
        data: this.line.id
      })
    );
  }

  onOpen = (e: React.MouseEvent) => {
    e.preventDefault();
    console.log(e.metaKey);
    if (this.model && this.line && this.line.url)
      this.model.dispatch(
        createMessage<MsgType.TabCreateProps>({
          intention: "open-link",
          type: MsgType.TabCreateProps,
          data: { url: this.line.url, active: !e.metaKey }
        })
      );
    this.remove();
  };

  onRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    this.remove();
  };
}
