import {
  hydrate as hydrateQueryClient,
  QueryClient,
  type DehydratedState,
} from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routerWithQueryClient } from "@tanstack/react-router-with-query";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // TMDB lists (trending, popular…) don't change often. Keeping data
        // fresh for 30min and cached for 24h makes navigation feel instant
        // for returning visitors and eliminates redundant refetches.
        staleTime: 1000 * 60 * 30,
        gcTime: 1000 * 60 * 60 * 24,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        retry: 1,
      },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  const queryRouter = routerWithQueryClient(router, queryClient);

  // Cloudflare's streamed SSR transport can produce an empty deferred query
  // chunk. The integration's stream reader passes that undefined chunk into
  // React Query's hydrate(), which expects { mutations, queries } and throws.
  // The initial dehydrated cache is sufficient for critical loader data;
  // deferred queries safely fetch on the client instead of crashing hydration.
  if (queryRouter.options.hydrate) {
    queryRouter.options.hydrate = async (dehydrated) => {
      const state = dehydrated as {
        dehydratedQueryClient?: DehydratedState;
      };
      if (state?.dehydratedQueryClient) {
        hydrateQueryClient(queryClient, state.dehydratedQueryClient);
      }
    };
  }

  return queryRouter;
};
