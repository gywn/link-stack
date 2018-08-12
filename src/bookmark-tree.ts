import { CascaderOptionType } from "antd/lib/cascader";

export interface BookmarkTreeSelection {
  tree: CascaderOptionType[];
  path: string[];
}

const transformBookmarkTreeNode = (
  node: browser.bookmarks.BookmarkTreeNode
): CascaderOptionType | null => {
  if (!node.children) return null;
  const children = <CascaderOptionType[]>(
    node.children.map(transformBookmarkTreeNode).filter(o => o)
  );
  return {
    value: node.id,
    label: node.title,
    ...(children.length > 0 ? { children } : {})
  };
};

const bookmarkTree = async (): Promise<CascaderOptionType[] | null> => {
  const [node] = await browser.bookmarks.getTree();
  const opt = transformBookmarkTreeNode(node);
  return opt && opt.children ? opt.children : null;
};

const bookmarkPath = async (id: string): Promise<string[]> => {
  const path : string[] = [];
  let _id: string | undefined = id;
  while (_id) {
    const nodes: browser.bookmarks.BookmarkTreeNode[] = await browser.bookmarks.get(_id);
    if (nodes.length === 0) break;
    _id = nodes[0].parentId;
    _id && path.unshift(nodes[0].id);
  }
  return path;
}

export { bookmarkTree, bookmarkPath };
