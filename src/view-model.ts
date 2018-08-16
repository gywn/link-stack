import { browser } from "../lib/browser-polyfill";
import { BookmarkTreeSelection } from "./bookmark-tree";
import { Snapshot, emptyGraph } from "./link-stack";
import { Message, MsgType, createIntention, isMessage } from "./Message";

class Delayer {
  private _handle: number | null;

  constructor() {
    this._handle = null;
  }

  later(func: (...args: any[]) => void, timeout: number) {
    if (this._handle !== null) clearTimeout(this._handle);
    this._handle = setTimeout(func, timeout);
  }
}

export enum ModalState {
  None,
  RootSelector,
  HelpPanel
}

export interface ViewModelState extends Snapshot {
  unsyncedUpdate: boolean;
  bookmarkTreeSelection: BookmarkTreeSelection | null;

  modal: ModalState;
}

export class ViewModel {
  state: ViewModelState;

  private _port: browser.runtime.Port;
  private _listeners: ((state: ViewModelState) => void)[];
  private _updateDelayer: Delayer;

  constructor() {
    this.state = {
      name: null,
      id: null,
      graph: emptyGraph(),
      monotron: 0,
      unsyncedUpdate: true,
      bookmarkTreeSelection: null,
      modal: ModalState.None
    };
    this._port = browser.runtime.connect({ name: "view" });
    this._listeners = [];
    this._updateDelayer = new Delayer();

    this._port.onMessage.addListener(o => this.dispatch(o as any));

    this.dispatch(createIntention("_init"));
  }

  dispatch(o: Message<MsgType>) {
    if (isMessage(o, MsgType.Snapshot)) {
      console.log(
        "MODEL_ON_MSG",
        o.intention,
        this.state.monotron,
        o.data.monotron
      );
    } else {
      console.log("MODEL_ON_MSG", o.intention);
    }

    const state = this.state;
    if (isMessage(o, MsgType.Intention)) {
      if (o.intention === "_init")
        this._port.postMessage(createIntention("get-graph"));
      if (o.intention === "get-bookmark-tree") {
        this._port.postMessage(o);
        // this.state = { ...this.state, modal: true };
      }
      if (o.intention === "show-help-panel")
        this.state = { ...this.state, modal: ModalState.HelpPanel };
      if (o.intention === "hide-modal") {
        this.state = { ...this.state, modal: ModalState.None };
      }
    }
    if (isMessage(o, MsgType.Snapshot)) {
      if (o.intention === "update")
        this._updateDelayer.later(
          () => this.dispatch({ ...o, intention: "_do-update" }),
          this.state.monotron <= o.data.monotron ? 0 : 3000
        );
      if (o.intention === "_do-update")
        this.state = { ...this.state, ...o.data, unsyncedUpdate: false };
    }
    if (isMessage(o, MsgType.Id)) {
      if (o.intention === "delete-id") {
        this._port.postMessage(o);

        // fast UI update
        this.state.graph.ids = this.state.graph.ids.filter(id => id !== o.data);
        this.state = {
          ...this.state,
          monotron: this.state.monotron + 1,
          unsyncedUpdate: true
        };
      }
      if (o.intention === "set-root-id") {
        this._port.postMessage(o);
        this.state = { ...this.state, modal: ModalState.None };
      }
    }
    if (
      isMessage(o, MsgType.BookmarkTreeSelection) &&
      o.intention === "bookmark-tree"
    )
      this.state = {
        ...this.state,
        bookmarkTreeSelection: o.data,
        modal: ModalState.RootSelector
      };
    if (isMessage(o, MsgType.TabCreateProps) && o.intention === "open-link")
      browser.tabs.create(o.data); // async

    if (state !== this.state) this._listeners.forEach(f => f(this.state));
  }

  subscribe(listener: (state: ViewModelState) => void) {
    this._listeners.push(listener);
  }
}
