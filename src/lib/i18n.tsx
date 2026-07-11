import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Locale = "ar" | "en";

const DICT: Record<Locale, Dict> = {
  ar: {
    brand: "فيلمك",
    tagline_ai: "مدعوم بالذكاء الاصطناعي",
    hero_1: "صف الفلم اللي في بالك",
    hero_2: "ونجيبه لك",
    hero_sub:
      "بدل ما تضيع ساعة تدور، اكتب مزاجك أو نوع الفلم اللي تحبه واتركنا نرشح لك.",
    prompt_placeholder: "مثال: أبي فلم إثارة نفسي مثل Inception بس أقصر…",
    recommend_btn: "رشّح لي",
    search_placeholder: "ابحث عن فلم…",
    login: "دخول",
    logout: "تسجيل الخروج",
    my_favorites: "مفضلتي",
    logout_toast: "تم تسجيل الخروج",
    search_results: "نتائج البحث",
    trending: "رائجة هذا الأسبوع",
    now_playing: "الجديد في السينما",
    upcoming: "قريباً",
    top_rated: "الأعلى تقييماً",
    popular: "شائعة الآن",
    tv_series: "مسلسل",
    movie: "فلم",
    loading: "يحمّل…",
    footer:
      "This product uses the TMDB API but is not endorsed or certified by TMDB.",
    back: "رجوع",
    watch_trailer: "شاهد الإعلان الرسمي",
    where_to_watch: "أين تشاهد الفلم",
    by_subscription: "بالاشتراك",
    rent: "تأجير",
    buy: "شراء",
    view_all_tmdb: "عرض كل الخيارات على TMDB",
    cast: "طاقم التمثيل",
    similar: "أفلام مشابهة",
    minutes_short: "د",
    not_found: "غير موجود",
    error_load_movie: "تعذّر تحميل الفلم",
    retry: "حاول مجدداً",
    favorites_title: "أفلامي المفضلة",
    favorites_empty:
      "ما عندك أفلام مفضلة بعد. تصفح واضغط القلب على أي فلم لحفظه هنا.",
    discover: "اكتشف أفلاماً",
    add_fav: "أضف إلى المفضلة",
    in_fav: "في المفضلة",
    added_fav: "أُضيف إلى المفضلة",
    removed_fav: "أُزيل من المفضلة",
    signin: "تسجيل الدخول",
    signup: "إنشاء حساب",
    auth_sub: "احفظ أفلامك المفضلة وشاهدها لاحقاً",
    continue_google: "متابعة مع Google",
    continue_apple: "متابعة مع Apple",
    or: "أو",
    email: "البريد الإلكتروني",
    password: "كلمة السر (٦ أحرف على الأقل)",
    signin_btn: "دخول",
    signup_btn: "إنشاء الحساب",
    check_email: "تحقق من بريدك لتأكيد الحساب، ثم سجّل الدخول",
    no_account: "ما عندك حساب؟ إنشاء حساب جديد",
    have_account: "عندك حساب؟ سجّل الدخول",
    error_generic: "حدث خطأ",
    lang_switch: "EN",
    suggestions: [
      "فلم إثارة نفسي مثل Inception بس أقصر",
      "افلام مصرية مضحكة قديمة",
      "مسلسلات تركية رومانسية",
      "مسلسلات كورية إثارة وغموض",
      "أفلام رعب حديثة مو مبتذلة",
      "أنمي أكشن قوي",
      "افلام هندية عائلية",
    ] as string[],
    page_not_found_title: "الصفحة غير موجودة",
    page_not_found_sub: "الرابط اللي فتحته ما يقود لأي صفحة. رجّع للرئيسية وابدأ من هناك.",
    go_home: "الرجوع للرئيسية",
    error_title: "صار خطأ ما توقعناه",
    error_sub: "حاول تحديث الصفحة، وإذا رجع الخطأ راسلنا.",
    no_results: "ما لقينا نتائج",
    no_results_sub: "جرّب كلمات ثانية أو اختصر البحث.",
  },
  en: {
    brand: "Filmak",
    tagline_ai: "Powered by AI",
    hero_1: "Describe the movie in your head",
    hero_2: "and we'll find it",
    hero_sub:
      "Instead of scrolling for an hour, tell us your mood or the kind of movie you want and let us pick for you.",
    prompt_placeholder: "e.g. A psychological thriller like Inception but shorter…",
    recommend_btn: "Recommend",
    search_placeholder: "Search movies…",
    login: "Sign in",
    logout: "Sign out",
    my_favorites: "My favorites",
    logout_toast: "Signed out",
    search_results: "Search results",
    trending: "Trending this week",
    now_playing: "Now in theaters",
    upcoming: "Coming soon",
    top_rated: "Top rated",
    popular: "Popular",
    tv_series: "Series",
    movie: "Movie",
    loading: "Loading…",
    footer:
      "This product uses the TMDB API but is not endorsed or certified by TMDB.",
    back: "Back",
    watch_trailer: "Watch official trailer",
    where_to_watch: "Where to watch",
    by_subscription: "Streaming",
    rent: "Rent",
    buy: "Buy",
    view_all_tmdb: "See all options on TMDB",
    cast: "Cast",
    similar: "Similar movies",
    minutes_short: "min",
    not_found: "Not found",
    error_load_movie: "Couldn't load this movie",
    retry: "Try again",
    favorites_title: "My favorite movies",
    favorites_empty:
      "No favorites yet. Browse and tap the heart on any movie to save it here.",
    discover: "Discover movies",
    add_fav: "Add to favorites",
    in_fav: "In favorites",
    added_fav: "Added to favorites",
    removed_fav: "Removed from favorites",
    signin: "Sign in",
    signup: "Create account",
    auth_sub: "Save your favorite movies and watch them later",
    continue_google: "Continue with Google",
    continue_apple: "Continue with Apple",
    or: "or",
    email: "Email",
    password: "Password (6+ characters)",
    signin_btn: "Sign in",
    signup_btn: "Create account",
    check_email: "Check your inbox to confirm your account, then sign in",
    no_account: "No account? Create one",
    have_account: "Have an account? Sign in",
    error_generic: "Something went wrong",
    lang_switch: "AR",
    suggestions: [
      "A psychological thriller like Inception but shorter",
      "Classic Egyptian comedies",
      "Turkish romantic series",
      "Korean mystery thrillers",
      "Modern horror movies, not cheesy",
      "Strong action anime",
      "Family-friendly Indian films",
    ] as string[],
    page_not_found_title: "Page not found",
    page_not_found_sub:
      "The link you opened doesn't lead anywhere. Head back to the home page to start over.",
    go_home: "Back to home",
    error_title: "Something went wrong",
    error_sub: "Try refreshing the page. If it keeps failing, let us know.",
    no_results: "No results found",
    no_results_sub: "Try different words or shorten your search.",
  },
};

export type Dict = {
  brand: string;
  tagline_ai: string;
  hero_1: string;
  hero_2: string;
  hero_sub: string;
  prompt_placeholder: string;
  recommend_btn: string;
  search_placeholder: string;
  login: string;
  logout: string;
  my_favorites: string;
  logout_toast: string;
  search_results: string;
  trending: string;
  now_playing: string;
  upcoming: string;
  top_rated: string;
  popular: string;
  tv_series: string;
  movie: string;
  loading: string;
  footer: string;
  back: string;
  watch_trailer: string;
  where_to_watch: string;
  by_subscription: string;
  rent: string;
  buy: string;
  view_all_tmdb: string;
  cast: string;
  similar: string;
  minutes_short: string;
  not_found: string;
  error_load_movie: string;
  retry: string;
  favorites_title: string;
  favorites_empty: string;
  discover: string;
  add_fav: string;
  in_fav: string;
  added_fav: string;
  removed_fav: string;
  signin: string;
  signup: string;
  auth_sub: string;
  continue_google: string;
  continue_apple: string;
  or: string;
  email: string;
  password: string;
  signin_btn: string;
  signup_btn: string;
  check_email: string;
  no_account: string;
  have_account: string;
  error_generic: string;
  lang_switch: string;
  suggestions: string[];
  page_not_found_title: string;
  page_not_found_sub: string;
  go_home: string;
  error_title: string;
  error_sub: string;
  no_results: string;
  no_results_sub: string;
};
export type TKey = keyof Dict;

type Ctx = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  toggle: () => void;
  t: <K extends TKey>(k: K) => Dict[K];
  dir: "rtl" | "ltr";
};

const LocaleCtx = createContext<Ctx | null>(null);

function detectInitial(): Locale {
  if (typeof window === "undefined") return "ar";
  try {
    const saved = window.localStorage.getItem("locale");
    if (saved === "ar" || saved === "en") return saved;
  } catch {}
  const nav = (navigator.language || "ar").toLowerCase();
  return nav.startsWith("ar") ? "ar" : "en";
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  // SSR default is "ar" to match the original site; after hydration
  // we detect the real locale to avoid a visible flash on Arabic devices.
  const [locale, setLocaleState] = useState<Locale>("ar");

  useEffect(() => {
    const detected = detectInitial();
    setLocaleState(detected);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
  }, [locale]);

  const setLocale = useCallback((l: Locale) => {
    try {
      window.localStorage.setItem("locale", l);
    } catch {}
    setLocaleState(l);
  }, []);

  const value = useMemo<Ctx>(() => {
    const dict = DICT[locale];
    return {
      locale,
      setLocale,
      toggle: () => setLocale(locale === "ar" ? "en" : "ar"),
      t: (k) => dict[k],
      dir: locale === "ar" ? "rtl" : "ltr",
    };
  }, [locale, setLocale]);

  return <LocaleCtx.Provider value={value}>{children}</LocaleCtx.Provider>;
}

export function useLocale() {
  const v = useContext(LocaleCtx);
  if (!v) throw new Error("useLocale must be used inside LocaleProvider");
  return v;
}

export function useT() {
  return useLocale().t;
}