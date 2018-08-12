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
          if (!(model && model.state.bookmarkTreeSelection)) return;
          this.model = model;
          return (
            <Modal
              title={browser.i18n.getMessage("changeBookmarkFolder")}
              visible={
                !!(
                  model.state.showCascader && model.state.bookmarkTreeSelection
                )
              }
              okText={browser.i18n.getMessage("setRoot")}
              cancelText={browser.i18n.getMessage("cancel")}
              okButtonProps={{ disabled: !this.state.rootId }}
              onOk={this.onClickConfirmRoot}
              onCancel={this.onClickCancel}
            >
              <p>
                <Cascader
                  className="rootSelector"
                  options={model.state.bookmarkTreeSelection.tree}
                  defaultValue={model.state.bookmarkTreeSelection.path}
                  changeOnSelect
                  allowClear={false}
                  onChange={this.onSelectChange}
                />
              </p>
              <p>{browser.i18n.getMessage("changeBookmarkFolderDesc")}</p>
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

  onClickConfirmRoot = () => {
    if (this.model && this.state.rootId) {
      this.setState({ rootId: null });
      this.model.dispatch(
        createMessage<MsgType.Id>({
          intention: "set-root-id",
          type: MsgType.Id,
          data: this.state.rootId
        })
      );
    }
  };

  onClickCancel = () => {
    if (this.model) this.model.dispatch(createIntention("hide-cascader"));
  };
}
