export default class EventEmitter {
  private eventListeners: Map<string, Function[]>;

  constructor() {
    this.eventListeners = new Map();
  }

  on(t: string, f: Function) {
    let listeners = this.eventListeners.get(t);
    if (listeners === undefined) {
      listeners = [];
      this.eventListeners.set(t, listeners);
    }

    listeners.push(f);
    return () => this.off(t, f);
  }

  off(t: string, f: Function) {
    const listeners = this.eventListeners.get(t);
    if (listeners === undefined) {
      throw new Error('assertion failure: expected at least 1 listener');
    }

    const indexOf = listeners.indexOf(f);
    if (indexOf < 0) {
      throw new Error('could not unsubscribe from event? did you unsubscribe already?');
    }
    listeners.splice(indexOf, 1);
  }

  protected emit(t: string) {
    const listeners = this.eventListeners.get(t) || [];
    if (listeners.length > 0) {
      console.log('emitting ', t, ' to ', listeners.length, ' listeners');
    }
    for (const listener of listeners) {
      listener();
    }
  }
}
