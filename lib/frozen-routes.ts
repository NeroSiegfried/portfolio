// Routes that keep the old v1 look/behavior untouched: the frozen v1 site and
// the admin dashboard. Shared so every v2-only piece of UI (page transition,
// custom cursor, ...) agrees on exactly which routes to leave alone.
export const isFrozenRoute = (pathname: string) =>
  pathname === "/v1" || pathname.startsWith("/v1/") || pathname === "/control" || pathname.startsWith("/control/")
