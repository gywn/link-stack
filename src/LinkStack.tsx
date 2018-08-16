import * as React from "react";

import { Consumer } from "./context";
import { Line } from "./Line";
import * as texts from "./texts";
import { TitleBar } from "./TitleBar";
import { helpMessages } from "./util-widgets";
import { ViewModel } from "./view-model";

export class LinkStack extends React.Component {
  render() {
    return (
      <Consumer>
        {(model: ViewModel | null) =>
          model ? (
            <div className="linkStackContent">
              <div
                className={
                  "syncIndicator" +
                  (model.state.unsyncedUpdate ? "" : " hidden")
                }
              />
              <TitleBar />
              {model.state.graph.ids.length > 0 ? (
                <div className="innerLinkStack">
                  {model.state.graph.ids.map(id => (
                    <Line key={id} id={id} />
                  ))}
                </div>
              ) : (
                <div className="innerLinkStackInfo">
                  {helpMessages[texts.lang]}
                </div>
              )}
            </div>
          ) : null
        }
      </Consumer>
    );
  }
}
