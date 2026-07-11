import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, Loader2 } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { listFavorites, addFavorite, removeFavorite } from "@/lib/favorites.functions";
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
};

export function FavoriteButton({ movie, variant = "full" }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { t, dir } = useLocale();

  const favs = useQuery({
    queryKey: ["favorites"],
    queryFn: () => listFavorites(),
    enabled: !!user,
  });

  const isFav = !!favs.data?.some((f) => f.movie_id === movie.id);

  const toggle = useMutation({
    mutationFn: async () => {
      if (isFav) {
        return removeFavorite({ data: { movie_id: movie.id } });
      }
      return addFavorite({
        data: {
          movie_id: movie.id,
          title: movie.title,
          poster: movie.poster,
          year: movie.year || null,
          rating: movie.rating || null,
        },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["favorites"] });
      toast.success(isFav ? t("removed_fav") : t("added_fav"));
    },
    onError: (e) => toast.error((e as Error).message),
  });

  function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      navigate({ to: "/auth" });
      return;
    }
    toggle.mutate();
  }

  if (variant === "icon") {
    return (
      <button
        onClick={onClick}
        aria-label={isFav ? t("removed_fav") : t("add_fav")}
        className={`absolute top-2 ${dir === "rtl" ? "left-2" : "right-2"} w-8 h-8 rounded-full bg-black/60 backdrop-blur flex items-center justify-center hover:bg-black/80 transition`}
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
    <button
      onClick={onClick}
      disabled={toggle.isPending}
      className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
        isFav
          ? "bg-primary/10 text-primary border border-primary/30"
          : "bg-secondary border border-border hover:bg-secondary/70"
      }`}
    >
      {toggle.isPending ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Heart className={`w-4 h-4 ${isFav ? "fill-primary" : ""}`} />
      )}
      {isFav ? t("in_fav") : t("add_fav")}
    </button>
  );
}