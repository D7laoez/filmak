import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Film, Tv, Compass, LibraryBig, BookOpen, Sparkles, Dices, Star } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { searchMovies } from "@/lib/movies.functions";
import { searchTv } from "@/lib/tv.functions";
import { useLocale } from "@/lib/i18n";

export function QuickSearchModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { locale, dir } = useLocale();
  const ar = locale === "ar";
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(query.trim()), 250);
    return () => window.clearTimeout(t);
  }, [query]);

  const enabled = open && debounced.length >= 2;
  const moviesQuery = useQuery({
    queryKey: ["cmdk-movies", debounced, locale],
    queryFn: () => searchMovies({ data: { q: debounced, lang: locale } }),
    enabled,
    staleTime: 60_000,
  });
  const tvQuery = useQuery({
    queryKey: ["cmdk-tv", debounced, locale],
    queryFn: () => searchTv({ data: { q: debounced, lang: locale } }),
    enabled,
    staleTime: 60_000,
  });

  const go = (to: string) => {
    onOpenChange(false);
    setQuery("");
    navigate({ to });
  };

  const movies = (moviesQuery.data ?? []).slice(0, 5);
  const tvShows = (tvQuery.data ?? []).slice(0, 4);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <div dir={dir}>
        <CommandInput
          value={query}
          onValueChange={setQuery}
          placeholder={
            ar
              ? "ابحث سريعاً عن فيلم، مسلسل، أو صفحة… (Ctrl+K)"
              : "Quick search movies, series, or pages… (Ctrl+K)"
          }
        />
        <CommandList>
          <CommandEmpty>
            {moviesQuery.isFetching || tvQuery.isFetching
              ? ar
                ? "جارٍ البحث…"
                : "Searching…"
              : ar
                ? "لا توجد نتائج مطابقة."
                : "No matching results."}
          </CommandEmpty>

          {movies.length > 0 && (
            <CommandGroup heading={ar ? "الأفلام" : "Movies"}>
              {movies.map((m) => (
                <CommandItem
                  key={`movie-${m.id}`}
                  value={`movie ${m.title} ${m.year}`}
                  onSelect={() => go(`/movie/${m.id}`)}
                  className="flex items-center justify-between gap-3 cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Film className="w-4 h-4 text-primary shrink-0" />
                    <span className="truncate font-medium">{m.title}</span>
                    {m.year && <span className="text-xs text-muted-foreground">{m.year}</span>}
                  </div>
                  {m.rating > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs text-primary tabular-nums shrink-0">
                      <Star className="w-3 h-3 fill-primary" />
                      {m.rating}
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {tvShows.length > 0 && (
            <CommandGroup heading={ar ? "المسلسلات" : "TV Series"}>
              {tvShows.map((tv) => (
                <CommandItem
                  key={`tv-${tv.id}`}
                  value={`tv ${tv.title} ${tv.year}`}
                  onSelect={() => go(`/tv/${tv.id}`)}
                  className="flex items-center justify-between gap-3 cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Tv className="w-4 h-4 text-primary shrink-0" />
                    <span className="truncate font-medium">{tv.title}</span>
                    {tv.year && <span className="text-xs text-muted-foreground">{tv.year}</span>}
                  </div>
                  {tv.rating > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs text-primary tabular-nums shrink-0">
                      <Star className="w-3 h-3 fill-primary" />
                      {tv.rating}
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          <CommandGroup heading={ar ? "تنقل سريع" : "Quick Navigation"}>
            <CommandItem onSelect={() => go("/discover")} className="cursor-pointer">
              <Compass className="w-4 h-4 me-2 text-primary" />
              <span>{ar ? "تصفح واكتشف الأفلام" : "Discover Movies & TV"}</span>
            </CommandItem>
            <CommandItem onSelect={() => go("/collections")} className="cursor-pointer">
              <LibraryBig className="w-4 h-4 me-2 text-primary" />
              <span>{ar ? "المجموعات والمختارات" : "Curated Collections"}</span>
            </CommandItem>
            <CommandItem onSelect={() => go("/articles")} className="cursor-pointer">
              <BookOpen className="w-4 h-4 me-2 text-primary" />
              <span>{ar ? "المقالات والأدلة التحريرية" : "Editorial Articles"}</span>
            </CommandItem>
            <CommandItem onSelect={() => go("/movie-night")} className="cursor-pointer">
              <Sparkles className="w-4 h-4 me-2 text-primary" />
              <span>{ar ? "ليلة الفيلم" : "Movie Night"}</span>
            </CommandItem>
            <CommandItem onSelect={() => go("/pick")} className="cursor-pointer">
              <Dices className="w-4 h-4 me-2 text-primary" />
              <span>{ar ? "اختارلي فيلم عشوائي" : "Random Movie Pick"}</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </div>
    </CommandDialog>
  );
}
