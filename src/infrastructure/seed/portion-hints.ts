import type { PortionHint } from '@/domain/model/portion-hint'
import { quantity } from '@/domain/model/quantity'

/**
 * Everyday size references, so a banana or an egg can be logged without a
 * scale.
 *
 * None of this comes from the coach's files. The plan and the exchange tables
 * are written in grams and contain no piece weights, so these are the standard
 * edible portion weights published by the USDA FoodData Central legacy portion
 * tables, marked `usda`. A few common Egyptian items have no published weight;
 * those are marked `estimate` and the screen labels them as approximate.
 *
 * Weights are for the part that is eaten: fruit is peeled where you would peel
 * it, eggs are without the shell.
 */
export const PORTION_HINTS: readonly PortionHint[] = [
  // Eggs, without shell.
  hint('whole-egg', 'بيضة متوسطة', 'Medium egg', 44),
  hint('whole-egg', 'بيضة كبيرة', 'Large egg', 50),
  hint('whole-egg', 'بيضة كبيرة جدا', 'Extra large egg', 56),
  hint('egg-white', 'بياض بيضة كبيرة', 'White of one large egg', 33),

  // Fruit, peeled where you would peel it.
  hint('banana', 'موزة صغيرة', 'Small banana', 101),
  hint('banana', 'موزة متوسطة', 'Medium banana', 118),
  hint('banana', 'موزة كبيرة', 'Large banana', 136),
  hint('apple', 'تفاحة صغيرة', 'Small apple', 149),
  hint('apple', 'تفاحة متوسطة', 'Medium apple', 182),
  hint('apple', 'تفاحة كبيرة', 'Large apple', 223),
  hint('orange', 'برتقالة صغيرة', 'Small orange', 96),
  hint('orange', 'برتقالة متوسطة', 'Medium orange', 131),
  hint('orange', 'برتقالة كبيرة', 'Large orange', 184),
  hint('mandarin', 'يوسفية متوسطة', 'Medium mandarin', 88),
  hint('mango', 'كوب مانجو مكعبات', 'One cup of diced mango', 165),
  hint('mango', 'مانجة متوسطة', 'Medium mango', 200, 'estimate'),
  hint('grapes', 'عشر حبات عنب', 'Ten grapes', 49),
  hint('grapes', 'كوب عنب', 'One cup of grapes', 151),
  hint('dates', 'تمرة', 'One date', 8, 'estimate'),
  hint('dates', 'تمرة مجهول', 'One medjool date', 24),
  hint('kiwi', 'كيوية متوسطة', 'Medium kiwi', 69),
  hint('peach', 'خوخة متوسطة', 'Medium peach', 150),
  hint('plum', 'برقوقة متوسطة', 'Medium plum', 66),
  hint('apricot', 'مشمشة', 'One apricot', 35),
  hint('guava', 'جوافة متوسطة', 'Medium guava', 55),
  hint('strawberry', 'كوب فراولة', 'One cup of strawberries', 152),
  hint('watermelon', 'كوب بطيخ مكعبات', 'One cup of diced watermelon', 152),
  hint('cantaloupe', 'كوب كانتلوب مكعبات', 'One cup of diced cantaloupe', 160),
  hint('avocado', 'أفوكادو متوسطة', 'Medium avocado', 201),

  // Vegetables.
  hint('cucumber', 'خيارة صغيرة', 'Small cucumber', 158),
  hint('cucumber', 'خيارة متوسطة', 'Medium cucumber', 201),
  hint('tomato', 'طماطمة صغيرة', 'Small tomato', 91),
  hint('tomato', 'طماطمة متوسطة', 'Medium tomato', 123),
  hint('tomato', 'طماطمة كبيرة', 'Large tomato', 182),
  hint('carrot', 'جزرة متوسطة', 'Medium carrot', 61),
  hint('bell-pepper', 'فلفل ألوان متوسط', 'Medium bell pepper', 119),

  // Starches.
  hint('potato', 'بطاطسة صغيرة', 'Small potato', 170),
  hint('potato', 'بطاطسة متوسطة', 'Medium potato', 213),
  hint('potato', 'بطاطسة كبيرة', 'Large potato', 369),
  hint('sweet-potato', 'بطاطا متوسطة', 'Medium sweet potato', 130),
  hint('corn-cob', 'كوز ذرة متوسط', 'Medium ear of corn', 103),
  hint('oats', 'نصف كوب شوفان', 'Half a cup of dry oats', 40),
  hint('oats', 'كوب شوفان', 'One cup of dry oats', 81),

  // Bread, weighed as sold. Egyptian loaves have no published weight, so these
  // are estimates from common bakery sizes and should be checked on a scale once.
  hint('baladi-bread', 'رغيف بلدي', 'One baladi loaf', 90, 'estimate'),
  hint('shami-bread', 'رغيف شامي', 'One shami loaf', 65, 'estimate'),
  hint('fino-bread', 'عيش فينو', 'One fino roll', 60, 'estimate'),
  hint('brown-toast', 'شريحة توست', 'One slice of toast', 28),
  hint('white-toast', 'شريحة توست', 'One slice of toast', 28),
  hint('rusk', 'قطعة بقسماط', 'One rusk', 10, 'estimate'),

  // Dairy, by cup.
  hint('skim-milk', 'كوب لبن', 'One cup of milk', 244),
  hint('whole-milk', 'كوب لبن', 'One cup of milk', 244),
  hint('skim-yogurt', 'كوب زبادي', 'One cup of yogurt', 245),
  hint('whole-yogurt', 'كوب زبادي', 'One cup of yogurt', 245),

  // Fats. The exchange table measures oil in small spoons while the plan writes
  // it in grams, so both units are covered and the screen shows whichever fits.
  hint('olive-oil', 'ملعقة صغيرة', 'One teaspoon', 4.5),
  hint('olive-oil', 'ملعقة كبيرة', 'One tablespoon', 13.5),
  hint('olive-oil', 'ملعقة كبيرة', 'One tablespoon', 3, 'usda', 'tsp'),
  hint('vegetable-oil', 'ملعقة صغيرة', 'One teaspoon', 4.5),
  hint('vegetable-oil', 'ملعقة كبيرة', 'One tablespoon', 13.5),
  hint('vegetable-oil', 'ملعقة كبيرة', 'One tablespoon', 3, 'usda', 'tsp'),
  hint('butter', 'ملعقة كبيرة زبدة', 'One tablespoon of butter', 14),
  hint('almond', 'عشر لوزات', 'Ten almonds', 12),
  hint('peanut', 'ملعقة كبيرة فول سوداني', 'One tablespoon of peanuts', 9),
  hint('walnut', 'سبع أنصاف عين جمل', 'Seven walnut halves', 14),
  hint('black-olives', 'خمس زيتونات', 'Five olives', 17),

  // Protein, cooked and boneless, as the coach asks for it.
  hint('poultry-breast', 'نصف صدر دجاج بعد الطهي', 'Half a chicken breast, cooked', 120, 'estimate'),
  hint('tuna', 'علبة تونة مصفاة', 'One drained tin of tuna', 120, 'estimate'),
  hint('cottage-cheese', 'كوب جبنة قريش', 'One cup of cottage cheese', 226),
]

function hint(
  foodId: string,
  labelAr: string,
  labelEn: string,
  amount: number,
  source: PortionHint['source'] = 'usda',
  unit: 'g' | 'tsp' = 'g',
): PortionHint {
  return { foodId, labelAr, labelEn, quantity: quantity(amount, unit), source }
}
