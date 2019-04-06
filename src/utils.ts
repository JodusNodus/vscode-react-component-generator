export function promisify<T>(func: Function) {
  return (...args: any[]) =>
    new Promise<T>((resolve, reject) => {
      const callback = (err: Error | undefined, data: T) =>
        err ? reject(err) : resolve(data);

      func.apply(null, [...args, callback]);
    });
}
