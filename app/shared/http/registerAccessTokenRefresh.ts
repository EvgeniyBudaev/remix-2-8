import type { ServerBuild } from "@remix-run/server-runtime";
import type { ServerRouteManifest } from "@remix-run/server-runtime/dist/routes";

export function registerAccessTokenRefresh(
  build: ServerBuild,
  jwtParams: any,
  routeIdPrefixList?: string[],
): ServerBuild {

  const routes: ServerRouteManifest = Object.entries(build.routes).reduce(
    (acc, [routeId, route]) => {
      if (!routeIdPrefixList || routeIdPrefixList.every((item) => !routeId.startsWith(item))) {
        return {
          ...acc,
          [routeId]: route,
        };
      }

      const newRoute = {
        ...route,
        module: {
          ...route.module,
        },
      };

      return {
        ...acc,
        [routeId]: newRoute,
      };
    },
    {},
  );

  return {
    ...build,
    routes,
  };
}
