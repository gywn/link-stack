export const mapObject = <V>(
  pairs: Iterable<[string, V]>
): { [index: string]: V } => {
  const o: { [index: string]: V } = {};
  for (const [id, val] of pairs) o[id] = val;
  return o;
};
