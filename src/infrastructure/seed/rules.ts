/**
 * The coach's notes, transcribed from the plan PDF. Shown in the reference
 * screen. Arabic is the coach's wording; English is a translation for the
 * English interface.
 */
export interface PlanRule {
  readonly id: string
  readonly titleAr: string
  readonly titleEn: string
  readonly bodyAr: string
  readonly bodyEn: string
}

export const PLAN_RULES: readonly PlanRule[] = [
  {
    id: 'weighing',
    titleAr: 'وزن الطعام',
    titleEn: 'Weighing food',
    bodyAr: 'قبل الطهي: جميع الكربوهيدرات مثل الأرز والبطاطس والشوفان. بعد الطهي: جميع أنواع البروتين بدون جلد أو دهون أو عظام.',
    bodyEn:
      'Before cooking: all carbohydrates such as rice, potato and oats. After cooking: all protein, with no skin, fat or bone.',
  },
  {
    id: 'cooking',
    titleAr: 'طريقة الطهي',
    titleEn: 'Cooking method',
    bodyAr: 'أي طريقة مسموحة: مشوي، مسلوق، في الميكروويف، على البخار. بدون مواد دهنية إلا إذا حددت لك كمية زيت في خطتك.',
    bodyEn:
      'Any method is allowed: grilled, boiled, microwaved or steamed. No added fat unless the plan gives you a specific oil amount.',
  },
  {
    id: 'fats',
    titleAr: 'الدهون والزيوت',
    titleEn: 'Fats and oils',
    bodyAr: 'مسموح استخدامها فقط إذا كانت مكتوبة في الخطة، وبالكمية المحددة. بدون ذلك استخدم رذاذ الزيت أو أواني غير لاصقة.',
    bodyEn:
      'Allowed only when written into the plan, at exactly the stated amount. Otherwise use spray oil or non-stick cookware.',
  },
  {
    id: 'sugar',
    titleAr: 'السكر',
    titleEn: 'Sugar',
    bodyAr: 'ممنوع السكر الأبيض. مسموح السكر الزيرو كالوري مثل ستيفيا أو السوربيتول. السكر البني وسكر الفركتوز بهما سعرات مثل السكر الأبيض.',
    bodyEn:
      'White sugar is not allowed. Zero calorie sweeteners such as stevia or sorbitol are allowed. Brown sugar and fructose carry the same calories as white sugar.',
  },
  {
    id: 'salt',
    titleAr: 'الملح',
    titleEn: 'Salt',
    bodyAr: 'لا تقطع الملح، الصوديوم مهم. استخدم ملعقة ملح صغيرة ممسوحة تطبخ بها طول اليوم.',
    bodyEn: 'Do not cut salt out; sodium matters. Use one level small spoon for the whole day of cooking.',
  },
  {
    id: 'vegetables',
    titleAr: 'الخضروات',
    titleEn: 'Vegetables',
    bodyAr: 'مفيدة جدا وسعراتها قليلة جدا، يمكنك إضافة ما تريد منها.',
    bodyEn: 'Very useful and very low in calories. Add as much as you want.',
  },
  {
    id: 'caffeine',
    titleAr: 'المشروبات المنبهة',
    titleEn: 'Caffeine',
    bodyAr: 'الشاي والقهوة مسموحان باعتدال. يفضل ألا تتخطى 3 أكواب شاي أو 3 فناجين قهوة في اليوم.',
    bodyEn: 'Tea and coffee are allowed in moderation. Try not to exceed 3 cups of tea or 3 coffees a day.',
  },
  {
    id: 'herbal',
    titleAr: 'المشروبات العشبية',
    titleEn: 'Herbal drinks',
    bodyAr: 'أي مشروبات عشبية متاحة عادي: قرفة، زنجبيل، نعناع، ينسون. بدون سكر أو باستخدام سكر دايت.',
    bodyEn: 'Any herbal drink is fine: cinnamon, ginger, mint, anise. Without sugar, or with a diet sweetener.',
  },
  {
    id: 'sauces',
    titleAr: 'صوص زيرو كالوري',
    titleEn: 'Zero calorie sauces',
    bodyAr: 'مسموح باستعمال أي صوص زيرو كالوري، مثل المسطردة وجميع صوصات ناتوريستا.',
    bodyEn: 'Any zero calorie sauce is allowed, for example mustard and the Naturista range.',
  },
  {
    id: 'snacks',
    titleAr: 'التسالي',
    titleEn: 'Nuts and seeds',
    bodyAr: 'اللب والمكسرات مفيدة لكن سعراتها عالية جدا ولازم تكون محسوبة. 10 جرام لوز فيها 70 كالوري.',
    bodyEn:
      'Seeds and nuts are useful but very calorie dense and must be counted. 10 g of almonds is about 70 calories.',
  },
  {
    id: 'free-day',
    titleAr: 'اليوم الفري',
    titleEn: 'Free day',
    bodyAr: 'مفيش حاجة اسمها يوم فري. وجبة واحدة فقط في نهاية مدة الخطة، وغالبا 15 يوم، وبتعليمات من الكوتش.',
    bodyEn:
      'There is no such thing as a free day. One single meal at the end of the plan period, usually 15 days, and only on the coach instruction.',
  },
  {
    id: 'cheat-meal',
    titleAr: 'محتويات التشيت ميل',
    titleEn: 'What the cheat meal should be',
    bodyAr: 'يفضل تكون وجبة غنية بالبروتين: كباب، كفتة، سمك، برجر. ونبتعد عن السكريات والحلويات، وإذا تناولناها تكون بعد الوجبة وبكميات صغيرة.',
    bodyEn:
      'Prefer a protein rich meal: kebab, kofta, fish, burger. Stay away from sugar and sweets, and if you do have them, eat them after the main meal and in small amounts.',
  },
  {
    id: 'fast-food',
    titleAr: 'الأكل السريع',
    titleEn: 'Fast food',
    bodyAr: 'تقدر تدخله في التشيت ميل فقط، وهو ضار ومليء بالدهون المهدرجة.',
    bodyEn: 'Only inside the cheat meal. It is harmful and full of hydrogenated fat.',
  },
  {
    id: 'cardio',
    titleAr: 'الكارديو',
    titleEn: 'Cardio',
    bodyAr: 'تريدميل 30 دقيقة، 5 أيام في الأسبوع، نبض من 95 إلى 120. وحتى في الأيام بدون جيم حاول تقفل من 8 إلى 10 آلاف خطوة.',
    bodyEn:
      'Treadmill 30 minutes, 5 days a week, heart rate 95 to 120. Even on days without the gym, aim for 8000 to 10000 steps.',
  },
]
