import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type EditorialReview = {
  id: string;
  movie_id: number;
  title: string;
  verdict: string;
  review_content: string;
  strengths: string[];
  weaknesses: string[];
  who_should_watch: string;
  who_may_not_enjoy: string;
  why_watch: string;
  best_for: string;
  mood: string;
  experience_level: string;
  recommended_viewing: string;
  content_notes?: string;
  editorial_score: number;
  story_score: number;
  acting_score: number;
  visuals_score: number;
  entertainment_score: number;
  author_name: string;
  author_role: string;
  status: "published" | "draft";
  similar_reasons: Record<string, string>;
  published_at: string;
  updated_at: string;
};

export function hasSubstantialEditorial(review: EditorialReview | null | undefined): boolean {
  if (!review || review.status !== "published") return false;

  const reviewLength = review.review_content.trim().length;
  const verdictLength = review.verdict.trim().length;
  const strengths = review.strengths.filter((item) => item.trim().length > 20).length;
  const weaknesses = review.weaknesses.filter((item) => item.trim().length > 20).length;

  // Monetization/indexing gate: require a genuinely developed editorial layer,
  // not just the presence of a short record or a TMDB synopsis.
  return (
    reviewLength >= 700 &&
    verdictLength >= 120 &&
    strengths >= 3 &&
    weaknesses >= 1 &&
    review.who_should_watch.trim().length >= 80 &&
    review.why_watch.trim().length >= 100
  );
}

export function hasSubstantialArticle(article: Article | null | undefined): boolean {
  if (!article) return false;

  const title = article.title_ar.trim();
  const excerpt = article.excerpt_ar.trim();
  const content = article.content_ar.trim();
  const author = article.author_name.trim();
  const role = article.author_role.trim();

  return (
    title.length >= 12 &&
    excerpt.length >= 120 &&
    content.length >= 1400 &&
    author.length >= 3 &&
    role.length >= 8 &&
    article.reading_time_minutes >= 4
  );
}

export type Article = {
  id: string;
  slug: string;
  title_ar: string;
  title_en: string;
  subtitle_ar?: string;
  subtitle_en?: string;
  excerpt_ar: string;
  excerpt_en: string;
  content_ar: string;
  content_en: string;
  category: "guides" | "spotlight" | "comparisons" | "genre-deep-dive" | "collections";
  category_label_ar: string;
  category_label_en: string;
  featured_image?: string;
  author_name: string;
  author_role: string;
  author_avatar?: string;
  related_movie_ids: number[];
  related_article_slugs?: string[];
  reading_time_minutes: number;
  featured: boolean;
  published_at: string;
  updated_at: string;
};
export const EDITORIAL_PRINCIPLES = {
  ar: [
    "المحتوى التحريري في Filmak يجب أن يضيف تحليلاً أو تجربة أو مقارنة أصلية، وليس إعادة صياغة لبيانات TMDB أو مصادر أخرى.",
    "بيانات الأفلام الخارجية تُستخدم كمرجع كتالوجي، بينما الرأي والتوصية والاختيار يجب أن يكونا من Filmak.",
    "لا ننشئ مقالات جماعية آلياً لمجرد زيادة عدد الصفحات المفهرسة.",
  ],
  en: [
    "Filmak editorial content must add original analysis, experience, comparison, or curation rather than rewriting catalogue metadata.",
    "Third-party movie metadata is treated as catalogue reference; recommendations and editorial judgments belong to Filmak.",
    "Do not mass-produce articles merely to increase indexed page count.",
  ],
} as const;

export function getEditorialContentWordCount(article: Article | null | undefined): number {
  if (!article) return 0;
  return article.content_ar.trim().split(/\s+/).filter(Boolean).length;
}

export function hasEditorialDepth(article: Article | null | undefined): boolean {
  if (!hasSubstantialArticle(article)) return false;

  const content = article.content_ar.trim();
  const paragraphs = content.split(/\n\s*\n/).filter((p) => p.trim().length >= 80);
  const wordCount = getEditorialContentWordCount(article);

  return wordCount >= 700 && paragraphs.length >= 5;
}


export type EditorialCollection = {
  id: string;
  slug: string;
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
  editorial_intro_ar: string;
  editorial_intro_en: string;
  badge?: string;
  cover_image?: string;
  movie_ids: number[];
  movie_curation_notes?: Record<string, { ar: string; en: string }>;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
};

export type GenreEditorialInfo = {
  id: number;
  name_ar: string;
  name_en: string;
  intro_ar: string;
  intro_en: string;
  what_to_expect_ar: string;
  what_to_expect_en: string;
  signature_tropes_ar: string[];
  signature_tropes_en: string[];
  essential_picks: Array<{
    id: number;
    title_ar: string;
    title_en: string;
    year: string;
    note_ar: string;
    note_en: string;
  }>;
  related_guides: Array<{ slug: string; title_ar: string; title_en: string }>;
  faqs: Array<{ q_ar: string; q_en: string; a_ar: string; a_en: string }>;
};

// Built-in curated catalog of human-written editorial reviews for major cinema works
const SEED_EDITORIAL_REVIEWS: Record<number, EditorialReview> = {
  // 157336: Interstellar
  157336: {
    id: "seed-rev-157336",
    movie_id: 157336,
    title: "Interstellar",
    verdict:
      "ملحمة سينمائية تجمع بين النظريات الفيزيائية المعقدة والعاطفة الإنسانية الجياشة. تحفة نولان البصرية حول البقاء والحب والزمن.",
    review_content:
      "يبرهن كريستوفر نولان في Interstellar أن سينما الخيال العلمي قادرة على ملامسة أعمق المشاعر الإنسانية دون التضحية بالدقة العلمية أو الإبهار البصري. يعتمد العمل على نظرية النسبية العامة لأينشتاين واستشارات الفيزيائي كيب ثورن الحائز على نوبل، ليقدم لنا ثقباً أسود هو الأكثر واقعية في تاريخ الفن السابع. لكن المحرك الحقيقي للقصة ليس فيزياء الفضاء، بل رابطة الأب كوبر بابنته ميرف ورغبته الغريزية في إنقاذ البشرية ليعود إليها. الموسيقى التصويرية التي ألفها هانز زيمر باستخدام أورغن الكنيسة تضفي طابعاً روحانياً مهيباً ينقل التجربة إلى مستوى سينمائي استثنائي.",
    strengths: [
      "موسيقى تصويرية عبقرية من هانز زيمر تقود المشاعر",
      "إبهار بصري ودقة علمية غير مسبوقة في تصوير الثقب الأسود",
      "أداء تمثيلي مؤثر من ماثيو ماكونهي وجيسيكا شاستاين",
      "حبكة تجمع بين التشويق الكوني والعمق الإنساني",
    ],
    weaknesses: [
      "بعض الحوارات التفسيرية في النصف الثاني تبدو مباشرة",
      "الحل النهائي القائم على الحب كبعد فيزيائي قد يقسم بعض محبي الخيال العلمي الصارم",
    ],
    who_should_watch:
      "عشاق الخيال العلمي الفلسفي، محبو الأعمال الملحمية البصرية، وكل من يبحث عن قصة إنسانية مؤثرة عن التضحية والأمل.",
    who_may_not_enjoy:
      "من يفضل أفلام الخيال العلمي الخفيفة المعتمدة فقط على الأكشن السريع بدون تعقيدات فيزيائية أو سرد طويل.",
    why_watch:
      "يقدم الفيلم تجربة استكشافية متكاملة تتجاوز حدود الترفيه العادي، وتطرح تساؤلات وجودية حول مكانة الإنسان في الكون وحدود الزمان والمكان.",
    best_for: "سهرة سينمائية دسمة في عطلة نهاية الأسبوع",
    mood: "ملحمي، تأملي، عاطفي، مشوق",
    experience_level: "مناسب للجميع مع ميزة إضافية لمحبي السينما المتعمقة",
    recommended_viewing: "شاشة كبيرة مع نظام صوتي قوي للاستمتاع بالموسيقى والمؤثرات",
    content_notes: "توتر نفسي ومشاهد فضائية خطيرة، مناسب للعائلة والمراهقين",
    editorial_score: 9.3,
    story_score: 9.1,
    acting_score: 9.2,
    visuals_score: 9.8,
    entertainment_score: 9.2,
    author_name: "فريق تحرير فلمك",
    author_role: "قسم النقد والتحليل السينمائي",
    status: "published",
    similar_reasons: {
      "27205": "يشاركه الطابع البصري لنولان والتلاعب بالزمن والواقع.",
      "438631": "يقدم نفس الإحساس بالملحمية الفضائية والتصوير السينمائي المهيب.",
      "329865": "يتناول التواصل البشري وفهم الزمن والكون من منظور فلسفي عميق.",
      "286217": "رحلة بقاء مذهلة في الفضاء معتمد على الدقة العلمية والمثابرة البشرية.",
    },
    published_at: "2026-01-10T12:00:00Z",
    updated_at: "2026-08-20T14:30:00Z",
  },
  // 27205: Inception
  27205: {
    id: "seed-rev-27205",
    movie_id: 27205,
    title: "Inception",
    verdict:
      "درس نموذجي في هندسة الحبكة السينمائية وبناء العوالم الذهنية. أحد أذكى أفلام الأكشن والإثارة في القرن الحادي والعشرين.",
    review_content:
      "يأخذنا كريستوفر نولان في Inception إلى أعماق العقل البشري من خلال فكرة سرقة الأفكار وزرعها أثناء النوم. يتميز الفيلم بهيكل بنائي متعدد الطبقات يتطلب تركيزاً كاملاً من المشاهد، حيث تجري الأحداث في أربعة مستويات من الأحلام في وقت واحد وبسرعات زمنية مختلفة. المؤثرات العملية وتصميم المشاهد مثل ممر الفندق الدوار تجعل الأكشن يبدو واقعياً ومبتكراً. يقدم ليوناردو دي كابريو أداءً محكماً لشخصية معذبة بذكرياتها، وتترك النهاية الشهيرة مع البلبل الدوار مساحة لا تنتهي من التأويل والنقاش.",
    strengths: [
      "بناء درامي معقد ومتقن للغاية يحترم ذكاء المشاهد",
      "مؤثرات عملية مبتكرة وأكشن متقن بدون إفراط بالـ CGI",
      "موسيقى هانز زيمر الخالدة وتدرج الإيقاع التصاعدي",
      "نهاية أيقونية تفتح باب النقاش والتفكير",
    ],
    weaknesses: [
      "كمية القواعد والشروحات النظرية في الثلث الأول قد تحتاج لتركيز إضافي",
    ],
    who_should_watch:
      "محبو الألغاز الفكرية، عشاق أفلام الأكشن الذكية، ومن يقدرون التصميم السردي المعقد.",
    who_may_not_enjoy:
      "من يبحث عن فيلم خفيف للمشاهدة بدون تركيز أثناء الانشغال بأنشطة أخرى.",
    why_watch:
      "يقدم Inception تجربة فريدة تجمع بين متعة الإثارة والتشويق مع اختبار عقلي ممتع حول طبيعة الواقع والذاكرة.",
    best_for: "مشاهدة ليلية مع أصدقاء محبين للنقاش والتحليل",
    mood: "ذكي، سريع الإيقاع، غامض، محفز للتفكير",
    experience_level: "متوسط إلى متقدم",
    recommended_viewing: "جلسة هادئة بدون مقاطعات للتركيز مع تفاصيل مستويات الحلم",
    content_notes: "مشاهد أكشن وإطلاق نار بدون مشاهد دموية مفرطة",
    editorial_score: 9.4,
    story_score: 9.6,
    acting_score: 9.0,
    visuals_score: 9.5,
    entertainment_score: 9.5,
    author_name: "فريق تحرير فلمك",
    author_role: "قسم النقد والتحليل السينمائي",
    status: "published",
    similar_reasons: {
      "157336": "من إخراج نولان ويشاركه نفس الطموح الفكري والموسيقى الملحمية.",
      "550": "يتلاعب بوعي الشخصية الرئيسية والواقع الخفي.",
      "603": "يتناول فكرة العوالم البديلة والواقع المصنوع بذكاء فائق.",
      "77": "غموض نفسي وجزيرة ألغاز تتلاعب بحقيقة الأحداث.",
    },
    published_at: "2026-01-12T10:00:00Z",
    updated_at: "2026-08-15T11:00:00Z",
  },
  // 496243: Parasite
  496243: {
    id: "seed-rev-496243",
    movie_id: 496243,
    title: "Parasite",
    verdict:
      "تحفة بونغ جون هو الكورية الحائزة على الأوسكار. نقد طبقي لاذع يتقلب ببراعة مذهلة بين الكوميديا السوداء والإثارة النفسية.",
    review_content:
      "ينجح Parasite في تقديم تشريح اجتماعي دقيق وممتع للفوارق الطبقية في كوريا الجنوبية من خلال حكاية عائلتين: عائلة كيم الفقيرة المكافحة وعائلة بارك الثرية الساذجة. ينتقل الفيلم بسلاسة خارقة من الكوميديا العائلية الخبيثة إلى الرعب النفسي والدراما التراجيدية. الهندسة المعمارية للمنزل واستخدام السلالم كرمز بصري صريح للصعود والهبوط الطبقي يعكسان عبقرية الإخراج. فيلم لا يقدم أشراراً تقليديين، بل يُظهر كيف يدفع النظام الاجتماعي الجميع نحو صراع وحشي على البقاء.",
    strengths: [
      "سيناريو محكم بشكل مذهل وتحولات سردية غير متوقعة تماماً",
      "إخراج عبقري وتوظيف ذكي للمكان والإضاءة كعناصر رمزية",
      "طاقم تمثيل كوري متناغم بأداء استثنائي وطبيعي",
      "توازن نادر بين الرسالة الاجتماعية القوية والترفيه الخالص",
    ],
    weaknesses: [
      "التحول المفاجئ في النصف الأخير قد يكون صادماً للبعض",
    ],
    who_should_watch:
      "كل عاشق للسينما العالمية، محبو الكوميديا السوداء، والباحثون عن قصص غير تقليدية تحمل قيمة فنية عالية.",
    who_may_not_enjoy:
      "من يفضلون النهايات الهادئة والقصص التي تفصل بوضوح بين الخير والشر المطلق.",
    why_watch:
      "لأنه أحد أهم الأفلام في تاريخ السينما المعاصرة، وأول فيلم غير ناطق بالإنجليزية يفوز بأوسكار أفضل فيلم عن جدارة واستحقاق.",
    best_for: "أمسية سينمائية استثنائية لمن يريد عملاً يثير الإعجاب والتفكير",
    mood: "ساخر، مشوق، صادم، إنساني عميق",
    experience_level: "مناسب لجميع المستويات",
    recommended_viewing: "باللغة الكورية الأصلية مع الترجمة للحفاظ على نبرة الحوار المميزة",
    content_notes: "مشاهد عنف وتوتر في الثلث الأخير",
    editorial_score: 9.5,
    story_score: 9.7,
    acting_score: 9.4,
    visuals_score: 9.3,
    entertainment_score: 9.5,
    author_name: "فريق تحرير فلمك",
    author_role: "قسم النقد والسينما العالمية",
    status: "published",
    similar_reasons: {
      "290098": "تحفة كورية أخرى تمتاز بالغموض والتحولات غير المتوقعة.",
      "675353": "نقد لاذع ومثير لطبقة الأثرياء بأسلوب كوميدي أسود.",
      "493922": "غموض كوري نفسي يتناول الطبقية والشك الإنساني.",
    },
    published_at: "2026-01-15T09:00:00Z",
    updated_at: "2026-08-10T16:00:00Z",
  },
  // 155: The Dark Knight
  155: {
    id: "seed-rev-155",
    movie_id: 155,
    title: "The Dark Knight",
    verdict:
      "قمة سينما الأبطال الخارقين والدراما الجنائية. أداء هيث ليدجر الأسطوري في دور الجوكر صاغ معياراً لا يُضاهى للشر المعاصر.",
    review_content:
      "حوّل كريستوفر نولان فيلم الأبطال الخارقين إلى ملحمة جريمة كلاسيكية مستوحاة من Heat لمايكل مان. The Dark Knight ليس مجرد صراع بين باتمان والجوكر، بل اختبار فلسفي لقيم المجتمع وقدرة النظام الأخلاقي على الصمود أمام الفوضى المطلقة. أداء هيث ليدجر الراحل لا يزال يُدرّس في كيفية تجسيد الشخصية الفوضوية بلا دافع مالي أو سلطوي، بل لإثبات أن الجميع قابلون للانهيار. فيلم يتميز بإيقاع لاهث وتصوير واقعي يخلو من البهرجة الرقمية المفرطة.",
    strengths: [
      "أداء أسطوري لا يُنسى من هيث ليدجر",
      "كتابة سينمائية عميقة تتناول المعضلات الأخلاقية والعدالة",
      "تسلسلات أكشن واقعية ومطاردات عملية مذهلة",
      "تطور شخصية هارفي دينت وسقوطه التراجيدي",
    ],
    weaknesses: [
      "طول الفيلم وبعض خطوط التحقيق الجانبية قد تبدو مكثفة جداً",
    ],
    who_should_watch:
      "عشاق أفلام الجريمة والإثارة، محبو نولان وهيث ليدجر، ومن يريد تجربة سينمائية ذات وزن ثقيل.",
    who_may_not_enjoy:
      "من يفضل أفلام الكوميكس الكرتونية الملونة والخفيفة المليئة بالنكات المتكررة.",
    why_watch:
      "لأنه الفيلم الذي غيّر نظرة العالم والجوائز السينمائية لأفلام الأبطال الخارقين إلى الأبد.",
    best_for: "سهرة إثارة سينمائية لا تخيب التوقعات أبداً",
    mood: "مظلم، حماسي، فلسفي، لاهث",
    experience_level: "مناسب للجميع",
    recommended_viewing: "شاشة بدقة عالية واستمتع بصوت الأكشن وتصوير IMAX",
    content_notes: "عنف وجرائم وإثارة نفسية عالية",
    editorial_score: 9.6,
    story_score: 9.5,
    acting_score: 9.9,
    visuals_score: 9.4,
    entertainment_score: 9.7,
    author_name: "فريق تحرير فلمك",
    author_role: "قسم النقد والسينما العالمية",
    status: "published",
    similar_reasons: {
      "475557": "رؤية أخرى لمدينة غوثام بنبرة تحقيق بوليسي مظلم.",
      "475557-joker": "دراسة نفسية لشخصية الجوكر في بيئة مجتمعية فاسدة.",
      "27205": "يشاركه نفس الرؤية الإخراجية الدقيقة لكريستوفر نولان.",
    },
    published_at: "2026-01-18T14:00:00Z",
    updated_at: "2026-08-05T12:00:00Z",
  },
  // 872585: Oppenheimer
  872585: {
    id: "seed-rev-872585",
    movie_id: 872585,
    title: "Oppenheimer",
    verdict:
      "سيرة ذاتية ملحمية تخطف الأنفاس حول ولادة العصر الذري والمعضلة الأخلاقية للعلم. أداء استثنائي من كيليان ميرفي وروبرت داوني جونيور.",
    review_content:
      "ينسج نولان في Oppenheimer سيمفونية من الحوارات المتفجرة والمونتاج السريع ليروي قصة روبرت أوبنهايمر ومشروع مانهاتن. بدلاً من التركيز التقليدي على المعارك، يجعل الفيلم من قاعة المحاكمة وغرف النقاش ساحة حرب حقيقية تعصف بالضمير الإنساني. مشهد اختبار ترينيتي صُنع ببراعة حسية تحبس الأنفاس حيث يفصل الصمت بين الوميض وصدمة الانفجار. يجسد كيليان ميرفي بعينيه الثاقبتين عبقرية وعذاب الرجل الذي أصبح مدمر العوالم.",
    strengths: [
      "أداء مسرحي وسينمائي رفيع من كيليان ميرفي وروبرت داوني جونيور",
      "مونتاج صوتي وبصري عبقري يبني التوتر بشكل تصاعدي مذهل",
      "معالجة تاريخية وأخلاقية رصينة بدون تبسيط أو تحيز",
    ],
    weaknesses: [
      "كثرة الشخصيات العلمية والسياسية في الجزء الأول قد تتطلب انتباهاً مكثفاً",
    ],
    who_should_watch:
      "محبو التاريخ المعاصر، عشاق الدراما السياسية والأخلاقية، وكل من يقدر التمثيل الرفيع والإخراج الدقيق.",
    who_may_not_enjoy:
      "من يتوقع فيلم حروب وأكشن عسكري تقليدي بالدبابات والجنود.",
    why_watch:
      "لأنه إنجاز سينمائي حاز على إجماع نقدي وجوائز الأوسكار الكبرى ويوثق لحظة مفصلية في تاريخ البشرية.",
    best_for: "مشاهدة مركزة لمن يقدر حوارات الذكاء وصراعات السلطة",
    mood: "مكثف، تاريخي، درامي، مهيب",
    experience_level: "متوسط إلى خبير سينمائي",
    recommended_viewing: "جلسة تركيز كامل مع ترجمة دقيقة للأسماء والمصطلحات",
    content_notes: "حوارات تاريخية وسياسية مكثفة، وتوتر نفسي",
    editorial_score: 9.4,
    story_score: 9.3,
    acting_score: 9.7,
    visuals_score: 9.4,
    entertainment_score: 9.0,
    author_name: "فريق تحرير فلمك",
    author_role: "قسم النقد والسينما العالمية",
    status: "published",
    similar_reasons: {
      "157336": "من إخراج نولان ويعالج علاقة العلم بمستقبل الوجود البشري.",
      "205596": "سيرة ذاتية بريطانية عن آلان تورينغ وفك شفرة إنيغما أثناء الحرب.",
      "198": "دراما تحقيق تاريخية مشوقة تكشف كواليس القرارات المصيرية.",
    },
    published_at: "2026-02-01T15:00:00Z",
    updated_at: "2026-08-01T10:00:00Z",
  },
};

// Curated library of comprehensive, original movie guides & articles
const SEED_ARTICLES: Article[] = [
  {
    id: "art-1",
    slug: "best-psychological-thrillers",
    title_ar: "أقوى أفلام الإثارة النفسية التي ستبقى في عقلك لأيام: دليل المشاهدة والتحليل",
    title_en: "The Best Psychological Thrillers That Will Haunt Your Mind: Essential Guide & Analysis",
    subtitle_ar: "رحلة سينمائية في دهاليز العقل البشري، الشك، والواقع المتشظي",
    subtitle_en: "A cinematic journey through fractured minds, paranoiac tension, and unreliable realities",
    excerpt_ar: "لا شيء يعادل متعة مشاهدة فيلم إثارة نفسي يجعلك تشك في كل لقطة، ويعيد ترتيب أوراق الحكاية في اللحظات الأخيرة. جمعنا لك هنا أبرز التحف التي حددت معالم هذا النوع السينمائي مع شرح ما يجعل كل عمل منها تجربة لا تُنسى.",
    excerpt_en: "Nothing compares to the thrill of a psychological thriller that makes you question every frame. Here is our curated deep dive into the genre's defining masterworks and why each demands your full attention.",
    category: "guides",
    category_label_ar: "دليل الإثارة والغموض",
    category_label_en: "Thriller Guide",
    featured_image: "https://image.tmdb.org/t/p/w1280/s3TBrRGB1iav7gFOCNx3H31MoES.jpg",
    author_name: "علي الخفاجي",
    author_role: "رئيس تحرير فلمك وناقد سينمائي",
    author_avatar: "/icon-192.png",
    related_movie_ids: [27205, 550, 77, 1124, 745],
    related_article_slugs: ["movies-with-shocking-endings", "movies-like-interstellar"],
    reading_time_minutes: 8,
    featured: true,
    published_at: "2026-08-15T10:00:00Z",
    updated_at: "2026-08-25T12:00:00Z",
    content_ar: `## مقدمة: سحر الإثارة النفسية

تختلف أفلام الإثارة النفسية عن أفلام الرعب التقليدية أو الأكشن السريع؛ فهي لا تعتمد على الفزعات الرخيصة أو الانفجارات، بل تحفر في **الهشاشة النفسية للشخصيات**، وتجعل من عقل المشاهد نفسه شريكاً في فك اللغز.

عندما ينكسر الخط الفاصل بين ما هو حقيقي وما هو وهم، نجد أنفسنا أمام أرقى تجارب الفن السابع. في هذا الدليل، اخترنا لك خمسة من أعظم الأعمال التي صقلت هذا النوع وقدمت دروساً في الكتابة والتوجيه البصري.

---

### 1. Inception (2010) — هندسة الأحلام وصدمة الذاكرة

لم يكن فيلم كريستوفر نولان مجرد استعراض تقني لمؤثرات الجاذبية وممرات الفنادق الدوارة، بل هو دراسة عميقة للشعور بالذنب وكيف يمكن للفكرة أن تتحول إلى كائن طفيلي يعيش داخل وعي الإنسان.

* **ما يميزه:** هيكل السرد المكون من مستويات أحلام متداخلة، ونهاية البلبل الشهيرة التي تدعوك للتساؤل عما إذا كان البطل قد عاد فعلاً لأطفاله أم اختار تصديق حلمه المريح.
* **الأجواء:** مشوق، مكثف ذهنياً، ذو إيقاع تصاعدي لاهث بفضل موسيقى هانز زيمر.

---

### 2. Fight Club (1999) — تمرد الهوية والواقع المشوه

تحفة ديفيد فينشر المقتبسة عن رواية تشاك بولانيك تتناول أزمة الإنسان المعاصر في ظل الاستهلاك المفرط، من خلال راوٍ بلا اسم يعاني من أرق مزمن يلتقي بتايلر ديردن الغامض.

* **ما يميزه:** التحول الصادم في النصف الأخير ليس مجرد خدعة بصرية، بل إعادة تفسير كاملة لكل تفاعل حدث منذ الدقيقة الأولى.
* **الأجواء:** فلسفي، ساخر، مظلم، يحمل طابع التمرد الأيقوني لأواخر التسعينات.

---

### 3. Shutter Island (2010) — مصحة العواصف والأوهام

يأخذنا مارتن سكورسيزي وليوناردو دي كابريو إلى مصحة أشفيكليف للأمراض العقلية الواقعة في جزيرة معزولة للتحقيق في اختفاء مريضة غامضة وسط عاصفة هوجاء.

* **ما يميزه:** الاستخدام البارع للإضاءة الخافتة وظلال الفاشية وموسيقى التوتر التي تبني شعوراً مستمراً بالبارانويا، وصولاً إلى السؤال الأخلاقي الختامي: "أيهما أسوأ؟ أن تعيش كوحش، أم تموت كرجل صالح؟"

---

### نصائح المشاهدة للاستمتاع بأفلام الإثارة النفسية:

1. **شاهد في بيئة هادئة:** التفاصيل الصغيرة في نظرات الشخصيات وخلفية الكادر تحمل مفاتيح اللغز.
2. **تجنب قراءة المراجعات المليئة بالحرق مسبقاً:** متعة الاكتشاف الأول لا تتكرر.
3. **أعد المشاهدة لاحقاً:** ستلاحظ عشرات الإشارات الذكية التي وضعها المخرج عن عمد.`,
    content_en: `## Introduction: The Anatomy of Psychological Suspense

Unlike conventional jump-scare horror or explosive action, psychological thrillers delve into **the fragile architecture of the human mind**. They weaponize paranoia, fragmented memory, and unreliable narrators to turn the audience into active detectives.

When the boundary between reality and hallucination dissolves, cinema reaches its most intellectually satisfying heights. Here is our curated breakdown of landmark masterpieces that defined this genre.

---

### 1. Inception (2010) — The Architecture of Shared Dreams

Christopher Nolan’s epic is far more than rotating hallways and gravity-defying spectacles. At its core lies an intimate meditation on grief, guilt, and how an idea can act like a resilient parasite inside human consciousness.

* **The Highlight:** A meticulously calibrated multi-tiered dream sequence combined with Hans Zimmer's iconic score.
* **Mood:** Intellectually gripping, high-octane, and emotionally resonant.

---

### 2. Fight Club (1999) — Identity Fracture in the Modern Era

David Fincher’s adaptation of Chuck Palahniuk’s novel remains a razor-sharp critique of consumerism and modern existential malaise, narrated by an insomniac protagonist whose reality unspools before our eyes.

* **The Highlight:** A twist that fundamentally reframes every prior interaction and scene composition.
* **Mood:** Rebellious, dark, satirical, and fiercely intelligent.

---

### 3. Shutter Island (2010) — Atmospheric Paranoia on an Isolated Rock

Martin Scorsese guides Leonardo DiCaprio through the gothic corridors of Ashecliffe Hospital. As storms isolate the island, reality fractures into unforgettable psychological dread.

* **Key Takeaway:** Unforgettable visual symbolism and one of cinema's most haunting final questions: *"Which would be worse—to live as a monster, or to die as a good man?"*`,
  },
  {
    id: "art-2",
    slug: "movies-like-interstellar",
    title_ar: "أفلام تشبه Interstellar: روائع الخيال العلمي والفضاء والتأمل الإنساني",
    title_en: "Movies Like Interstellar: Mind-Bending Space Epics & Humanist Sci-Fi",
    subtitle_ar: "إذا أبهرتك رحلة كوبر عبر الثقب الدودي، فهذه الأفلام الخمسة يجب أن تكون وجهتك التالية",
    subtitle_en: "If Cooper's voyage touched your soul, explore these cosmic masterpieces next",
    excerpt_ar: "جمع Interstellar بين عظمة فيزياء الكون ورهافة المشاعر الأبوية. في هذا المقال نأخذك في جولة مع أبرز الأفلام التي تقدم نفس المزيج الساحر من الاستكشاف الفضائي، المفاهيم العلمية الرصينة، والأسئلة الوجودية.",
    excerpt_en: "Interstellar uniquely blended gravitational physics with the emotional gravity of parenthood. Here are the finest space epics that capture that same transcendent wonder and existential depth.",
    category: "comparisons",
    category_label_ar: "ترشيحات ومقارنات",
    category_label_en: "Recommendations",
    featured_image: "https://image.tmdb.org/t/p/w1280/xJHokMbljvjADYdit5fK5VQsXEG.jpg",
    author_name: "علي الخفاجي",
    author_role: "رئيس تحرير فلمك وناقد سينمائي",
    author_avatar: "/icon-192.png",
    related_movie_ids: [157336, 329865, 438631, 286217, 157],
    related_article_slugs: ["best-psychological-thrillers", "beginner-guide-scifi"],
    reading_time_minutes: 7,
    featured: true,
    published_at: "2026-08-10T14:00:00Z",
    updated_at: "2026-08-20T15:00:00Z",
    content_ar: `## ما الذي جعل Interstellar فريداً إلى هذا الحد؟

عندما صدر Interstellar عام 2014، لم يكن مجرد فيلم فضاء اعتيادي؛ بل كان تزاوجاً نادراً بين **الفيزياء الفلكية الدقيقة** (بفضل إشراف كيب ثورن) والدراما الإنسانية المؤثرة عن البقاء والتضحية ورابطة الأب بابنته عبر حواجز الزمان والمكان.

إذا كنت تبحث عن أعمال تمنحك نفس الشعور بالدهشة الكونية والتأمل العميق، فإليك أفضل الاختيارات:

---

### 1. Arrival (2016) — لغة الكائنات الفضائية وفلسفة الزمن

من إخراج دينيس فيلنوف، يحكي قصة عالمة لغويات تُكلف بالتواصل مع كائنات فضائية هبطت سفنها على الأرض. 

* **لماذا يشبه Interstellar؟** يتناول مفهوم الزمن غير الخطي وكيف يمكن للمشاعر الإنسانية والتضحية أن تعيد تعريف نظرتنا للمستقبل والماضي.
* **نقطة القوة:** الأداء الاستثنائي لإيمي آدمز والسيناريو الذكي المقتبس عن قصة تيد شيانغ.

---

### 2. Contact (1997) — العلم والإيمان في مواجهة المجهول

مقتبس عن رواية عالم الفلك الشهير كارل ساغان ومن إخراج روبرت زيميكس، بطولة جودي فوستر وماثيو ماكونهي (نفس بطل إنترستيلار!).

* **لماذا تشاهده؟** يركز على إشارة راديوية أولى من نجم فيغا، ويناقش كيف يتفاعل المجتمع العلمي والسياسي والديني مع احتمال وجود حضارة ذكية أخرى.

---

### 3. The Martian (2015) — عبقرية البقاء وحب العلم

فيلم ريدلي سكوت الممتع حول رائد الفضاء مارك واتني (مات ديمون) الذي يُترك وحيداً على سطح المريخ ويضطر لاستخدام العلم الصارم للنجاة حتى تصل إليه مهمة إنقاذ.

* **أجواء الفيلم:** أكثر تفاؤلاً وخفة من إنترستيلار، لكنه يشترك معه في تقدير التفكير العلمي والروح البشرية التي لا تستسلم.

---

### 4. 2001: A Space Odyssey (1968) — الأب الروحي لكل سينما الفضاء

تحفة ستانلي كوبريك الخالدة التي استلهم منها نولان معظم كادرات إنترستيلار وتصميم الروبوت TARS. رحلة بصرية وصوتية مهيبة تبدأ من فجر البشرية وتمتد إلى ما وراء النجوم.`,
    content_en: `## What Made Interstellar So Irreplaceable?

When Christopher Nolan released *Interstellar* in 2014, it set a benchmark for marrying rigorous theoretical astrophysics with raw, tear-inducing human pathos.

If you are craving that intoxicating blend of cosmic scale and intimate soul-searching, here are the essential companion viewings:

---

### 1. Arrival (2016) — Linguistic Contact & Non-Linear Time

Denis Villeneuve crafts an intellectual triumph about a linguist tasked with deciphering alien syntax, only to discover that language alters perception of time itself.

* **Why it fits:** It shares *Interstellar's* reverence for human resilience and non-linear temporal storytelling.

---

### 2. Contact (1997) — Faith, Wonder & The First Signal

Based on Carl Sagan's iconic novel and starring Jodie Foster alongside Matthew McConaughey, this film tackles humanity's first contact with intelligent radio waves from Vega.

---

### 3. The Martian (2015) — The Triumph of Scientific Ingenuity

Ridley Scott and Matt Damon deliver an uplifting survival masterclass grounded in botony, physics, and relentless humor against Martian isolation.`,
  },
  {
    id: "art-3",
    slug: "underrated-movies-worth-watching",
    title_ar: "أفلام مظلومة نقدياً وجماهيرياً تستحق كل دقيقة من وقتك: جواهر سينمائية مخفية",
    title_en: "Hidden Cinematic Gems: Underrated Movies That Deserved Massive Acclaim",
    subtitle_ar: "أعمال استثنائية لم تنل حقها من الشهرة والتسويق وتستحق أن تكتشفها الآن",
    subtitle_en: "Brilliant films overshadowed by box-office noise and marketing budgets",
    excerpt_ar: "تضيع الكثير من الروائع السينمائية في زحمة الإصدارات الضخمة وحملات التسويق الهائلة. في هذه القائمة، نسلّط الضوء على أعمال مبتكرة في القصة والتمثيل مرت بهدوء دون أن تأخذ حقها، ونشرح لماذا يجب أن تضعها في قائمتك الليلة.",
    excerpt_en: "Many of cinema's finest treasures slip past general audiences without mega-budget marketing. Here are five hidden masterpieces that deliver unforgettable storytelling.",
    category: "spotlight",
    category_label_ar: "مختارات خاصة",
    category_label_en: "Spotlight",
    featured_image: "https://image.tmdb.org/t/p/w1280/hZkgoQYus5vegHoetLkCJzb17zJ.jpg",
    author_name: "علي الخفاجي",
    author_role: "رئيس تحرير فلمك وناقد سينمائي",
    author_avatar: "/icon-192.png",
    related_movie_ids: [264644, 493922, 335984, 447332],
    related_article_slugs: ["best-psychological-thrillers", "rainy-night-movies"],
    reading_time_minutes: 6,
    featured: false,
    published_at: "2026-08-05T11:00:00Z",
    updated_at: "2026-08-22T09:00:00Z",
    content_ar: `## لماذا تستحق الأفلام المستقلة والمخفية فرصة؟

في عصر هيمنة سلاسل الأبطال الخارقين والإنتاجات التجارية المكررة، تقدم الأفلام الأقل شهرة مساحة حقيقية للمخاطرة الفنية، والشخصيات الإنسانية الحقيقية، والقصص التي لا تتبع قوالب هوليوود الجاهزة.

إليك اختياراتنا السينمائية المظلومة التي تستحق المشاهدة فوراً:

---

### 1. Room (2015) — الحرية والنجاة بعيني طفل

حكاية أم محتجزة وابنها الصغير الذي لا يعرف عن العالم الخارجي سوى الغرفة الصغيرة التي وُلد فيها. أداء بري لارسون والطفل جيكوب تريمبلاي يقدم درساً في الشجاعة والتعافي بعد الصدمة.

---

### 2. Blade Runner 2049 (2017) — ملحمة بصرية لم تنل حقها الجماهيري

رغم الإشادة النقدية والجوائز، لم يحقق الفيلم النجاح التجاري الذي يناسب عظمته البصرية. إخراج دينيس فيلنوف وتصوير روجر ديكنز جعلا من كل لقطة لوحة زيتية متقنة حول معنى الروح والوجود.

---

### 3. Burning (2018) — الغموض الكوري البطيء والمكثف

مقتبس عن قصة قصيرة لهاروكي موراكامي، يقدم المخرج لي تشانغ-دونغ دراما نفسية ساحرة مليئة بالرموز حول الطبقية والغيرة والغموض الذي لا يقدم إجابات سهلة بل يتركك مسكوناً بالتساؤلات.`,
    content_en: `## The Joy of Discovering Unheralded Masterpieces

Independent and under-promoted cinema offers the raw creative risk-taking that massive franchise tentpoles often dilute.

Here are four stunning under-the-radar films ready for your watchlist:

---

### 1. Room (2015) — Freedom Through a Child's Eyes
A heartbreaking, ultimately triumphant story of resilience, trauma, and maternal devotion.

### 2. Blade Runner 2049 (2017) — Denis Villeneuve's Visual Pinnacle
A slow-burn neo-noir philosophy treatise framed by Roger Deakins' Oscar-winning cinematography.

### 3. Burning (2018) — South Korea's Hypnotic Mystery
Murakami's prose translated into a simmering study of class alienation and quiet obsession.`,
  },
  {
    id: "art-4",
    slug: "movies-with-shocking-endings",
    title_ar: "أفلام بنهايات صادمة ومحبكة تُغيّر فهمك للقصة بالكامل: فن الخاتمة الذكية",
    title_en: "Movies with Mind-Blowing Plot Twists That Actually Make Sense",
    subtitle_ar: "تحف سينمائية تدفعك لإعادة المشاهدة فوراً لرؤية الخيوط المخفية",
    subtitle_en: "Cinematic twists that recontextualize every previous scene flawlessly",
    excerpt_ar: "الخاتمة الصادمة الحقيقية ليست مجرد مفاجأة اعتباطية لتغيير مسار الأحداث، بل هي كشف ذكي يعيد ترتيب كل لقطة شاهدتها من منظور جديد كلياً. نستعرض هنا أبرز الأفلام التي أتقنت هذه الصناعة الفنية النادرة.",
    excerpt_en: "A true plot twist isn't a cheap gimmick—it's a masterclass in narrative misdirection where all clues were hidden in plain sight. Here are the finest examples in film history.",
    category: "guides",
    category_label_ar: "دليل السينما الذكية",
    category_label_en: "Cinema Analysis",
    featured_image: "https://image.tmdb.org/t/p/w1280/nMKdUUepR0i5zn0y1T4CsSB5chy.jpg",
    author_name: "علي الخفاجي",
    author_role: "رئيس تحرير فلمك وناقد سينمائي",
    author_avatar: "/icon-192.png",
    related_movie_ids: [1124, 77, 550, 27205],
    related_article_slugs: ["best-psychological-thrillers"],
    reading_time_minutes: 6,
    featured: false,
    published_at: "2026-08-01T12:00:00Z",
    updated_at: "2026-08-20T11:00:00Z",
    content_ar: `## ما الذي يجعل النهاية الصادمة ناجحة؟

النهاية الرديئة تجعل المشاهد يشعر بالخداع، أما النهاية الصادمة العبقرية فتجعل المشاهد يصفق للكاتب لأن الأدلة كانت معروضة أمامه بوضوح طوال الفيلم دون أن يدرك معناها الحقيقي إلا في اللحظة الحاسمة.

### أبرز المعايير:
1. **الترابط المنطقي:** يجب أن تكون النهاية متوافقة مع كل ما سبق.
2. **قيمة إعادة المشاهدة:** مشاهدة الفيلم للمرة الثانية تصبح تجربة جديدة كلياً.
3. **الأثر العاطفي:** الخاتمة ليست لغزاً رياضياً بل صدمة درامية تمس مصير الشخصيات.`,
    content_en: `## The Anatomy of an Earned Twist

A poor twist feels like cheating; a legendary twist makes you marvel at the director's subtlety because every clue was woven right before your eyes.

Explore our top selections where the final five minutes reward your keenest observation.`,
  },
  {
    id: "art-5",
    slug: "korean-cinema-beyond-parasite",
    title_ar: "روائع السينما الكورية التي تستحق المشاهدة: إثارة، دراما، وتحف بصرية لا تُنسى",
    title_en: "Korean Cinema Beyond Parasite: Thrillers, Dramas & Visual Masterpieces",
    subtitle_ar: "دليل شامل لأبرز الأعمال الكورية الجنوبية التي غيرت خريطة السينما العالمية",
    subtitle_en: "A comprehensive journey through South Korea's golden age of filmmaking",
    excerpt_ar: "إذا كان مدخلك للسينما الكورية هو فيلم Parasite، فأنت على موعد مع كنز هائل من الأعمال التي تمتاز بجرأة الطرح، وحبكات الانتقام المتقنة، والعمق العاطفي الفريد.",
    excerpt_en: "If Parasite was your gateway into South Korean cinema, prepare to discover an extraordinary repository of fearless storytelling, revenge thrillers, and heartfelt dramas.",
    category: "genre-deep-dive",
    category_label_ar: "سينما عالمية",
    category_label_en: "World Cinema",
    featured_image: "https://image.tmdb.org/t/p/w1280/hiKmpZMGZsrkA3cdce8a7Dpos1j.jpg",
    author_name: "علي الخفاجي",
    author_role: "رئيس تحرير فلمك وناقد سينمائي",
    author_avatar: "/icon-192.png",
    related_movie_ids: [496243, 290098, 493922, 396535],
    related_article_slugs: ["underrated-movies-worth-watching"],
    reading_time_minutes: 7,
    featured: false,
    published_at: "2026-07-28T16:00:00Z",
    updated_at: "2026-08-18T10:00:00Z",
    content_ar: `## سر تفوق السينما الكورية الجنوبية

تتميز السينما الكورية بقدرتها على كسر الحواجز التقليدية للأنواع الفنية (Genre-Bending)؛ فقد تجد فيلماً يبدأ كدراما عائلية دافئة ويتحول فجأة إلى إثارة لاهثة أو رعب نفسي، دون أن يفقد هويته أو توازنه.

### توصيات أساسية:
* **The Handmaiden (2016)** — تحفة بارك تشان-ووك البصرية المليئة بالمكائد والغموض.
* **Memories of Murder (2003)** — دراما التحقيق الجنائي الأيقونية التي سبقت Parasite للمخرج بونغ جون هو.
* **Train to Busan (2016)** — إعادة تعريف سينما الزومبي بجرعة إنسانية وعاطفية مؤثرة.`,
    content_en: `## Why South Korean Cinema Resonates Globally

Korean directors excel at fearless genre-blending, transitioning seamlessly from domestic drama into high-stakes psychological tension without losing emotional coherence.

Essential viewing includes *The Handmaiden*, *Memories of Murder*, and *Train to Busan*.`,
  },
  {
    id: "art-6",
    slug: "rainy-night-movies",
    title_ar: "أفضل أفلام السهرات الممطرة والهادئة: سينما الدفء والنوستالجيا والأجواء التأملية",
    title_en: "The Ultimate Rainy Night Movie Guide: Cozy, Melancholic & Atmospheric Cinema",
    subtitle_ar: "اختيارات سينمائية مريحة تناسب صوت المطر وفنجان القهوة الدافئ",
    subtitle_en: "Atmospheric and comforting cinematic companions for quiet rainy evenings",
    excerpt_ar: "ليالي الشتاء والمطر تحتاج إلى نوع خاص من السينما: أفلام لا تلهث وراء الأكشن الصاخب، بل تغمرك في تفاصيل بصرية دافئة، وموسيقى هادئة، وشخصيات تلامس القلب.",
    excerpt_en: "Rainy nights call for a distinct cinematic frequency: gentle pacing, lush cinematography, and intimate human warmth.",
    category: "collections",
    category_label_ar: "أجواء ومزاج",
    category_label_en: "Atmosphere & Mood",
    featured_image: "https://image.tmdb.org/t/p/w1280/Ab8mkHmkYADjU7wQiOkia99GQI.jpg",
    author_name: "علي الخفاجي",
    author_role: "رئيس تحرير فلمك وناقد سينمائي",
    author_avatar: "/icon-192.png",
    related_movie_ids: [129, 372058, 289, 153],
    related_article_slugs: ["underrated-movies-worth-watching"],
    reading_time_minutes: 5,
    featured: false,
    published_at: "2026-07-20T18:00:00Z",
    updated_at: "2026-08-15T14:00:00Z",
    content_ar: `## سينما الأجواء الهادئة

عندما ينهمر المطر، تصبح الشاشة ملاذاً للهروب إلى عوالم مفعمة بالجمال البصري والمشاعر الصادقة.

### أبرز الترشيحات:
* **Spirited Away (2001)** — تحفة هاياو ميازاكي التي تأخذك إلى عالم الأرواح الساحر بجمالياته الخالدة.
* **Your Name (2016)** — أنمي رومانسي ساحر عن الروابط الإنسانية التي تتحدى الزمان والمسافات.
* **Amélie (2001)** — جرعة من البهجة الباريسية والألوان الدافئة والتفاؤل الإنساني العذب.`,
    content_en: `## The Sanctuary of Atmospheric Cinema

Transform rainy evenings into unforgettable retreats with cinematic poetry like Miyazaki's *Spirited Away*, Makoto Shinkai's *Your Name*, and Jean-Pierre Jeunet's *Amélie*.`,
  },
];

// Rich genre deep dive metadata & editorial overviews
const GENRE_EDITORIAL_DATA: Record<number, GenreEditorialInfo> = {
  878: {
    id: 878,
    name_ar: "خيال علمي",
    name_en: "Science Fiction",
    intro_ar:
      "الخيال العلمي هو مختبر السينما الأوسع لاستكشاف مصير البشرية وحدود المعرفة والتكنولوجيا. من استكشاف أعماق الفضاء الخارجي والذكاء الاصطناعي إلى العوالم الموازية ومفارقات السفر عبر الزمن، يتيح هذا التصنيف طرح أسئلة فلسفية عميقة حول مكانتنا في الكون.",
    intro_en:
      "Science Fiction serves as cinema's grand laboratory for pondering human destiny, technological frontiers, and existential questions across space exploration, artificial intelligence, and temporal paradoxes.",
    what_to_expect_ar:
      "أفكار فلسفية كبيرة، ابتكار بصري مذهل، استكشاف للمستقبل، وتحديات تتجاوز قدرات الإدراك البشري المعتاد.",
    what_to_expect_en:
      "Expansive worldbuilding, speculative scientific concepts, visual grandeur, and philosophical inquiries into consciousness and technology.",
    signature_tropes_ar: [
      "السفر عبر الزمن والمفارقات السببية",
      "الاستكشاف الفضائي والثقوب الدودية",
      "الذكاء الاصطناعي ووعي الآلات",
      "عوالم ما بعد الكارثة والديستوبيا",
    ],
    signature_tropes_en: [
      "Time travel & temporal loops",
      "Deep space voyages & wormholes",
      "Artificial intelligence & synthetic consciousness",
      "Dystopian societal collapse",
    ],
    essential_picks: [
      {
        id: 157336,
        title_ar: "Interstellar",
        title_en: "Interstellar",
        year: "2014",
        note_ar: "ملحمة تجمع بين فيزياء الثقوب السوداء والرابطة الأبوية الإنسانية.",
        note_en: "A monumental blend of theoretical physics and parental love.",
      },
      {
        id: 27205,
        title_ar: "Inception",
        title_en: "Inception",
        year: "2010",
        note_ar: "هندسة معمارية متعددة الطبقات في عوالم الأحلام والذاكرة.",
        note_en: "A multi-layered heist inside the human subconscious.",
      },
      {
        id: 329865,
        title_ar: "Arrival",
        title_en: "Arrival",
        year: "2016",
        note_ar: "تحفة لغوية وفلسفية تعيد تعريف التواصل والزمن غير الخطي.",
        note_en: "Linguistic elegance and non-linear time perception.",
      },
    ],
    related_guides: [
      {
        slug: "movies-like-interstellar",
        title_ar: "أفلام تشبه Interstellar: روائع الخيال العلمي",
        title_en: "Movies Like Interstellar: Mind-Bending Space Epics",
      },
      {
        slug: "best-psychological-thrillers",
        title_ar: "أقوى أفلام الإثارة النفسية والذهنية",
        title_en: "Best Psychological Thrillers",
      },
    ],
    faqs: [
      {
        q_ar: "ما الفرق بين الخيال العلمي الصارم والخيال العلمي الخفيف؟",
        q_en: "What is the difference between Hard Sci-Fi and Soft Sci-Fi?",
        a_ar:
          "الخيال العلمي الصارم (مثل Interstellar و 2001) يلتزم بقوانين الفيزياء والعلوم المعروفة قدر الإمكان، بينما يركز الخيال العلمي الخفيف على الأبعاد الاجتماعية والنفسية والمغامرة.",
        a_en:
          "Hard Sci-Fi strictly respects known laws of physics and science, whereas Soft Sci-Fi focuses on social, psychological, or exploratory drama.",
      },
      {
        q_ar: "من أين أبدأ إذا كنت جديداً على أفلام الخيال العلمي؟",
        q_en: "Where should beginners start with science fiction cinema?",
        a_ar:
          "ابدأ بأعمال تجمع بين القصة الإنسانية والإبهار البصري المتقن مثل Inception و Arrival و The Martian.",
        a_en:
          "Start with emotionally accessible, visually stunning modern benchmarks like Inception, Arrival, and The Martian.",
      },
    ],
  },
  28: {
    id: 28,
    name_ar: "أكشن",
    name_en: "Action",
    intro_ar:
      "سينما الأكشن هي فن الحركة الديناميكية والمطاردات المحبوسة الأنفاس والقتال المصمم ببراعة هندسية. تطور هذا النوع من المطاردات البسيطة إلى معارك ملحمية وتصميم كوريغرافي رفيع يختبر حدود الجسد البشري والإخراج السينمائي.",
    intro_en:
      "Action cinema celebrates physical prowess, pulse-pounding choreography, and relentless momentum. It ranges from grounded tactical shootouts to sweeping martial arts epics.",
    what_to_expect_ar:
      "إيقاع سريع، مجازفات حقيقية، مؤثرات بصرية مذهلة، وصراع حاسم بين الإرادة والتحديات المستحيلة.",
    what_to_expect_en:
      "High kinetic energy, practical stunts, masterclass choreography, and high-stakes survival.",
    signature_tropes_ar: [
      "مطاردات السيارات والمروحيات السريعة",
      "الفنون القتالية والقتال المباشر",
      "مهمات الإنقاذ ضد الساعة",
      "صراع البطل المنفرد ضد جيش من الخصوم",
    ],
    signature_tropes_en: [
      "High-speed vehicular pursuits",
      "Martial arts & hand-to-hand combat",
      "Race-against-the-clock rescue missions",
      "One-against-many tactical combat",
    ],
    essential_picks: [
      {
        id: 155,
        title_ar: "The Dark Knight",
        title_en: "The Dark Knight",
        year: "2008",
        note_ar: "ملحمة جريمة وأكشن متكاملة بقيادة الجوكر وباتمان.",
        note_en: "The definitive blend of crime epic and visceral superhero action.",
      },
      {
        id: 76341,
        title_ar: "Mad Max: Fury Road",
        title_en: "Mad Max: Fury Road",
        year: "2015",
        note_ar: "سيمفونية بصرية ومطاردة صحراوية غير منقطعة لا تتوقف.",
        note_en: "A non-stop kinetic masterclass in practical stunts and desert warfare.",
      },
      {
        id: 603,
        title_ar: "The Matrix",
        title_en: "The Matrix",
        year: "1999",
        note_ar: "ثورة بصرية أعادت كتابة قواعد الأكشن والفلسفة في السينما.",
        note_en: "Revolutionized visual effects and wire-fu choreography forever.",
      },
    ],
    related_guides: [
      {
        slug: "best-psychological-thrillers",
        title_ar: "أفلام الإثارة والتشويق الذكي",
        title_en: "Best Psychological Thrillers",
      },
    ],
    faqs: [
      {
        q_ar: "ما الذي يميز الأكشن الواقعي عن الأكشن الرقمي؟",
        q_en: "What differentiates practical action from CGI-heavy action?",
        a_ar:
          "الأكشن الواقعي يعتمد على المجازفين الحقيقيين والمؤثرات الميكانيكية الحية، مما يعطي المشاهد إحساساً حقيقياً بالخطر والوزن على عكس المؤثرات الرقمية المفرطة.",
        a_en:
          "Practical action employs real stunt performers and physical pyrotechnics, delivering tangible weight and genuine stakes.",
      },
    ],
  },
  27: {
    id: 27,
    name_ar: "رعب",
    name_en: "Horror",
    intro_ar:
      "الرعب السينمائي هو المرآة التي تعكس مخاوفنا الدفينة والمجهول وما وراء الطبيعة. يتجاوز الرعب المعاصر الفزعات السطحية ليقدم دراسات نفسية عميقة حول الصدمات الموروثة، والرهاب الاجتماعي، والعزلة.",
    intro_en:
      "Horror cinema confronts our primal anxieties and the dread of the unknown, exploring grief, trauma, and psychological disintegration far beyond superficial jump scares.",
    what_to_expect_ar:
      "أجواء مظلمة، توتر نفسي تصاعدي، غموض غيبي، ونهايات غير تقليدية.",
    what_to_expect_en:
      "Atmospheric dread, slow-building tension, supernatural forces, and unsettling thematic depth.",
    signature_tropes_ar: [
      "المنازل المسكونة والأماكن المعزولة",
      "الكيانات الخارقة للطبيعة والأساطير الشعبية",
      "الرعب النفسي والتفكك العقلي",
      "أفلام البقاء ضد قوى مجهولة",
    ],
    signature_tropes_en: [
      "Haunted architecture & rural isolation",
      "Folklore & supernatural entities",
      "Psychological paranoia & body horror",
      "Survival against unknowable entities",
    ],
    essential_picks: [
      {
        id: 694,
        title_ar: "The Shining",
        title_en: "The Shining",
        year: "1980",
        note_ar: "تحفة كوبريك في العزلة والجنون داخل فندق أوفرلوك.",
        note_en: "Kubrick's masterclass in psychological claustrophobia and descent into madness.",
      },
      {
        id: 419430,
        title_ar: "Get Out",
        title_en: "Get Out",
        year: "2017",
        note_ar: "رعب اجتماعي ذكي نال إشادة نقدية واسعة وجائزة الأوسكار.",
        note_en: "Jordan Peele's razor-sharp social satire and psychological nightmare.",
      },
      {
        id: 493922,
        title_ar: "Hereditary",
        title_en: "Hereditary",
        year: "2018",
        note_ar: "دراما عائلية مرعبة تتناول الصدمة واللعنات الموروثة بقسوة.",
        note_en: "Ari Aster's deeply unsettling examination of grief and familial doom.",
      },
    ],
    related_guides: [
      {
        slug: "best-psychological-thrillers",
        title_ar: "دليل أفلام الإثارة والغموض النفسي",
        title_en: "Psychological Thrillers Guide",
      },
    ],
    faqs: [
      {
        q_ar: "ما هو الرعب المرتفع (Elevated Horror)؟",
        q_en: "What is elevated horror?",
        a_ar:
          "هو مصطلح نقدي يُطلق على أفلام الرعب التي تركز على الدراما النفسية والرمزية الفنية وموضوعات مثل الحزن والفقدان بدلاً من الاعتماد على الدماء والفزعات الرخيصة.",
        a_en:
          "It refers to horror films prioritizing psychological atmosphere, artistic metaphor, and thematic resonance over cheap shocks.",
      },
    ],
  },
  18: {
    id: 18,
    name_ar: "دراما",
    name_en: "Drama",
    intro_ar:
      "الدراما هي قلب السينما النابض وأكثر الأنواع قدرة على ملامسة الواقع الإنساني. تتناول صراعات النفس، والعلاقات المعقدة، والعدالة الاجتماعية، والخيارات المصيرية التي تحدد مسار الحياة.",
    intro_en:
      "Drama remains cinema's emotional bedrock, portraying nuanced human relationships, moral crossroads, social struggle, and intimate character transformations.",
    what_to_expect_ar:
      "شخصيات مبنية بعناية، حوارات قوية، أداء تمثيلي عميق، ولحظات وجدانية مؤثرة.",
    what_to_expect_en:
      "Character-driven arcs, powerful dialogue, award-winning acting performances, and emotional resonance.",
    signature_tropes_ar: [
      "صراعات العائلة والروابط الإنسانية",
      "النهوض بعد السقوط والتغلب على الصعاب",
      "الأخلاق والعدالة والمحاكمات الاجتماعية",
      "البحث عن الذات والهوية",
    ],
    signature_tropes_en: [
      "Family dynamics & generational tension",
      "Resilience against insurmountable odds",
      "Moral integrity & legal justice",
      "Identity discovery & self-actualization",
    ],
    essential_picks: [
      {
        id: 278,
        title_ar: "The Shawshank Redemption",
        title_en: "The Shawshank Redemption",
        year: "1994",
        note_ar: "الفيلم الأعلى تقييماً في تاريخ السينما عن الأمل والصداقة خلف القضبان.",
        note_en: "The highest-rated film in cinema history celebrating unbreakable hope.",
      },
      {
        id: 238,
        title_ar: "The Godfather",
        title_en: "The Godfather",
        year: "1972",
        note_ar: "الملحمة الكلاسيكية الأرقى حول العائلة والسلطة والانحدار الأخلاقي.",
        note_en: "Francis Ford Coppola's quintessential saga of power and dynasty.",
      },
      {
        id: 244786,
        title_ar: "Whiplash",
        title_en: "Whiplash",
        year: "2014",
        note_ar: "صراع شرس بين الطموح الموسيقي والكمالية القاسية.",
        note_en: "Electrifying duel between musical ambition and relentless perfectionism.",
      },
    ],
    related_guides: [
      {
        slug: "underrated-movies-worth-watching",
        title_ar: "أفلام مظلومة نقدياً تستحق وقتك",
        title_en: "Underrated Gems Worth Watching",
      },
    ],
    faqs: [
      {
        q_ar: "كيف تختار فيلماً درامياً يناسب مزاجك؟",
        q_en: "How do you pick the right drama for your mood?",
        a_ar:
          "حدد ما إذا كنت تبحث عن قصة ملهمة تبعث على التفاؤل (مثل Shawshank) أو دراما واقعية مكثفة تستكشف صراعات معقدة (مثل Whiplash).",
        a_en:
          "Identify whether you want an uplifting human triumphs story or an intense, high-tension character study.",
      },
    ],
  },
};

// 1. Get editorial review for a movie
export const getEditorialReview = createServerFn({ method: "GET" })
  .validator((d: unknown) => z.object({ movieId: z.number().int().positive() }).parse(d))
  .handler(async ({ data }): Promise<EditorialReview | null> => {
    // 1) Try Supabase DB
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: rev, error } = await supabaseAdmin
        .from("editorial_reviews")
        .select("*")
        .eq("movie_id", data.movieId)
        .eq("status", "published")
        .maybeSingle();

      if (!error && rev) {
        return {
          id: rev.id,
          movie_id: rev.movie_id,
          title: rev.title,
          verdict: rev.verdict,
          review_content: rev.review_content,
          strengths: rev.strengths ?? [],
          weaknesses: rev.weaknesses ?? [],
          who_should_watch: rev.who_should_watch ?? "",
          who_may_not_enjoy: rev.who_may_not_enjoy ?? "",
          why_watch: rev.why_watch ?? "",
          best_for: rev.best_for ?? "",
          mood: rev.mood ?? "",
          experience_level: rev.experience_level ?? "",
          recommended_viewing: rev.recommended_viewing ?? "",
          content_notes: rev.content_notes ?? undefined,
          editorial_score: Number(rev.editorial_score),
          story_score: rev.story_score ? Number(rev.story_score) : 0,
          acting_score: rev.acting_score ? Number(rev.acting_score) : 0,
          visuals_score: rev.visuals_score ? Number(rev.visuals_score) : 0,
          entertainment_score: rev.entertainment_score ? Number(rev.entertainment_score) : 0,
          author_name: rev.author_name,
          author_role: rev.author_role,
          status: "published",
          similar_reasons: (rev.similar_reasons as Record<string, string>) ?? {},
          published_at: rev.published_at,
          updated_at: rev.updated_at,
        };
      }
    } catch {
      // Fallback to memory
    }

    // 2) Fallback to in-memory seed catalog
    if (SEED_EDITORIAL_REVIEWS[data.movieId]) {
      return SEED_EDITORIAL_REVIEWS[data.movieId];
    }

    return null;
  });

// 2. Get list of editorial articles
export const getEditorialArticles = createServerFn({ method: "GET" })
  .validator(
    (d: unknown) =>
      z
        .object({
          category: z.string().optional(),
          featuredOnly: z.boolean().optional(),
          limit: z.number().int().min(1).max(50).optional(),
        })
        .parse(d ?? {}),
  )
  .handler(async ({ data }): Promise<Article[]> => {
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      let query = supabaseAdmin
        .from("articles")
        .select("*")
        .eq("status", "published")
        .order("published_at", { ascending: false });

      if (data.category && data.category !== "all") {
        query = query.eq("category", data.category);
      }
      if (data.featuredOnly) {
        query = query.eq("featured", true);
      }
      if (data.limit) {
        query = query.limit(data.limit);
      }

      const { data: rows, error } = await query;
      if (!error && rows && rows.length > 0) {
        return rows.map((r) => ({
          id: r.id,
          slug: r.slug,
          title_ar: r.title_ar,
          title_en: r.title_en,
          subtitle_ar: r.subtitle_ar ?? undefined,
          subtitle_en: r.subtitle_en ?? undefined,
          excerpt_ar: r.excerpt_ar,
          excerpt_en: r.excerpt_en,
          content_ar: r.content_ar,
          content_en: r.content_en,
          category: (r.category as Article["category"]) || "guides",
          category_label_ar: r.category === "spotlight" ? "مختارات خاصة" : "دليل سينمائي",
          category_label_en: r.category === "spotlight" ? "Spotlight" : "Guide",
          featured_image: r.featured_image ?? undefined,
          author_name: r.author_name,
          author_role: r.author_role,
          author_avatar: r.author_avatar ?? undefined,
          related_movie_ids: r.related_movie_ids ?? [],
          related_article_slugs: r.related_article_slugs ?? [],
          reading_time_minutes: r.reading_time_minutes,
          featured: r.featured,
          published_at: r.published_at,
          updated_at: r.updated_at,
        }));
      }
    } catch {
      // Fallback
    }

    // Fallback to seed articles
    let list = SEED_ARTICLES;
    if (data.category && data.category !== "all") {
      list = list.filter((a) => a.category === data.category);
    }
    if (data.featuredOnly) {
      list = list.filter((a) => a.featured);
    }
    if (data.limit) {
      list = list.slice(0, data.limit);
    }
    return list;
  });

// 3. Get single article by slug
export const getEditorialArticleBySlug = createServerFn({ method: "GET" })
  .validator((d: unknown) => z.object({ slug: z.string().min(1) }).parse(d))
  .handler(async ({ data }): Promise<Article | null> => {
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: r, error } = await supabaseAdmin
        .from("articles")
        .select("*")
        .eq("slug", data.slug)
        .eq("status", "published")
        .maybeSingle();

      if (!error && r) {
        return {
          id: r.id,
          slug: r.slug,
          title_ar: r.title_ar,
          title_en: r.title_en,
          subtitle_ar: r.subtitle_ar ?? undefined,
          subtitle_en: r.subtitle_en ?? undefined,
          excerpt_ar: r.excerpt_ar,
          excerpt_en: r.excerpt_en,
          content_ar: r.content_ar,
          content_en: r.content_en,
          category: (r.category as Article["category"]) || "guides",
          category_label_ar: r.category === "spotlight" ? "مختارات خاصة" : "دليل سينمائي",
          category_label_en: r.category === "spotlight" ? "Spotlight" : "Guide",
          featured_image: r.featured_image ?? undefined,
          author_name: r.author_name,
          author_role: r.author_role,
          author_avatar: r.author_avatar ?? undefined,
          related_movie_ids: r.related_movie_ids ?? [],
          related_article_slugs: r.related_article_slugs ?? [],
          reading_time_minutes: r.reading_time_minutes,
          featured: r.featured,
          published_at: r.published_at,
          updated_at: r.updated_at,
        };
      }
    } catch {
      // Fallback
    }

    const found = SEED_ARTICLES.find((a) => a.slug === data.slug);
    return found ?? null;
  });

// 4. Get genre editorial information
export const getGenreEditorial = createServerFn({ method: "GET" })
  .validator((d: unknown) => z.object({ genreId: z.number().int().positive() }).parse(d))
  .handler(async ({ data }): Promise<GenreEditorialInfo | null> => {
    return GENRE_EDITORIAL_DATA[data.genreId] ?? null;
  });

// 5. Get featured pick of the week
export const getEditorialPickOfTheWeek = createServerFn({ method: "GET" }).handler(
  async (): Promise<{
    movieId: number;
    title: string;
    score: number;
    badge_ar: string;
    badge_en: string;
    why_picked_ar: string;
    why_picked_en: string;
    who_should_watch_ar: string;
    who_should_watch_en: string;
    backdrop: string;
    poster: string;
    year: string;
    genres: string[];
  }> => {
    return {
      movieId: 157336,
      title: "Interstellar",
      score: 9.3,
      badge_ar: "اختيار الأسبوع التحريري",
      badge_en: "FILMAK Weekly Pick",
      why_picked_ar:
        "ملحمة كريستوفر نولان التي لا تشيخ، تجمع بين الإعجاز العلمي والموسيقى المهيبة لأورغن هانز زيمر، لتقدم تجربة سينمائية نادرة تُلامس أعماق القلب.",
      why_picked_en:
        "Christopher Nolan's ageless space odyssey seamlessly combines rigorous astrophysics with Hans Zimmer's soaring church-organ score to create an unforgettable emotional triumph.",
      who_should_watch_ar:
        "عشاق الخيال العلمي الفلسفي، والباحثون عن قصص التضحية والأمل الكوني.",
      who_should_watch_en:
        "Fans of cerebral science fiction and emotionally resonant family dramas.",
      backdrop: "https://image.tmdb.org/t/p/w1280/xJHokMbljvjADYdit5fK5VQsXEG.jpg",
      poster: "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
      year: "2014",
      genres: ["خيال علمي", "دراما", "مغامرة"],
    };
  },
);

export const COLLECTIONS_DATA: Record<
  string,
  {
    ar: string;
    en: string;
    genre: string;
    year?: number;
    language?: string;
    descAr: string;
    descEn: string;
    editorialIntroAr: string;
    editorialIntroEn: string;
  }
> = {
  "best-movies-2026": {
    ar: "أفضل أفلام 2026",
    en: "Best Movies of 2026",
    genre: "",
    year: 2026,
    descAr: "أبرز الإصدارات السينمائية الجديدة لعام 2026 المنتقاة بعناية لمساعدتك على متابعة أهم أعمال العام.",
    descEn: "A carefully curated selection of the most notable new cinematic releases from 2026.",
    editorialIntroAr: "شهد عام 2026 تنوعاً مبهراً في الإنتاجات السينمائية بين الخيال العلمي الملحمي، والدراما المستقلة المكثفة، والتجارب الإخراجية المبتكرة. اخترنا لك هنا الأعمال التي تستحق المشاهدة والتقييم.",
    editorialIntroEn: "2026 delivered an impressive array of cinematic achievements across science fiction, intimate independent drama, and visionary directing. Here are the defining releases of the year.",
  },
  "horror-movies": {
    ar: "أفضل أفلام الرعب والغموض",
    en: "Best Horror Movies",
    genre: "27",
    descAr: "أفلام رعب قوية لمحبي التوتر والأجواء المظلمة والرعب النفسي العميق.",
    descEn: "Horror masterworks for fans of psychological dread, atmosphere, and unrelenting suspense.",
    editorialIntroAr: "يتجاوز الرعب السينمائي الفزعات السطحية ليأخذنا في رحلة داخل أعمق المخاوف الإنسانية. هذه المجموعة تضم أعمالاً رائدة في بناء الأجواء الخانقة والتوتر النفسي الصاعد.",
    editorialIntroEn: "True horror transcends cheap jump scares into psychological dread and atmospheric terror. This collection highlights the finest films exploring the darker corners of human fear.",
  },
  "romantic-movies": {
    ar: "أفضل الأفلام الرومانسية",
    en: "Best Romantic Movies",
    genre: "10749",
    descAr: "اختيارات رومانسية عذبة تجمع بين دفء المشاعر والقصص الإنسانية الصادقة.",
    descEn: "Romantic cinema ranging from timeless classics to poignant modern relationships.",
    editorialIntroAr: "السينما الرومانسية حين تُصنع بصدق تلامس أوتار القلوب وتخلد لحظات الشوق واللقاء والتضحية. استمتع بأعمال تبتعد عن الابتذال وتقدم دراما عاطفية راقية.",
    editorialIntroEn: "Intimate, heartfelt, and resonant stories of human connection, longing, and romance crafted with genuine emotional honesty.",
  },
  "action-movies": {
    ar: "أفضل أفلام الأكشن والإثارة",
    en: "Best Action Movies",
    genre: "28",
    descAr: "أكشن ومطاردات ومعارك مصممة بحرفية عالية لمن يريد جرعة حماس وأدرينالين.",
    descEn: "High-octane choreography, breathtaking stunts, and non-stop momentum.",
    editorialIntroAr: "الأكشن ليس مجرد انفجارات؛ بل هو فن كوريغرافيا القتال وضبط إيقاع المطاردات وتصميم المجازفات الحية التي تحبس الأنفاس من اللقطة الأولى حتى الختام.",
    editorialIntroEn: "Action cinema at its peak: masterclass choreography, practical stunt mastery, and kinetic storytelling that keeps adrenaline pumping.",
  },
  "comedy-movies": {
    ar: "أفضل الأفلام الكوميدية",
    en: "Best Comedy Movies",
    genre: "35",
    descAr: "أفلام كوميدية ممتعة وذكية لسهرة خفيفة بدون تعقيد.",
    descEn: "Hilarious, uplifting, and smart comedies for an entertaining movie night.",
    editorialIntroAr: "الضحك فن رفيع، وهذه القائمة تجمع بين الكوميديا الذكية، والمواقف الطريفة، والحوارات الساخرة لتمنحك أمسية مريحة ترسم الابتسامة.",
    editorialIntroEn: "Laughter and brilliant situational wit: curated comedies that combine smart writing with genuine lighthearted entertainment.",
  },
  "sci-fi-movies": {
    ar: "أفضل أفلام الخيال العلمي",
    en: "Best Sci-Fi Movies",
    genre: "878",
    descAr: "عوالم مستقبلية، أسرار الفضاء، وأفكار فلسفية تتجاوز المألوف.",
    descEn: "Futuristic visions, cosmic mysteries, and mind-bending philosophical concepts.",
    editorialIntroAr: "مختبر الأفكار الكبرى؛ حيث يلتقي التفكير العلمي مع الأسئلة الوجودية حول الزمن، ومصير البشرية، وحدود الكون.",
    editorialIntroEn: "The ultimate frontier of speculative thought: where scientific concepts converge with existential inquiries about human destiny.",
  },
  "korean-movies": {
    ar: "أفضل الأفلام الكورية",
    en: "Best Korean Movies",
    genre: "",
    descAr: "اختيارات من السينما الكورية الجنوبية تجمع بين الإثارة والدراما والغموض.",
    descEn: "South Korean cinematic gems across gripping thrillers, domestic drama, and mystery.",
    language: "ko",
    editorialIntroAr: "السينما الكورية الجنوبية تشتهر بالحبكات غير المتوقعة والشخصيات المعقدة والجرأة الفنية النادرة. إليك أفضل ما أنتجته هذه السينما الرائدة.",
    editorialIntroEn: "South Korean cinema is renowned for fearless genre blending, intense psychological stakes, and unparalleled narrative surprises.",
  },
  "turkish-movies": {
    ar: "أفضل الأفلام التركية",
    en: "Best Turkish Movies",
    genre: "",
    descAr: "أعمال درامية وسينمائية تركية مميزة بالشخصيات القوية والقصص المؤثرة.",
    descEn: "Turkish cinema picks renowned for emotional resonance and evocative cinematography.",
    language: "tr",
    editorialIntroAr: "تتميز السينما التركية بعمقها الإنساني والدراما العاطفية الدافئة والتصوير البصري المستلهم من طبيعة وثقافة المنطقة.",
    editorialIntroEn: "Turkish cinema offers poetic visual beauty, intimate character studies, and profound emotional narratives.",
  },
  "arabic-movies": {
    ar: "أفضل الأفلام العربية",
    en: "Best Arabic Movies",
    genre: "",
    descAr: "أفلام عربية مختارة من مختلف المدارس السينمائية في المنطقة.",
    descEn: "Selected Arabic-language cinema representing diverse regional voices.",
    language: "ar",
    editorialIntroAr: "مختارات من أبرز إنتاجات السينما العربية التي تناولت الهوية والمجتمع وقصص الإنسان العربي برؤى إخراجية معاصرة ومتميزة.",
    editorialIntroEn: "A curated survey of modern Arabic cinema exploring identity, heritage, and compelling local stories.",
  },
  "movies-like-inception": {
    ar: "أفلام مثل Inception",
    en: "Movies Like Inception",
    genre: "878",
    descAr: "أفلام ذكية لمحبي الألغاز والواقع المتداخل والأفكار الذهنية الكبيرة.",
    descEn: "Smart thrillers for fans of layered realities, memory puzzles, and big concepts.",
    editorialIntroAr: "إذا كنت تعشق القصص التي تتلاعب بمفهوم الواقع وتجعلك تفكر في كل مشهد كأنه قطعة في لغز هندسي، فهذه هي القائمة المثالية لك.",
    editorialIntroEn: "If you thrive on non-linear narratives and reality-bending puzzles that reward active viewing, explore these mind-bending masterworks.",
  },
};

export const getCollectionMovies = createServerFn({ method: "GET" })
  .validator((d: unknown) => z.object({ slug: z.string().min(1).max(100) }).parse(d))
  .handler(async ({ data }) => {
    const c = COLLECTIONS_DATA[data.slug];
    if (!c) return { collection: null, items: [] };
    const p: Record<string, string> = {
      sort_by: "popularity.desc",
      include_adult: "false",
      page: "1",
      "vote_count.gte": "50",
    };
    if (c.genre) p.with_genres = c.genre;
    if (c.year) p.primary_release_year = String(c.year);
    if (c.language) p.with_original_language = c.language;

    try {
      const { tmdbGet } = await import("./tmdb.server");
      const res = await tmdbGet<{ results: any[] }>("/discover/movie", p, "en");
      return {
        collection: c,
        items: (res.results ?? [])
          .filter((x: any) => x.poster_path)
          .slice(0, 18)
          .map((x: any) => ({
            id: x.id,
            title: x.title || x.original_title,
            poster: `https://image.tmdb.org/t/p/w500${x.poster_path}`,
            year: (x.release_date || "").slice(0, 4),
            rating: Math.round((x.vote_average || 0) * 10) / 10,
            overview: x.overview || "",
          })),
      };
    } catch {
      return { collection: c, items: [] };
    }
  });

