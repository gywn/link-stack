import "antd/lib/cascader/style";
import "antd/lib/modal/style";

import Cascader from "antd/lib/cascader";
import Modal from "antd/lib/modal";
import * as React from "react";

import { Consumer } from "./context";
import { MsgType, createIntention, createMessage } from "./Message";
import * as texts from "./texts";
import { ModalState, ViewModel } from "./view-model";

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
          if (!(model && model.state.modal === ModalState.RootSelector)) return;
          this.model = model;
          return (
            <Modal
              title={texts.changeBookmarkFolder}
              okText={texts.setRoot}
              visible={true}
              cancelText={texts.cancel}
              okButtonProps={{ disabled: !this.state.rootId }}
              onOk={this.onClickConfirmRoot}
              onCancel={this.onClickCancel}
            >
              <p>
                {model.state.bookmarkTreeSelection ? (
                  <Cascader
                    className="rootSelector"
                    options={model.state.bookmarkTreeSelection.tree}
                    defaultValue={model.state.bookmarkTreeSelection.path}
                    changeOnSelect
                    allowClear={false}
                    onChange={this.onSelectChange}
                  />
                ) : null}
              </p>
              <p>{texts.changeBookmarkFolderDesc}</p>
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
    if (this.model) this.model.dispatch(createIntention("hide-modal"));
  };
}
