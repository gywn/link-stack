import * as React from "react";

import { Consumer } from "./context";
import { helpMessages } from "./helpMessages";
import { Line } from "./Line";
import * as texts from "./texts";
import { TitleBar } from "./TitleBar";
import { ViewModel } from "./view-model";

export class LinkStack extends React.Component {
  render() {
    return (
      <Consumer>
        {(model: ViewModel | null) =>
          model ? (
            <div className="content">
              <div
                className={
                  "sync-indicator" +
                  (model.state.unsyncedUpdate ? "" : " hidden")
                }
              />
              <TitleBar />
              {model.state.graph.ids.length > 0 ? (
                <div className="inner-link-stack">
                  {model.state.graph.ids.map(id => (
                    <Line key={id} id={id} />
                  ))}
                </div>
              ) : (
                <div className="inner-link-stack-info">
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
