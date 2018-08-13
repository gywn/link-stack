import { browser } from "../lib/browser-polyfill";

export const mapObject = <V>(
  pairs: Iterable<[string, V]>
): { [index: string]: V } => {
  const o: { [index: string]: V } = {};
  for (const [id, val] of pairs) o[id] = val;
  return o;
};

// A silently failed version
export const getBookmark = async (
  id: string
): Promise<browser.bookmarks.BookmarkTreeNode[]> => {
  try {
    return await browser.bookmarks.get(id);
  } catch (e) {
    return [];
  }
};
