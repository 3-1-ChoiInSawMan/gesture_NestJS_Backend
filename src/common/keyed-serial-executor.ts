/** Serializes asynchronous operations sharing an owner, without retaining idle keys. */
export class KeyedSerialExecutor {
  private readonly tails = new Map<string, Promise<unknown>>();

  async run<T>(key: string, operation: () => T | Promise<T>): Promise<T> {
    const previous = this.tails.get(key) ?? Promise.resolve();
    const current = previous.catch(() => undefined).then(operation);
    this.tails.set(key, current);
    try {
      return await current;
    } finally {
      if (this.tails.get(key) === current) this.tails.delete(key);
    }
  }
}
