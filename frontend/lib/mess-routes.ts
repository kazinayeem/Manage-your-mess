/** Build mess-scoped paths: /mess/{messId}/... */
export function messPath(messId: string, subpath = "") {
  const base = `/mess/${messId}`;
  if (!subpath || subpath === "/") return base;
  return `${base}${subpath.startsWith("/") ? subpath : `/${subpath}`}`;
}

export function getMessHomePath(messId: string) {
  return messPath(messId);
}
