import * as store from "store2";

import { browser } from "../lib/browser-polyfill";
import { bookmarkPath, bookmarkTree } from "./bookmark-tree";
import { LinkStack } from "./link-stack";
import { MsgType, createMessage, isMessage } from "./Message";
import * as texts from "./texts";

interface View {
  port: browser.runtime.Port;
  monotron: number;
}

const updateView = (view: View, stack: LinkStack) => {
  const ss = stack.getSnapshot();
  view.port.postMessage(
    createMessage<MsgType.Snapshot>({
      intention: "update",
      type: MsgType.Snapshot,
      data: ss
    })
  );
  view.monotron = ss.monotron;
};

const onLSUpdate = (
  views: Map<browser.runtime.Port, View>,
  stack: LinkStack
) => {
  for (const view of views.values()) {
    if (view.monotron >= stack.getSnapshot().monotron) continue;
    updateView(view, stack);
  }
  console.log("BG_SEND_UPDATE");
};

const cmdActivateView = async () => {
  console.log("ACTIVATE_VIEW");
  const viewURL = browser.extension.getURL("view.html");
  const tabs = await browser.tabs.query({ url: viewURL });
  if (tabs.length > 0) browser.tabs.update(tabs[0].id, { active: true });
  else browser.tabs.create({ url: viewURL });
};

const cmdPushActiveTab = async (stack: LinkStack) => {
  const tab = (await browser.tabs.query({ active: true }))[0];
  if (tab.id && tab.url && tab.title) {
    const promise = stack.push({
      url: tab.url,
      title: tab.title,
      source: null
    });
    browser.tabs.remove(tab.id);
    await promise;
  }
};

(async () => {
  (window as any).wrappedBrowser = browser; // expose for debugging

  const views: Map<browser.runtime.Port, View> = new Map();
  (window as any).views = views; // expose for debugging

  const stack = new LinkStack({
    store: store.local,
    onUpdate: stack => onLSUpdate(views, stack)
  });
  (window as any).stack = stack; // expose for debugging
  await stack.setRoot();

  (window as any).store = store; // expose for debugging

  browser.runtime.onConnect.addListener(port => {
    if (port.name === "view") {
      console.log("BG_ON_CONNECT", port.name);
      const view: View = { port, monotron: 0 };
      views.set(port, view);
      port.onMessage.addListener(async o => {
        if (isMessage(o, MsgType.Intention)) {
          if (o.intention === "get-graph") updateView(view, stack);
          if (o.intention === "get-bookmark-tree") {
            const tree = await bookmarkTree();
            const rootId = stack.getSnapshot().id;
            if (tree) {
              port.postMessage(
                createMessage<MsgType.BookmarkTreeSelection>({
                  intention: "bookmark-tree",
                  type: MsgType.BookmarkTreeSelection,
                  data: { tree, path: rootId ? await bookmarkPath(rootId) : [] }
                })
              );
            }
          }
        }
        if (isMessage(o, MsgType.Id)) {
          if (o.intention === "delete-id") await stack.remove(o.data);
          if (o.intention === "set-root-id")
            await stack.setRoot({ id: o.data });
        }
        console.log(
          "BG_ON_MSG",
          (o as any).type,
          (o as any).intention,
          (o as any).data
        );
      });
    }
    port.onDisconnect.addListener(() => views.delete(port));
  });

  browser.contextMenus.create({
    title: texts.pushLink,
    contexts: ["link"],
    onclick: (click, tab) => {
      // linkText is a Firefox-only property. Chromium auto select link's text.
      if (!(click.linkUrl && tab.title && tab.url)) return;
      const title: string | undefined =
        (click as any).linkText || click.selectionText;
      const details = {
        url: click.linkUrl,
        title: !title || title === "" ? click.linkUrl : title,
        source: {
          url: tab.url,
          title: tab.title
        }
      };
      stack.push(details);
    }
  });

  browser.browserAction.onClicked.addListener(cmdActivateView);

  browser.commands.onCommand.addListener(cmd => {
    if (cmd === "push-active-tab") cmdPushActiveTab(stack);
  });

  browser.runtime.onInstalled.addListener(cmdActivateView);

  console.log("background loaded");
})();
