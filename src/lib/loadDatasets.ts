/** Run independent dataset requests and publish each outcome separately. */
export async function loadDatasets<T>(
  loaders: Record<string, () => Promise<T>>,
  onSuccess: (name: string, value: T) => void,
  onError: (name: string, message: string) => void,
): Promise<void> {
  await Promise.all(Object.entries(loaders).map(async ([name, load]) => {
    try { onSuccess(name, await load()); }
    catch (cause) { onError(name, cause instanceof Error ? cause.message : 'Failed to load data'); }
  }));
}
