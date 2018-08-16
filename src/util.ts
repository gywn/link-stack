import { browser } from "../lib/browser-polyfill";

export const mapObject = <V>(
  pairs: Iterable<[string, V]>
): { [index: string]: V } => {
  const o: { [index: string]: V } = {};
  for (const [id, val] of pairs) o[id] = val;
  return o;
};

// return Option type
export const bookmarks = {
  get: async (id: string): Promise<browser.bookmarks.BookmarkTreeNode[]> => {
    try {
      return await browser.bookmarks.get(id);
    } catch (e) {
      return [];
    }
  },
  create: async (
    details: browser.bookmarks.CreateDetails
  ): Promise<browser.bookmarks.BookmarkTreeNode | null> => {
    try {
      return await browser.bookmarks.create(details);
    } catch (e) {
      return null;
    }
  },
  update: async (
    id: string,
    changes: { title?: string; url?: string }
  ): Promise<browser.bookmarks.BookmarkTreeNode | null> => {
    try {
      return await browser.bookmarks.update(id, changes);
    } catch (e) {
      return null;
    }
  },
  move: async (
    id: string,
    destination: browser.bookmarks.Destination
  ): Promise<browser.bookmarks.BookmarkTreeNode | null> => {
    try {
      return await browser.bookmarks.move(id, destination);
    } catch (e) {
      return null;
    }
  },
  remove: async (id: string): Promise<boolean> => {
    try {
      await browser.bookmarks.remove(id);
      return true;
    } catch (e) {
      return false;
    }
  }
};
