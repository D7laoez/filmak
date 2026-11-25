import { createFileRoute, Outlet, notFound, rootRouteId } from "@tanstack/react-router";
import { checkIsAdmin, logUnauthorizedAdminAccess } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/_admin")({
  head: () => ({
    meta: [{ title: "الإدارة — فلمك" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  loader: async ({ location }) => {
    const { isAdmin } = await checkIsAdmin();
    if (!isAdmin) {
      // Fire-and-forget: don't block the 404 response on the log call.
      void logUnauthorizedAdminAccess({ data: { path: location.pathname } }).catch(() => {});
      throw notFound({ routeId: rootRouteId });
    }
    return null;
  },
  errorComponent: () => null,
  component: () => <Outlet />,
});
