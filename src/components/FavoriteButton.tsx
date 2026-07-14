import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, Loader2, Bookmark, CheckCircle2 } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { listMyItems, upsertItem, removeItem, type MediaType } from "@/lib/user-lists.functions";
import { toast } from "sonner";
import { useLocale } from "@/lib/i18n";

type Props = {
  movie: {
    id: number;
    title: string;
    poster: string | null;
    year: string;
    rating: number;
  };
  variant?: "icon" | "full";
  mediaType?: MediaType;
};

export function FavoriteButton({ movie, variant = "full", mediaType = "movie" }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { t } = useLocale();

  const items = useQuery({
    queryKey: ["user-lists"],
    queryFn: () => listMyItems({ data: {} }),
    enabled: !!user,
  });

  const match = items.data?.find(
    (f) => f.media_id === movie.id && f.media_type === mediaType,
  );
  const status = match?.status ?? null;
  const isFav = status === "favorite";

  const setStatus = useMutation({
    mutationFn: async (next: "favorite" | "watchlist" | "watched" | null) => {
      // If clicking the same status, remove; else upsert (and remove other statuses of same media so it lives in exactly one list)
      const same = match && next === match.status;
      if (same || next === null) {
        return removeItem({
          data: { media_type: mediaType, media_id: movie.id, status: match!.status },
        });
      }
      // Remove other statuses first, then upsert new
      if (match && match.status !== next) {
        await removeItem({
          data: { media_type: mediaType, media_id: movie.id, status: match.status },
        });
      }
      return upsertItem({
        data: {
          media_type: mediaType,
          media_id: movie.id,
          status: next,
          title: movie.title,
          poster: movie.poster,
          year: movie.year || null,
          tmdb_rating: movie.rating || null,
        },
      });
    },
    onSuccess: (_res, next) => {
      qc.invalidateQueries({ queryKey: ["user-lists"] });
      const same = match && next === match.status;
      if (same || next === null) toast.success(t("removed_fav"));
      else if (next === "favorite") toast.success(t("added_fav"));
      else if (next === "watchlist") toast.success(t("added_watchlist"));
      else if (next === "watched") toast.success(t("marked_watched"));
    },
    onError: (e) => toast.error((e as Error).message),
  });
  const toggle = { mutate: () => setStatus.mutate("favorite"), isPending: setStatus.isPending };

  function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      navigate({ to: "/auth" });
      return;
    }
    toggle.mutate();
  }

  function pick(e: React.MouseEvent, next: "watchlist" | "watched") {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      navigate({ to: "/auth" });
      return;
    }
    setStatus.mutate(next);
  }

  if (variant === "icon") {
    return (
      <button
        onClick={onClick}
        aria-label={isFav ? t("removed_fav") : t("add_fav")}
        className="absolute top-2 left-2 w-8 h-8 rounded-full bg-black/60 backdrop-blur flex items-center justify-center hover:bg-black/80 transition"
      >
        {toggle.isPending ? (
          <Loader2 className="w-4 h-4 animate-spin text-white" />
        ) : (
          <Heart
            className={`w-4 h-4 ${isFav ? "fill-primary text-primary" : "text-white"}`}
          />
        )}
      </button>
    );
  }

  return (
    <div className="inline-flex items-center gap-2">
      <button
        onClick={onClick}
        disabled={setStatus.isPending}
        className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
          isFav
            ? "bg-primary/10 text-primary border border-primary/30"
            : "bg-secondary border border-border hover:bg-secondary/70"
        }`}
      >
        {setStatus.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Heart className={`w-4 h-4 ${isFav ? "fill-primary" : ""}`} />}
        {isFav ? t("in_fav") : t("add_fav")}
      </button>
      <button
        onClick={(e) => pick(e, "watchlist")}
        disabled={setStatus.isPending}
        aria-label={t("add_watchlist")}
        title={t("add_watchlist")}
        className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
          status === "watchlist"
            ? "bg-accent/20 text-accent border border-accent/40"
            : "bg-secondary border border-border hover:bg-secondary/70"
        }`}
      >
        <Bookmark className={`w-4 h-4 ${status === "watchlist" ? "fill-accent" : ""}`} />
        <span className="hidden sm:inline">{status === "watchlist" ? t("in_watchlist") : t("add_watchlist")}</span>
      </button>
      <button
        onClick={(e) => pick(e, "watched")}
        disabled={setStatus.isPending}
        aria-label={t("mark_watched")}
        title={t("mark_watched")}
        className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
          status === "watched"
            ? "bg-emerald-500/15 text-emerald-500 border border-emerald-500/40"
            : "bg-secondary border border-border hover:bg-secondary/70"
        }`}
      >
        <CheckCircle2 className="w-4 h-4" />
        <span className="hidden sm:inline">{status === "watched" ? t("watched") : t("mark_watched")}</span>
      </button>
    </div>
  );
}