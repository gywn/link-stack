import { browser } from "../lib/browser-polyfill";

const t = browser.i18n.getMessage;

export const extName = t("extName");
export const extDesc = t("extDesc");
export const extTitle = (count: number) =>
  t("extTitle", [extName, count.toString()]);
export const emptyLinkText = t("emptyLinkText");
export const openLinkStack = t("openLinkStack", extName);
export const pushLink = t("pushLink", extName);
export const pushActiveTabDesc = t("pushActiveTabDesc");
export const removeLink = t("removeLink");
export const confirm = t("confirm");
export const setRoot = t("setRoot");
export const cancel = t("cancel");
export const changeBookmarkFolder = t("changeBookmarkFolder");
export const changeBookmarkFolderDesc = t("changeBookmarkFolderDesc", extName);
export const help = t("help");
export const failedRoot = t("failedRoot");
export const forkMe = t("forkMe");
export const reportBugs = t("reportBugs");
export const lang = t("lang");
