import type { Food } from '@/domain/model/food'
import type { FoodCategory } from '@/domain/model/category'
import { quantity } from '@/domain/model/quantity'
import type { Unit } from '@/domain/model/unit'

/**
 * The coach's exchange tables, transcribed from
 * `docs/source-pdfs/food-exchange-list.pdf`.
 *
 * `nameAr` is the coach's own wording and is authoritative. `nameEn` is an
 * app-supplied label for the English interface and carries no authority.
 * Reference portions are exactly as printed. Nothing here is estimated, and
 * there are deliberately no calorie or macro figures: the source PDFs contain
 * none per food.
 */

interface Row {
  id: string
  ar: string
  en: string
  ref: number | null
  unit?: Unit
  subGroup?: string
  note?: string
}

const table = (category: FoodCategory, source: string, rows: readonly Row[]): Food[] =>
  rows.map((row) => ({
    id: row.id,
    nameAr: row.ar,
    nameEn: row.en,
    category,
    reference: row.ref === null ? null : quantity(row.ref, row.unit ?? 'g'),
    source,
    ...(row.subGroup === undefined ? {} : { subGroup: row.subGroup }),
  }))

/** Weighed after cooking, with no skin, fat or bone. */
const protein = table('protein', 'exchange-list:protein', [
  { id: 'egg-white', ar: 'بياض بيض', en: 'Egg white', ref: 300 },
  { id: 'cottage-cheese', ar: 'جبن قريش', en: 'Cottage cheese', ref: 200 },
  { id: 'salmon', ar: 'سمك سالمون', en: 'Salmon', ref: 120 },
  // The extracted text reads "سمك مكرونه", which is a scanning artefact.
  { id: 'mackerel', ar: 'سمك ماكريل', en: 'Mackerel', ref: 120, note: 'NEEDS VERIFY against the PDF page' },
  { id: 'tilapia', ar: 'سمك بلطي', en: 'Tilapia', ref: 120 },
  { id: 'sardine', ar: 'سمك سردين', en: 'Sardines', ref: 120 },
  { id: 'mullet', ar: 'سمك بوري', en: 'Grey mullet', ref: 120 },
  { id: 'fish-fillet', ar: 'سمك فيليه', en: 'Fish fillet', ref: 120 },
  { id: 'shrimp', ar: 'جمبري', en: 'Shrimp', ref: 100 },
  { id: 'liver', ar: 'كبدة', en: 'Liver', ref: 130 },
  { id: 'tuna', ar: 'تونة', en: 'Tuna', ref: 100 },
  { id: 'poultry-breast', ar: 'لحم صدور', en: 'Poultry breast', ref: 120 },
  { id: 'chicken-liver', ar: 'كبدة دجاج', en: 'Chicken liver', ref: 120 },
  { id: 'rabbit', ar: 'لحم أرانب', en: 'Rabbit', ref: 100 },
  { id: 'red-meat', ar: 'لحم أحمر', en: 'Red meat', ref: 120 },
  { id: 'whole-egg', ar: 'بيض كامل', en: 'Whole egg', ref: 250 },
  { id: 'poultry-thigh', ar: 'لحم وراك', en: 'Poultry thigh', ref: 100 },
  { id: 'feta-light', ar: 'فيتا لايت', en: 'Light feta', ref: 150 },
  // The extracted text reads "فصوص رومي", which is a scanning artefact.
  { id: 'turkey-breast', ar: 'صدور رومي', en: 'Turkey breast', ref: 120, note: 'NEEDS VERIFY against the PDF page' },
  { id: 'roast-beef', ar: 'روست بيف', en: 'Roast beef', ref: 120 },
])

/** Weighed before cooking. */
const carb = table('carb', 'exchange-list:carbohydrates', [
  { id: 'cornflakes', ar: 'كورن فليكس', en: 'Cornflakes', ref: 55 },
  { id: 'pasta', ar: 'مكرونة أو شعرية', en: 'Pasta or vermicelli', ref: 65 },
  { id: 'rice', ar: 'أرز', en: 'Rice', ref: 60 },
  { id: 'bulgur', ar: 'برغل', en: 'Bulgur', ref: 60 },
  { id: 'freekeh', ar: 'فريك', en: 'Freekeh', ref: 60 },
  { id: 'fino-bread', ar: 'فينو', en: 'Fino bread', ref: 90 },
  { id: 'shami-bread', ar: 'خبز شامي', en: 'Shami bread', ref: 85 },
  { id: 'baladi-bread', ar: 'خبز بلدي', en: 'Baladi bread', ref: 100 },
  { id: 'kaiser-roll', ar: 'كيزر', en: 'Kaiser roll', ref: 90 },
  { id: 'white-toast', ar: 'توست أبيض', en: 'White toast', ref: 90 },
  { id: 'brown-toast', ar: 'توست أسمر', en: 'Brown toast', ref: 90 },
  { id: 'corn-cob', ar: 'كوز ذرة مشوي', en: 'Grilled corn on the cob', ref: 90 },
  { id: 'potato', ar: 'بطاطس', en: 'Potato', ref: 260 },
  { id: 'taro', ar: 'قلقاس', en: 'Taro', ref: 180 },
  { id: 'sweet-potato', ar: 'بطاطا', en: 'Sweet potato', ref: 260 },
  { id: 'quinoa', ar: 'كينوا', en: 'Quinoa', ref: 60 },
  { id: 'oats', ar: 'شوفان', en: 'Oats', ref: 60 },
  { id: 'rusk', ar: 'بقسماط', en: 'Rusk', ref: 60 },
  { id: 'belila', ar: 'بليلة', en: 'Belila (wheat berries)', ref: 60 },
  { id: 'popcorn', ar: 'ذرة (فشار)', en: 'Corn or popcorn', ref: 65 },
  { id: 'tortilla', ar: 'تورتيلا', en: 'Tortilla', ref: 80 },
])

/** Three sub groups; the coach prefers swapping inside the same group. */
const fat = table('fat', 'exchange-list:healthy-fats', [
  { id: 'almond', ar: 'لوز', en: 'Almonds', ref: 20, subGroup: 'group-1' },
  { id: 'cashew', ar: 'كاجو', en: 'Cashews', ref: 20, subGroup: 'group-1' },
  { id: 'hazelnut', ar: 'بندق', en: 'Hazelnuts', ref: 20, subGroup: 'group-1' },
  { id: 'peanut', ar: 'فول سوداني', en: 'Peanuts', ref: 20, subGroup: 'group-1' },
  { id: 'pecan', ar: 'بيكان', en: 'Pecans', ref: 20, subGroup: 'group-1' },
  { id: 'pistachio', ar: 'فستق', en: 'Pistachios', ref: 20, subGroup: 'group-1' },
  { id: 'olive-oil', ar: 'زيت زيتون', en: 'Olive oil', ref: 3, unit: 'tsp', subGroup: 'group-1' },
  { id: 'black-olives', ar: 'زيتون أسود', en: 'Black olives', ref: 15, subGroup: 'group-1' },
  { id: 'avocado', ar: 'أفوكادو', en: 'Avocado', ref: 60, subGroup: 'group-1' },
  { id: 'walnut', ar: 'عين جمل', en: 'Walnuts', ref: 20, subGroup: 'group-2' },
  { id: 'vegetable-oil', ar: 'زيت نباتي', en: 'Vegetable oil', ref: 3, unit: 'tsp', subGroup: 'group-2' },
  { id: 'flaxseed', ar: 'بذور كتان', en: 'Flaxseed', ref: 20, subGroup: 'group-2' },
  { id: 'chia', ar: 'بذور شيا', en: 'Chia seeds', ref: 20, subGroup: 'group-2' },
  { id: 'butter', ar: 'زبد طبيعي', en: 'Butter', ref: 15, subGroup: 'group-3' },
  { id: 'margarine', ar: 'زبد صناعي', en: 'Margarine', ref: 15, subGroup: 'group-3' },
  { id: 'coconut-oil', ar: 'زيت جوز هند', en: 'Coconut oil', ref: 3, unit: 'tsp', subGroup: 'group-3' },
])

const fruit = table('fruit', 'exchange-list:fruit', [
  { id: 'watermelon', ar: 'بطيخ', en: 'Watermelon', ref: 200 },
  { id: 'apple', ar: 'تفاح', en: 'Apple', ref: 100 },
  { id: 'pear', ar: 'كمثرى', en: 'Pear', ref: 100 },
  { id: 'cape-gooseberry', ar: 'حرنكش', en: 'Cape gooseberry', ref: 85 },
  { id: 'mandarin', ar: 'يوسفي', en: 'Mandarin', ref: 100 },
  { id: 'prickly-pear', ar: 'تين شوكي', en: 'Prickly pear', ref: 100 },
  { id: 'berries', ar: 'توت', en: 'Berries', ref: 85 },
  { id: 'persimmon', ar: 'كاكا', en: 'Persimmon', ref: 65 },
  { id: 'barshoumi-fig', ar: 'تين برشومي', en: 'Barshoumi fig', ref: 85 },
  { id: 'orange', ar: 'برتقال', en: 'Orange', ref: 100 },
  { id: 'strawberry', ar: 'فراولة', en: 'Strawberries', ref: 200 },
  { id: 'mango', ar: 'مانجا', en: 'Mango', ref: 100 },
  { id: 'kiwi', ar: 'كيوي', en: 'Kiwi', ref: 100 },
  { id: 'pineapple', ar: 'أناناس', en: 'Pineapple', ref: 100 },
  { id: 'grapes', ar: 'عنب', en: 'Grapes', ref: 80 },
  { id: 'plum', ar: 'برقوق', en: 'Plum', ref: 85 },
  { id: 'guava', ar: 'جوافة', en: 'Guava', ref: 100 },
  { id: 'sweet-melon', ar: 'شمام', en: 'Sweet melon', ref: 200 },
  { id: 'cantaloupe', ar: 'كانتلوب', en: 'Cantaloupe', ref: 200 },
  { id: 'peach', ar: 'خوخ', en: 'Peach', ref: 100 },
  { id: 'pomegranate', ar: 'رمان', en: 'Pomegranate', ref: 85 },
  { id: 'apricot', ar: 'مشمش', en: 'Apricot', ref: 100 },
  { id: 'dates', ar: 'بلح', en: 'Dates', ref: 20 },
  { id: 'banana', ar: 'موز', en: 'Banana', ref: 60 },
  { id: 'raisins', ar: 'زبيب', en: 'Raisins', ref: 20 },
  { id: 'prunes', ar: 'قراصيا', en: 'Prunes', ref: 20 },
  { id: 'dried-figs', ar: 'تين مجفف', en: 'Dried figs', ref: 25 },
  { id: 'dried-apricot', ar: 'مشمش مجفف', en: 'Dried apricot', ref: 20 },
])

const vegetable = table('vegetable', 'exchange-list:vegetables', [
  { id: 'bell-pepper', ar: 'فلفل ألوان', en: 'Bell peppers', ref: 50 },
  { id: 'lettuce', ar: 'خس', en: 'Lettuce', ref: 100 },
  { id: 'cucumber', ar: 'خيار', en: 'Cucumber', ref: 100 },
  { id: 'zucchini', ar: 'كوسة', en: 'Zucchini', ref: 50 },
  { id: 'okra', ar: 'بامية', en: 'Okra', ref: 50 },
  { id: 'arugula', ar: 'جرجير', en: 'Arugula', ref: 100 },
  { id: 'eggplant', ar: 'باذنجان', en: 'Eggplant', ref: 150 },
  { id: 'green-beans', ar: 'فاصوليا خضراء', en: 'Green beans', ref: 50 },
  { id: 'carrot', ar: 'جزر', en: 'Carrot', ref: 50 },
  { id: 'cauliflower', ar: 'قرنبيط', en: 'Cauliflower', ref: 100 },
  { id: 'beetroot', ar: 'بنجر', en: 'Beetroot', ref: 50 },
  { id: 'tomato', ar: 'طماطم', en: 'Tomato', ref: 100 },
  { id: 'mushroom', ar: 'مشروم', en: 'Mushrooms', ref: 100 },
  { id: 'artichoke', ar: 'خرشوف', en: 'Artichoke', ref: 50 },
  { id: 'broccoli', ar: 'بروكلي', en: 'Broccoli', ref: 50 },
  { id: 'molokhia', ar: 'ملوخية', en: 'Molokhia', ref: 50 },
  { id: 'spinach', ar: 'سبانخ', en: 'Spinach', ref: 100 },
])

const dairy = table('dairy', 'exchange-list:dairy', [
  { id: 'milk-powder', ar: 'لبن بودرة', en: 'Milk powder', ref: 30 },
  { id: 'whole-milk', ar: 'لبن كامل الدسم', en: 'Whole milk', ref: 240 },
  { id: 'whole-yogurt', ar: 'زبادي كامل الدسم', en: 'Whole yogurt', ref: 240 },
  { id: 'skim-milk', ar: 'لبن خالي الدسم', en: 'Skim milk', ref: 240 },
])

/** Weighed before cooking. */
const legume = table('legume', 'exchange-list:legumes', [
  { id: 'chickpeas', ar: 'حمص', en: 'Chickpeas', ref: 25 },
  { id: 'lentils', ar: 'عدس', en: 'Lentils', ref: 30 },
  { id: 'red-kidney-beans', ar: 'فاصوليا حمراء', en: 'Red kidney beans', ref: 30 },
  { id: 'white-beans', ar: 'فاصوليا بيضاء', en: 'White beans', ref: 30 },
  { id: 'black-eyed-peas', ar: 'لوبيا', en: 'Black eyed peas', ref: 30 },
  { id: 'fava-beans', ar: 'فول', en: 'Fava beans', ref: 30 },
  { id: 'lupini', ar: 'ترمس', en: 'Lupini beans', ref: 50 },
  { id: 'green-peas', ar: 'بسلة', en: 'Green peas', ref: 30 },
])

/**
 * Items the plan names that have no row in any exchange table. They are
 * tracked and logged like anything else but cannot be swapped, because the
 * coach never published an equivalent portion for them. Giving them a
 * reference would mean inventing data.
 */
const planOnly = table('other', 'plan:no-exchange-row', [
  { id: 'mixed-salad', ar: 'سلطة', en: 'Mixed salad', ref: null },
  {
    id: 'beetroot-salad',
    ar: 'سلطة شمندر وطماطم وخيار وجزر وليمون',
    en: 'Beetroot, tomato, cucumber, carrot and lemon salad',
    ref: null,
  },
  { id: 'orange-juice', ar: 'عصير برتقال طبيعي', en: 'Fresh orange juice', ref: null },
  {
    id: 'foul-medames',
    ar: 'فول مدمس بالخلطة المصرية',
    en: 'Foul medames, Egyptian style',
    ref: null,
    note: 'The legume table lists dry fava beans before cooking, which is a different measure from cooked foul.',
  },
  {
    id: 'skim-yogurt',
    ar: 'زبادي خالي الدسم',
    en: 'Skim yogurt',
    ref: null,
    note: 'The dairy table lists skim milk and whole yogurt, but no skim yogurt row.',
  },
  { id: 'ketchup-light', ar: 'كاتشب لايت', en: 'Light ketchup', ref: null },
  { id: 'mayonnaise-light', ar: 'مايونيز لايت', en: 'Light mayonnaise', ref: null },
  { id: 'turkish-coffee', ar: 'قهوة تركي سادة أو بسكر دايت', en: 'Turkish coffee, plain or with sweetener', ref: null },
])

export const SEED_FOODS: readonly Food[] = [
  ...protein,
  ...carb,
  ...fat,
  ...fruit,
  ...vegetable,
  ...dairy,
  ...legume,
  ...planOnly,
]
