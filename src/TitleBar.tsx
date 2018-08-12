import * as React from "react";
import { MsgType, createMessage, createIntention } from "./Message";
import { ViewModel } from "./view-model";
import { Consumer } from "./context";
import Cascader from "antd/lib/cascader";
import "antd/lib/cascader/style";
import Divider from "antd/lib/divider";
import "antd/lib/divider/style";
import Icon from "antd/lib/icon";
import "antd/lib/icon/style";
import Tooltip from "antd/lib/tooltip";
import "antd/lib/tooltip/style";
import Modal from "antd/lib/modal";
import "antd/lib/modal/style";

const SET_ROOT_MSG = (
  <span>
    Link Stack takes over a folder to manage its data. All bookmarks in the said
    folder will be kept.
  </span>
);

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
              <Tooltip title="Change Folder" placement="bottom">
                <a onClick={this.onClickChangeRoot}>
                  <Icon type="book" />
                </a>
              </Tooltip>
              <RootSelector />
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
          return (
            <Modal
              title="Change Folder"
              visible={!!(model.state.showCascader && model.state.bookmarkTree)}
              onOk={this.onClickConfirmRoot}
              okButtonProps={{ disabled: !this.state.rootId }}
              onCancel={this.onClickCancel}
            >
              <p>
                <Cascader
                  className="rootSelector"
                  options={model.state.bookmarkTree || []}
                  changeOnSelect
                  onChange={this.onSelectChange}
                />
              </p>
              <p>{SET_ROOT_MSG}</p>
            </Modal>
          );
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
    if (this.model && this.state.rootId) {
      this.model.dispatch(
        createMessage<MsgType.Id>({
          intention: "set-root-id",
          type: MsgType.Id,
          data: this.state.rootId
        })
      );
    }
  };

  onClickCancel = (e: React.MouseEvent) => {
    if (this.model) this.model.dispatch(createIntention("hide-cascader"));
  };
}
