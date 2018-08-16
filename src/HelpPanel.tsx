import "antd/lib/modal/style";

import Modal from "antd/lib/modal";
import * as React from "react";

import { Consumer } from "./context";
import { helpMessages } from "./helpMessages";
import { createIntention } from "./message";
import * as texts from "./texts";
import { ModalState, ViewModel } from "./view-model";

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
              title={texts.help}
              visible={true}
              footer={null}
              onCancel={this.onClickCancel}
            >
              {helpMessages[texts.lang]}
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
