import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useLayoutEffect,
  useState,
  type ReactNode,
} from "react";

export type Locale = "ar" | "en";

const DICT: Record<Locale, Dict> = {
  ar: {
    brand: "فلمك",
    tagline_ai: "مدعوم بالذكاء الاصطناعي",
    hero_1: "صف الفلم اللي في بالك",
    hero_2: "ونجيبه لك",
    hero_sub: "بدل ما تضيع ساعة تدور، اكتب مزاجك أو نوع الفلم اللي تحبه واتركنا نرشح لك.",
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
    footer: "استخدم هذا الموقع بيانات TMDB ولكن لا يتم اعتماده أو التصديق عليه من قبل TMDB.",
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
    favorites_empty: "ما عندك أفلام مفضلة بعد. تصفح واضغط القلب على أي فلم لحفظه هنا.",
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
    browse_by_genre: "تصفح حسب التصنيف",
    all_genres: "الكل",
    sort_popular: "الأكثر شعبية",
    sort_rating: "الأعلى تقييماً",
    sort_newest: "الأحدث",
    genre_results: "أفلام تصنيف",
    tab_movies: "أفلام",
    tab_series: "مسلسلات",
    airing_today: "تُعرض اليوم",
    on_the_air: "على الشاشة",
    seasons: "مواسم",
    episodes: "حلقات",
    share: "مشاركة",
    copied: "تم نسخ الرابط",
    load_more: "عرض المزيد",
    year: "السنة",
    min_rating: "الحد الأدنى للتقييم",
    original_language: "اللغة الأصلية",
    any: "الكل",
    filters: "الفلاتر",
    lang_ar: "عربي",
    lang_en: "إنجليزي",
    lang_ko: "كوري",
    lang_ja: "ياباني",
    lang_tr: "تركي",
    lang_hi: "هندي",
    lang_fr: "فرنسي",
    lang_es: "إسباني",
    add_watchlist: "أضف للمشاهدة لاحقاً",
    in_watchlist: "في المشاهدة لاحقاً",
    added_watchlist: "أُضيف لقائمة المشاهدة",
    mark_watched: "شاهدته",
    watched: "شاهدته",
    marked_watched: "تم التعليم كمشاهد",
    tab_favorites: "المفضلة",
    tab_watchlist: "شاهد لاحقاً",
    tab_watched: "شاهدته",
    my_stats: "إحصائياتي",
    stats_title: "إحصائياتك الشخصية",
    total_items: "إجمالي العناصر",
    average_rating: "متوسط تقييمك",
    top_year: "أكثر سنة عندك",
    movies_count: "أفلام",
    tv_count: "مسلسلات",
    your_rating: "تقييمك",
    original_title: "الاسم الأصلي",
    status: "الحالة",
    votes: "صوت",
    popularity_label: "الشعبية",
    box_office: "شباك التذاكر",
    budget: "الميزانية",
    revenue: "الإيرادات",
    profit: "الربح",
    production: "الإنتاج",
    countries: "الدول",
    languages: "اللغات",
    companies: "شركات الإنتاج",
    videos: "فيديوهات",
    gallery: "الصور",
    crew: "طاقم العمل",
    director: "المخرج",
    writers: "الكتّاب",
    composer: "الموسيقى",
    cinematographer: "التصوير",
    editor: "المونتاج",
    more: "عرض المزيد",
    less: "عرض أقل",
    close: "إغلاق",
    imdb: "IMDb",
    tmdb: "TMDB",
    details: "تفاصيل",
    about_us: "من نحن",
    privacy_policy: "سياسة الخصوصية",
    about_content:
      "فلمك هو منصة مدعومة بالذكاء الاصطناعي لمساعدتك في العثور على الأفلام والمسلسلات التي تناسب ذوقك. بدلاً من قضاء وقت طويل في البحث، يمكنك ببساطة وصف ما تبحث عنه وسنقوم بترشيح الأفضل لك.",
    privacy_content:
      "نحن نهتم بخصوصيتك. يتم تخزين مفضلاتك وإحصائياتك محلياً على جهازك. نستخدم بيانات TMDB لعرض معلومات الأفلام ولا نقوم بجمع بيانات شخصية دون موافقتك.",
    why_filmak: "لماذا تختار فلمك؟",
    our_vision: "رؤيتنا وأهدافنا",
    terms_of_use: "شروط الاستخدام",
    user_rights: "حقوق المستخدم",
    data_protection: "حماية البيانات",
    ask_ai: "اسأل الذكاء الاصطناعي",
    describe_mood: "صف مزاجك أو نوع الفيلم الذي تريده",
    ai_placeholder: "مثال: أريد فيلم غموض وإثارة نفسية بنهاية غير متوقعة…",
    searching_ai: "جارٍ البحث عن ترشيحات ذكية…",
    recommendations_for: "ترشيحات مقترحة لـ:",
    type_to_search: "اكتب اسم فيلم أو مسلسل للبحث",
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
    footer: "This product uses the TMDB API but is not endorsed or certified by TMDB.",
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
    favorites_empty: "No favorites yet. Browse and tap the heart on any movie to save it here.",
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
    browse_by_genre: "Browse by genre",
    all_genres: "All",
    sort_popular: "Most popular",
    sort_rating: "Top rated",
    sort_newest: "Newest",
    genre_results: "Movies in",
    tab_movies: "Movies",
    tab_series: "Series",
    airing_today: "Airing today",
    on_the_air: "On the air",
    seasons: "seasons",
    episodes: "episodes",
    share: "Share",
    copied: "Link copied",
    load_more: "Load more",
    year: "Year",
    min_rating: "Min rating",
    original_language: "Original language",
    any: "Any",
    filters: "Filters",
    lang_ar: "Arabic",
    lang_en: "English",
    lang_ko: "Korean",
    lang_ja: "Japanese",
    lang_tr: "Turkish",
    lang_hi: "Hindi",
    lang_fr: "French",
    lang_es: "Spanish",
    add_watchlist: "Add to watchlist",
    in_watchlist: "In watchlist",
    added_watchlist: "Added to watchlist",
    mark_watched: "Mark watched",
    watched: "Watched",
    marked_watched: "Marked as watched",
    tab_favorites: "Favorites",
    tab_watchlist: "Watch later",
    tab_watched: "Watched",
    my_stats: "My stats",
    stats_title: "Your personal stats",
    total_items: "Total items",
    average_rating: "Your average rating",
    top_year: "Top year",
    movies_count: "Movies",
    tv_count: "Series",
    your_rating: "Your rating",
    original_title: "Original title",
    status: "Status",
    votes: "votes",
    popularity_label: "Popularity",
    box_office: "Box office",
    budget: "Budget",
    revenue: "Revenue",
    profit: "Profit",
    production: "Production",
    countries: "Countries",
    languages: "Languages",
    companies: "Production companies",
    videos: "Videos",
    gallery: "Gallery",
    crew: "Crew",
    director: "Director",
    writers: "Writers",
    composer: "Music",
    cinematographer: "Cinematography",
    editor: "Editing",
    more: "Show more",
    less: "Show less",
    close: "Close",
    imdb: "IMDb",
    tmdb: "TMDB",
    details: "Details",
    about_us: "About Us",
    privacy_policy: "Privacy Policy",
    about_content:
      "Filmak is an AI-powered platform designed to help you find the perfect movies and TV shows. Instead of scrolling for hours, just describe what you're looking for and let us recommend the best options for you.",
    privacy_content:
      "We care about your privacy. Your favorites and stats are stored locally on your device. We use TMDB data for movie information and do not collect personal data without your consent.",
    why_filmak: "Why Choose Filmak?",
    our_vision: "Our Vision & Goals",
    terms_of_use: "Terms of Use",
    user_rights: "User Rights",
    data_protection: "Data Protection",
    ask_ai: "Ask AI",
    describe_mood: "Describe your mood or the movie you want",
    ai_placeholder: "e.g. A mind-bending thriller with an unexpected twist…",
    searching_ai: "Finding smart recommendations…",
    recommendations_for: "Recommendations for:",
    type_to_search: "Type a movie or TV show name to search",
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
  browse_by_genre: string;
  all_genres: string;
  sort_popular: string;
  sort_rating: string;
  sort_newest: string;
  genre_results: string;
  tab_movies: string;
  tab_series: string;
  airing_today: string;
  on_the_air: string;
  seasons: string;
  episodes: string;
  share: string;
  copied: string;
  load_more: string;
  year: string;
  min_rating: string;
  original_language: string;
  any: string;
  filters: string;
  lang_ar: string;
  lang_en: string;
  lang_ko: string;
  lang_ja: string;
  lang_tr: string;
  lang_hi: string;
  lang_fr: string;
  lang_es: string;
  add_watchlist: string;
  in_watchlist: string;
  added_watchlist: string;
  mark_watched: string;
  watched: string;
  marked_watched: string;
  tab_favorites: string;
  tab_watchlist: string;
  tab_watched: string;
  my_stats: string;
  stats_title: string;
  total_items: string;
  average_rating: string;
  top_year: string;
  movies_count: string;
  tv_count: string;
  your_rating: string;
  original_title: string;
  status: string;
  votes: string;
  popularity_label: string;
  box_office: string;
  budget: string;
  revenue: string;
  profit: string;
  production: string;
  countries: string;
  languages: string;
  companies: string;
  videos: string;
  gallery: string;
  crew: string;
  director: string;
  writers: string;
  composer: string;
  cinematographer: string;
  editor: string;
  more: string;
  less: string;
  close: string;
  imdb: string;
  tmdb: string;
  details: string;
  about_us: string;
  privacy_policy: string;
  about_content: string;
  privacy_content: string;
  why_filmak: string;
  our_vision: string;
  terms_of_use: string;
  user_rights: string;
  data_protection: string;
  ask_ai: string;
  describe_mood: string;
  ai_placeholder: string;
  searching_ai: string;
  recommendations_for: string;
  type_to_search: string;
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
  } catch {
    // localStorage unavailable (e.g. private mode)
  }
  const nav = (navigator.language || "ar").toLowerCase();
  return nav.startsWith("ar") ? "ar" : "en";
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  // SSR default is "ar" to match the original site; after hydration
  // we detect the real locale to avoid a visible flash on Arabic devices.
  const [locale, setLocaleState] = useState<Locale>("ar");

  useLayoutEffect(() => {
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
    } catch {
      // localStorage unavailable
    }
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
