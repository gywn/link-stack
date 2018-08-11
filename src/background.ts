import { MsgType, isMessage, createMessage } from "./Message";
import { AddDetails, LinkStack } from "./link-stack";
import { bookmarkTree } from "./bookmark-tree";

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
  const views: Map<browser.runtime.Port, View> = new Map();
  (<any>window).views = views; // expose for debugging

  const stack = new LinkStack({ onUpdate: stack => onLSUpdate(views, stack) });
  (<any>window).stack = stack; // expose for debugging
  await stack.setRoot();

  let rightClickInfo: AddDetails | null = null;

  browser.runtime.onConnect.addListener(port => {
    if (port.name === "view") {
      console.log("BG_ON_CONNECT", port.name);
      const view: View = { port, monotron: 0 };
      views.set(port, view);
      port.onMessage.addListener(async o => {
        if (isMessage(o, MsgType.Intention)) {
          if (o.intention === "get-graph") updateView(view, stack);
          if (o.intention === "get-bookmark-tree") {
            port.postMessage(
              createMessage<MsgType.BookmarkTree>({
                intention: "bookmark-tree",
                type: MsgType.BookmarkTree,
                data: await bookmarkTree()
              })
            );
          }
        }
        if (isMessage(o, MsgType.Id)) {
          if (o.intention === "delete-id") await stack.remove(o.data);
          if (o.intention === "set-root-id") await stack.setRoot({ id: o.data });
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

  browser.runtime.onMessage.addListener((o: object) => {
    if (
      isMessage(o, MsgType.AddDetails) &&
      o.intention === "cache-right-click-info"
    )
      rightClickInfo = o.data;
  });

  browser.contextMenus.create({
    title: "Archive this link",
    contexts: ["link"],
    onclick: () => rightClickInfo && stack.push(rightClickInfo)
  });

  browser.browserAction.onClicked.addListener(cmdActivateView);

  browser.commands.onCommand.addListener(cmd => {
    if (cmd === "push-active-tab") cmdPushActiveTab(stack);
  });

  console.log("background loaded");
})();
