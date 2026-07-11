import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Heart, Star, Film, Loader2 } from "lucide-react";
import { listFavorites } from "@/lib/favorites.functions";

export const Route = createFileRoute("/_authenticated/favorites")({
  component: FavoritesPage,
});

function FavoritesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["favorites"],
    queryFn: () => listFavorites(),
  });

  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/40 backdrop-blur sticky top-0 z-40 bg-background/80">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Film className="w-6 h-6 text-primary" />
            <span className="text-xl font-bold">سينمائي</span>
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-6">
          <Heart className="w-6 h-6 fill-primary text-primary" />
          <h1 className="text-2xl font-bold">أفلامي المفضلة</h1>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> يحمّل…
          </div>
        ) : !data || data.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground mb-4">
              ما عندك أفلام مفضلة بعد. تصفح واضغط القلب على أي فلم لحفظه هنا.
            </p>
            <Link
              to="/"
              className="inline-block bg-primary text-primary-foreground rounded-xl px-5 py-2.5 text-sm font-medium"
            >
              اكتشف أفلاماً
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {data.map((m) => (
              <Link
                key={m.movie_id}
                to="/movie/$id"
                params={{ id: String(m.movie_id) }}
                className="group block"
              >
                <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-muted">
                  {m.poster ? (
                    <img
                      src={m.poster}
                      alt={m.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Film className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  {m.rating != null && (
                    <div className="absolute top-2 right-2 bg-black/70 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Star className="w-3 h-3 fill-primary text-primary" />
                      {m.rating}
                    </div>
                  )}
                </div>
                <p className="mt-2 text-sm font-medium truncate group-hover:text-primary transition">
                  {m.title}
                </p>
                <p className="text-xs text-muted-foreground">{m.year}</p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}