document.addEventListener(
  "mousedown",
  e => {
    if (e.button !== 2) return;
    if (e.target instanceof Node) {
      let node: Node | null = e.target;
      while (node) {
        if (node instanceof HTMLAnchorElement) {
          const url = node.href;
          let title = node.innerText;
          if (!title || title === "") title = url;

          browser.runtime.sendMessage({
            type: "cache-right-click-info",
            data: {
              title,
              url,
              source: {
                title: document.title,
                url: location.href
              }
            }
          });
          break;
        } else {
          node = node.parentNode;
        }
      }
    }
  },
  true
);
