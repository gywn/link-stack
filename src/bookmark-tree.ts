import { CascaderOptionType } from "antd/lib/cascader";

const transformBookmarkTreeNode = (
  node: browser.bookmarks.BookmarkTreeNode
): CascaderOptionType | null => {
  if (!node.children) return null;
  const children = <CascaderOptionType[]>(
    node.children.map(transformBookmarkTreeNode).filter(o => o)
  );
  return Object.assign(
    {
      value: node.id,
      label: node.title
    },
    children.length > 0 ? { children } : null
  );
};

const bookmarkTree = async (): Promise<CascaderOptionType[] | null> => {
  const [node] = await browser.bookmarks.getTree();
  const opt = transformBookmarkTreeNode(node);
  return opt && opt.children ? opt.children : null;
};

export { bookmarkTree };
