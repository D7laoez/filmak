import { QueryClient } from "@tanstack/react-query";
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
  const originalHydrate = queryRouter.options.hydrate;

  if (originalHydrate) {
    queryRouter.options.hydrate = async (dehydrated) => {
      const state = dehydrated as typeof dehydrated & {
        queryStream?: ReadableStream<unknown>;
      };
      const stream = state?.queryStream;

      // Some edge runtimes can emit empty chunks while transferring the
      // deferred query stream. The integration expects every chunk to be a
      // DehydratedState and crashes when it receives undefined.
      if (stream?.getReader) {
        const reader = stream.getReader();
        const safeStream = new ReadableStream<unknown>({
          async pull(controller) {
            while (true) {
              const chunk = await reader.read();
              if (chunk.done) {
                controller.close();
                return;
              }
              if (chunk.value != null) {
                controller.enqueue(chunk.value);
                return;
              }
            }
          },
          cancel(reason) {
            return reader.cancel(reason);
          },
        });
        return originalHydrate({ ...state, queryStream: safeStream });
      }

      return originalHydrate({
        ...state,
        queryStream: new ReadableStream<unknown>({
          start(controller) {
            controller.close();
          },
        }),
      });
    };
  }

  return queryRouter;
};
