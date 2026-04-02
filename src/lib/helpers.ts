/**
 * Combines CSS class names into a single space-separated string,
 * skipping falsy values.
 *
 * @param classes Class name values to merge.
 * @returns A normalized class name string.
 */
export function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}
