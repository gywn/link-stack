import * as React from "react";
import { ViewModel } from "./view-model";
import { Consumer } from "./context";
import { TitleBar } from "./TitleBar";
import { Line } from "./Line";

export class LinkStack extends React.Component {
  render() {
    return (
      <Consumer>
        {(model: ViewModel | null) =>
          model ? (
            <div className="linkStack">
              <div
                className={
                  "syncIndicator" +
                  (model.state.unsyncedUpdate ? "" : " hidden")
                }
              />
              <TitleBar />
              {model.state.graph.ids.map(id => (
                <Line key={id} id={id} />
              ))}
            </div>
          ) : null
        }
      </Consumer>
    );
  }
}