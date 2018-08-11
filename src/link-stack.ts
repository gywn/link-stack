import { Serial } from "./serial";
import { Line, AddDetails, Graph, Snapshot } from "./link-stack.d";

export { Line, AddDetails, Graph, Snapshot };

const emptyGraph = () => ({
  ids: [],
  lines: new Map()
});

export { emptyGraph };

const decodeTitle = (
  encoded: string
): { title: string; sourceId: string | null; score: number } => {
  const m = encoded.match(/(.*) ← (hidden______|[0-9a-zA-Z_-]{12})$/);
  if (!m) return { title: encoded, sourceId: null, score: 1 };
  else {
    return {
      title: m[1],
      sourceId: m[2],
      score: m[2] === "hidden______" ? 0 : 2
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
  if (node.type === "separator")
    return Object.assign({ sourceId: null, score: 1 }, node);
  if (node.type === "bookmark") {
    const { title, sourceId, score } = decodeTitle(node.title);
    if (sourceIds && sourceId && sourceId !== "hidden______")
      sourceIds.add(sourceId);
    return Object.assign({}, node, { title, sourceId, score });
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
      if (l.sourceId === "hidden______" && !sourceIds.has(l.id)) {
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
  const lines = new Map<string, Line>(
    orderedLines.map((l): [string, Line] => [l.id, l])
  );
  for (const [index, l] of orderedLines.entries()) {
    if (l.sourceId && l.sourceId !== "hidden______" && !lines.has(l.sourceId)) {
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
    .filter(l => l.sourceId !== "hidden______")
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
  private _defaultName: string;
  private _serial: Serial;
  private _root: browser.bookmarks.BookmarkTreeNode | null;
  private _monotron: number;
  private _syncedMonotron: number;
  private _onUpdate: (stack: LinkStack) => void;
  private _graph: Graph;

  constructor(opt?: {
    defaultName?: string;
    onUpdate?: ((stack: LinkStack) => void);
  }) {
    this._defaultName = (opt && opt.defaultName) || "Link Stack";
    this._onUpdate = (opt && opt.onUpdate) || (() => {});
    this._serial = new Serial();
    this._serial.subscribe("update", () => this._onUpdate(this));
    this._root = null;
    this._monotron = 0;
    this._syncedMonotron = -1;
    this._graph = emptyGraph();

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

  async push({
    url,
    title,
    source = null
  }: AddDetails): Promise<Line | undefined> {
    const newId = <string>await this._serial.run(async () => {
      const sourceId = !source
        ? null
        : await this._pushWithId({
            url: source.url,
            title: source.title,
            sourceId: "hidden______",
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
    return this._graph.lines.get(newId);
  }

  async remove(id: string): Promise<void> {
    const line = this._graph.lines.get(id);
    if (!line || line.sourceId === "hidden______") return;
    const title = encodeTitle({ title: line.title, sourceId: "hidden______" });
    await this._serial.run(async () => {
      await browser.bookmarks.update(id, { title });
      this._monotron++;
    });
    console.log("BOOKMARK_REMOVE", line.title);
    await this._sync({ message: "remove" });
  }

  async setRoot(opt?: { id?: string; name?: string }): Promise<void> {
    await this._serial.run(async () => {
      const folders = (opt && opt.id
        ? await browser.bookmarks.get(opt.id)
        : await browser.bookmarks.search({
            title: (opt && opt.name) || this._defaultName
          })
      ).filter(n => n.type === "folder");
      this._root =
        folders.length > 0
          ? folders[0]
          : await browser.bookmarks.create({
              title: this._defaultName,
              type: "folder"
            });
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

  private async _syncRoot(opt?: { id?: string; name?: string }): Promise<void> {
    if (!this._root) return;
    const root = (await browser.bookmarks.get(this._root.id))[0];
    this._root = root;
  }

  private _heartBeat = async () => {
    if (!this._root) return;
    const root = (await browser.bookmarks.get(this._root.id))[0];
    if (root.dateGroupModified !== this._root.dateGroupModified)
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
        .map(node => this._graph.lines.get(node.id))
        .filter(l => l)
    );
    // const matched = [...this._graph.lines.values()].filter(l => l.url === url);
    if (matched.length === 0) {
      const inserted = await browser.bookmarks.create({
        url: url,
        title: encodeTitle({ title, sourceId }),
        parentId: this._root.id,
        index: this._graph.lines.size
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
      await browser.bookmarks.move(l.id, { index: this._graph.lines.size });
      console.log("BOOKMARK_UPDATE", encodeTitle({ title, sourceId }));
      return l.id;
    }
  }
}
