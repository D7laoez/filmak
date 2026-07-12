import { createFileRoute, Outlet, notFound, rootRouteId } from "@tanstack/react-router";
import { checkIsAdmin } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/_admin")({
  loader: async () => {
    const { isAdmin } = await checkIsAdmin();
    if (!isAdmin) throw notFound({ routeId: rootRouteId });
    return null;
  },
  errorComponent: () => null,
  component: () => <Outlet />,
});