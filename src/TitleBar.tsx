import * as React from "react";
import { MsgType, createMessage, createIntention } from "./Message";
import { ViewModel } from "./view-model";
import { Consumer } from "./context";
import Cascader from "antd/lib/cascader";
import Button from "antd/lib/button";

export class TitleBar extends React.Component {
  model?: ViewModel;

  render() {
    return (
      <Consumer>
        {(model: ViewModel | null) => {
          if (!model) return;
          this.model = model;
          return model.state.showCascader &&
            model.state.bookmarkTree !== null ? (
            <RootSelector />
          ) : (
            <div className="root">
              <span className="rootTitle">{model.state.name}</span>
              <Button
                size="small"
                onClick={this.onClickChangeRoot}
                htmlType="button"
              >
                Change
              </Button>
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
}

export class RootSelector extends React.Component<
  {},
  { rootId: string | null }
> {
  model?: ViewModel;
  state: { rootId: string | null } = { rootId: null };

  render() {
    return (
      <Consumer>
        {(model: ViewModel | null) => {
          if (!model) return;
          this.model = model;
          return model.state.showCascader && model.state.bookmarkTree ? (
            <div className="root">
              <Cascader
                className="rootSelector"
                size="large"
                options={model.state.bookmarkTree}
                changeOnSelect
                onChange={this.onSelectChange}
              />
              <Button
                size="large"
                type={this.state && this.state.rootId ? "primary" : "default"}
                onClick={this.onClickConfirmRoot}
                htmlType="button"
              >
                {this.state && this.state.rootId ? "Change" : "Cancel"}
              </Button>
            </div>
          ) : null;
        }}
      </Consumer>
    );
  }

  onSelectChange = (values: string[]) => {
    this.setState({
      rootId: values.length > 0 ? values[values.length - 1] : null
    });
  };

  onClickConfirmRoot = (e: React.MouseEvent) => {
    e.preventDefault();
    if (this.model && this.state && this.state.rootId)
      this.model.dispatch(
        createMessage<MsgType.Id>({
          intention: "set-root-id",
          type: MsgType.Id,
          data: this.state.rootId
        })
      );
  };
}
