import * as React from "react";

interface LinkProps {
  url: string;
  title: string;
  className: string;
  onClick?: (e: React.MouseEvent) => void;
}

export class Link extends React.Component<LinkProps> {
  render() {
    const { url, title, className, onClick = () => {} } = this.props;
    const a = document.createElement("a");
    a.href = url;
    const hostname = a.hostname;
    return (
      <a
        className={"link " + className}
        href={url}
        onClick={onClick}
        target="_blank"
        title={title}
      >
        <div className="faviconWrapper">
          <img
            className="favicon"
            src={"https://www.google.com/s2/favicons?domain=" + hostname}
          />
        </div>
        <span className="linkText">{title}</span>
      </a>
    );
  }
}
