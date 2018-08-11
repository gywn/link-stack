import * as React from "react";
import { ViewModel } from "./view-model";

const { Provider, Consumer } = React.createContext<ViewModel | null>(null);

export { Provider, Consumer };
