import * as React from "react";

import { defaultShortcut } from "./keyboardShortcut";
import * as texts from "./texts";

export const helpMessages: {
  [lang: string]: React.ReactNode;
} = {
  en: [
    <p> {texts.extName} supports three operations: </p>,
    <ul>
      <li>
        Press {defaultShortcut} to <span className="process">save</span> and{" "}
        <span className="danger">close</span> an active tab.
      </li>
      <li>
        Right click on a link and select "{texts.pushLink}" to{" "}
        <span className="process">save</span> it;
      </li>
      <li>
        Click a saved link in {texts.extName} to{" "}
        <span className="danger">delete</span> and{" "}
        <span className="process">open</span> it.
      </li>
    </ul>
  ],
  zh_CN: [
    <p>{texts.extName} 支持三种操作：</p>,
    <ul>
      <li>
        按快捷键 {defaultShortcut} <span className="process">保存</span>并
        <span className="danger">关闭</span>
        一个页面。
      </li>
      <li>
        右键点击链接并选择「
        {texts.pushLink}」<span className="process">保存</span>
        该链接。
      </li>
      <li>
        点击 {texts.extName} 中保存的链接将之
        <span className="danger">删除</span>
        并在新页面中
        <span className="process">打开</span>。
      </li>
    </ul>
  ]
};
