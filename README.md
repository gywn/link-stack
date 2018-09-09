# Link Stack

Link Stack is a Chrome / Firefox browser extension that turns a bookmark folder into a stack of links. Use the key combination to push the active tab onto the stack. Or, click to pop them from the stack and open them in new tabs.

Built with a highly responsive UI, this extension is intended for users who skim hundreds of links per day, e.g. journalists, authors, creatives, researchers, etc.

# Install

- From [Chrome Web Store](https://chrome.google.com/webstore/detail/link-stack/gefmoemocgahhbblcpbbcdncjeimglib)
- From [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/link-stack/)
- Or [build from source](#local-build)

# Local Build

[GNU Make](https://www.gnu.org/software/make/) is required to build the project. The use of [web-ext](https://github.com/mozilla/web-ext) is also recommended. To build the extension, clone this repository and then:

```
npm install
npm run build
web-ext build -s dist
```
