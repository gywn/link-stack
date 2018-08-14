import { browser } from "../lib/browser-polyfill";
import { mapObject, getBookmark } from "./util";
import { Serial } from "./serial";
import { StoreAPI } from "store2";
import { Line, pushDetails, Graph, Snapshot } from "./link-stack.d";

export { Line, pushDetails, Graph, Snapshot };

const DEFAULT_NAME = browser.i18n.getMessage("extensionName");
const HIDDEN_ID = "hidden______";
// Firefox's id matches [0-9a-zA-Z_-]{12}, Chromium's id matches \d+
const ENCODED_TITLE_PATTERN = new RegExp(
  `(.*) ← (${HIDDEN_ID}|[0-9a-zA-Z_-]{12}|\\d+)$`
);

const emptyGraph = (): Graph => ({
  ids: [],
  lines: {}
});

export { emptyGraph };

const decodeTitle = (
  encoded: string
): { title: string; sourceId: string | null; score: number } => {
  const m = encoded.match(ENCODED_TITLE_PATTERN);
  if (!m) return { title: encoded, sourceId: null, score: 1 };
  else {
    return {
      title: m[1],
      sourceId: m[2],
      score: m[2] === HIDDEN_ID ? 0 : 2
    };
  }
};

const encodeTitle = ({
  title,
  sourceId = null
}: {
  title: string;
  sourceId: string | null;
}): string => title + (sourceId ? " ← " + sourceId : "");

const buildLine = (
  node: browser.bookmarks.BookmarkTreeNode,
  sourceIds?: Set<string>
): Line | null => {
  if (node.url) {
    // not folder
    const { title, sourceId, score } = decodeTitle(node.title);
    if (sourceIds && sourceId && sourceId !== HIDDEN_ID)
      sourceIds.add(sourceId);
    return { ...node, title, sourceId, score };
  }
  return null;
};

const buildGraph = async (
  nodes: browser.bookmarks.BookmarkTreeNode[]
): Promise<Graph> => {
  const sourceIds = new Set<string>();
  const danglingHiddenIds = new Array<string>();

  // Remove hidden links that no link points to
  // Due to the bug related to bookmark index, remove() has to be called serially
  const orderedLines = <Line[]>(
    nodes.map(n => buildLine(n, sourceIds)).filter(l => {
      if (l === null) return false;
      if (l.sourceId === HIDDEN_ID && !sourceIds.has(l.id)) {
        danglingHiddenIds.push(l.id);
        return false;
      }
      return true;
    })
  );
  for (const id of danglingHiddenIds) {
    await browser.bookmarks.remove(id);
  }

  // Modify links whose source is absent, and build correct indices
  // Due to the bug related to bookmark index, move() has to be called serially
  const lines = mapObject<Line>(
    orderedLines.map((l): [string, Line] => [l.id, l])
  );
  for (const [index, l] of orderedLines.entries()) {
    if (l.sourceId && l.sourceId !== HIDDEN_ID && !lines[l.sourceId]) {
      await browser.bookmarks.update(l.id, {
        title: encodeTitle({ title: l.title, sourceId: null })
      });
      l.sourceId = null;
    }
    if (l.index !== index) {
      await browser.bookmarks.move(l.id, { index: index });
      l.index = index;
    }
  }

  const ids = orderedLines
    .filter(l => l.sourceId !== HIDDEN_ID)
    .map(l => l.id)
    .reverse();

  // console.log('GRAPH_CONSISTENCY', danglingHiddenIds.length, linesToUpdate.length);
  return { lines, ids };
};

/*
 * LinkStack Specs
 *
 * 1. All writes (sync(), push()) are asynchronous.
 * 2. All reads (getMonotron(), getGraph()) are synchronous and supposed to be fast.
 * 3. _monotone >= 0
 * 4. There is an eventual consistency between:
 *     a) the latest _monotron,
 *     b) the last _monoton upon which an onUpdate() is invoked.
 * 5. There is no bijection between invocations of onUpdate() and writes.
 */

export class LinkStack {
  private _serial = new Serial();
  private _root: browser.bookmarks.BookmarkTreeNode | null = null;
  private _monotron = 0;
  private _syncedMonotron = -1;
  private _graph: Graph = emptyGraph();

  private _store: StoreAPI | null;
  private _onUpdate: (stack: LinkStack) => void;

  constructor(opt?: {
    onUpdate?: ((stack: LinkStack) => void);
    store?: StoreAPI;
  }) {
    this._store = (opt && opt.store) || null;
    this._onUpdate = (opt && opt.onUpdate) || (() => {});
    this._serial.subscribe("update", () => this._onUpdate(this));

    setInterval(this._heartBeat, 1000 * 5);
  }

  getSnapshot(): Snapshot {
    return {
      name: this._root ? this._root.title : null,
      id: this._root ? this._root.id : null,
      graph: this._graph,
      monotron: this._monotron
    };
  }

  async push({ url, title, source = null }: pushDetails): Promise<Line | null> {
    const newId = await this._serial.run(async () => {
      const sourceId = !source
        ? null
        : await this._pushWithId({
            url: source.url,
            title: source.title,
            sourceId: HIDDEN_ID,
            score: 0
          });
      const score = !source ? 1 : 2;
      const newId = await this._pushWithId({
        url,
        title,
        sourceId: sourceId,
        score
      });
      this._monotron++;
      return newId;
    });
    await this._sync({ message: "push" });
    return (newId && this._graph.lines[newId]) || null;
  }

  async remove(id: string): Promise<void> {
    const line = this._graph.lines[id];
    if (!line || line.sourceId === HIDDEN_ID) return;
    const title = encodeTitle({ title: line.title, sourceId: HIDDEN_ID });
    await this._serial.run(async () => {
      await browser.bookmarks.update(id, { title });
      this._monotron++;
    });
    console.log("BOOKMARK_REMOVE", line.title);
    await this._sync({ message: "remove" });
  }

  async setRoot(opt?: { id?: string; name?: string }): Promise<void> {
    const _id: string | null =
      (opt && opt.id) || (this._store && this._store.get("rootId"));
    await this._serial.run(async () => {
      const folders = (_id
        ? await getBookmark(_id)
        : await browser.bookmarks.search({
            title: (opt && opt.name) || DEFAULT_NAME
          })
      ).filter(n => !n.url); // is folder
      this._root =
        folders.length > 0
          ? folders[0]
          : await browser.bookmarks.create({
              title: DEFAULT_NAME
            });
      if (this._store) this._store.set("rootId", this._root.id);
      this._monotron++;
    });
    await this._sync({ message: "set-root-id" });
  }

  private async _sync(opt?: { message?: string }): Promise<boolean> {
    return this._serial.run(
      async () => {
        if (this._syncedMonotron >= this._monotron) return false;
        await this._syncRoot();
        if (!this._root) return false;
        this._graph = await buildGraph(
          await browser.bookmarks.getChildren(this._root.id)
        );
        await this._syncRoot();
        this._syncedMonotron = this._monotron;
        console.log("SYNC", opt && opt.message ? opt.message : undefined);
        return true;
      },
      { trigger: "update" }
    );
  }

  private async _syncRoot(): Promise<void> {
    if (!this._root) return;
    const root = await getBookmark(this._root.id);
    if (root.length === 0) {
      this._root = null;
    } else {
      this._root = root[0];
    }
  }

  private _heartBeat = async () => {
    if (!this._root) return;
    const root = await getBookmark(this._root.id);
    if (root.length === 0) return;
    if (root[0].dateGroupModified !== this._root.dateGroupModified)
      this._monotron++;
    this._sync({ message: "heart-heat" });
  };

  private async _pushWithId({
    url,
    title,
    sourceId,
    score
  }: {
    url: string;
    title: string;
    sourceId: string | null;
    score: number;
  }): Promise<string | null> {
    if (!this._root) return null;
    const matched = <Line[]>(
      (await browser.bookmarks.search({ url }))
        .map(node => this._graph.lines[node.id])
        .filter(l => l)
    );
    // const matched = [...this._graph.lines.values()].filter(l => l.url === url);
    if (matched.length === 0) {
      const inserted = await browser.bookmarks.create({
        url: url,
        title: encodeTitle({ title, sourceId }),
        parentId: this._root.id,
        index: Object.getOwnPropertyNames(this._graph.lines).length
      });
      console.log("BOOKMARK_CREATE", encodeTitle({ title, sourceId }));
      return inserted.id;
    } else {
      const l = matched[0];
      const newSourceId = l.score > score ? l.sourceId : sourceId;
      await browser.bookmarks.update(l.id, {
        url,
        title: encodeTitle({ title, sourceId: newSourceId })
      });
      await browser.bookmarks.move(l.id, {
        index: Object.getOwnPropertyNames(this._graph.lines).length
      });
      console.log("BOOKMARK_UPDATE", encodeTitle({ title, sourceId }));
      return l.id;
    }
  }
}
