import { browser } from "../lib/browser-polyfill";
import * as React from "react";
import { createIntention } from "./Message";
import { ModalState, ViewModel } from "./view-model";
import { Consumer } from "./context";
import Modal from "antd/lib/modal";
import "antd/lib/modal/style";

export class HelpPanel extends React.Component<{}, { rootId: string | null }> {
  model?: ViewModel;
  state: { rootId: string | null } = { rootId: null };

  render() {
    return (
      <Consumer>
        {(model: ViewModel | null) => {
          if (!(model && model.state.modal === ModalState.HelpPanel)) return;
          this.model = model;
          return (
            <Modal
              title={browser.i18n.getMessage("help")}
              visible={true}
              footer={null}
              onCancel={this.onClickCancel}
            >
              <p>{browser.i18n.getMessage("helpText")}</p>
            </Modal>
          );
        }}
      </Consumer>
    );
  }

  onClickCancel = () => {
    if (this.model) this.model.dispatch(createIntention("hide-modal"));
  };
}
