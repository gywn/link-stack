import { browser } from "../lib/browser-polyfill";

export interface Line extends browser.bookmarks.BookmarkTreeNode {
  sourceId: string | null;
  score: number;
}

export interface Graph {
  ids: string[];
  lines: { [id: string]: Line };
}

export interface AddDetails {
  url: string;
  title: string;
  source: { url: string; title: string } | null;
}

export interface Snapshot {
  name: string | null;
  id: string | null;
  graph: Graph;
  monotron: number;
}
