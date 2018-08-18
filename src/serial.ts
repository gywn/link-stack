interface Task<T> {
  func: () => Promise<T> | T;
  resolve: (value?: T | PromiseLike<T>) => void;
  reject: (reason?: any) => void;
  trigger: string[];
}

export interface RunOption {
  trigger?: Iterable<string> | string;
}

export class Serial {
  private _queue: Task<any>[] = [];
  private _running: boolean = false;
  private _triggers: Map<
    string,
    { func: () => void; active: boolean }
  > = new Map();

  subscribe(name: string, func: () => void) {
    this._triggers.set(name, { func, active: false });
  }

  async run<T>(func: () => Promise<T> | T, opt?: RunOption): Promise<T> {
    const trigger =
      opt && opt.trigger
        ? typeof opt.trigger === "string"
          ? [opt.trigger]
          : [...opt.trigger]
        : [];
    const promise = new Promise<T>((resolve, reject) =>
      this._queue.push({ func, resolve, reject, trigger })
    );
    setTimeout(() => this._loop(), 0);
    return promise;
  }

  private async _loop() {
    if (this._running) return;
    else this._running = true;
    const task = this._queue.shift();
    if (!task) {
      this._running = false;
      return;
    }
    const { func, resolve, reject, trigger } = task;
    try {
      const value = await func();
      if (value) {
        trigger.forEach(name => {
          const res = this._triggers.get(name);
          if (res) res.active = true;
        });
      }
      resolve(value);
      this._running = false;
      if (this._queue.length === 0) {
        trigger.forEach(name => {
          const res = this._triggers.get(name);
          if (res && res.active) {
            res.func();
            res.active = false;
          }
        });
      } else setTimeout(() => this._loop(), 0);
    } catch (e) {
      this._running = false;
      reject(e);
    }
  }
}
