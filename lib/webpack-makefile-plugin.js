const spawnSync = require("child_process").spawnSync;
const path = require("path");
const glob = require("glob").sync;

const PACKAGE_NAME = "webpack-makefile-plugin";

class WebpackMakefilePlugin {
  constructor(opt) {
    this._startTime = Date.now();
    this._makefile = path.resolve((opt && opt.makefile) || "Makefile");
    this._watchFiles =
      opt && opt.watchFiles
        ? []
            .concat(...opt.watchFiles.map(p => glob(p)))
            .map(p => path.resolve(p))
        : [];
    this._watchFiles.push(this._makefile); // Automatically watch the Makefile
    this._prevTimestamps = new Map(this._watchFiles.map(f => [f, 0]));
  }

  apply(compiler) {
    compiler.hooks.afterCompile.tapPromise(
      "WebpackMakefilePlugin",
      async compilation => {
        this._watchFiles.forEach(f => compilation.fileDependencies.add(f));
        const timestamps = new Map(
          this._watchFiles.map(f => [
            f,
            compilation.fileTimestamps.get(f) || this._startTime
          ])
        );
        const changedFiles = this._watchFiles.filter(
          f => this._prevTimestamps.get(f) < timestamps.get(f)
        );
        if (changedFiles.length > 0) {
          const o = spawnSync("make", ["-f", this._makefile], {
            encoding: "utf-8"
          });
          if (o.status === 0) {
            console.log(o.stdout);
          } else {
            console.log("\x1b[1;31m%s\x1b[0m", o.stderr);
            throw `[${PACKAGE_NAME}] make returns with non-zero status.`;
          }
        }
        this._prevTimestamps = timestamps;
      }
    );
  }
}

module.exports = WebpackMakefilePlugin;
