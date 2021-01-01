export default class Mutex {
  isLocked(): boolean {
    return this._pending;
  }

  acquire(): Promise<Releaser> {
    return new Promise<Releaser>((resolve) => {
      this._queue.push(resolve);

      if (!this._pending) {
        this._pending = true;
        this._dispatchNext();
      }
    });
  }

  async runExclusive<T>(continuation: () => Promise<T>): Promise<T> {
    const release = await this.acquire();

    try {
      return await continuation();
    } catch (e) {
      throw e;
    } finally {
      release();
    }
  }

  private _dispatchNext = () => {
    const next = this._queue.shift();
    if (next === undefined) {
      this._pending = false;
    } else {
      next(this._dispatchNext);
    }
  };

  private _queue: Array<(release: Releaser) => void> = [];
  private _pending = false;
}

interface Releaser {
  (): void;
}
