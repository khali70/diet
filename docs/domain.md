# Diet domain

Extracted from `source-pdfs/diet-plan.pdf` (the personal plan) and `source-pdfs/food-exchange-list.pdf` (the coach's exchange tables). Raw text dumps sit beside them. Where the extracted Arabic is garbled, this file marks it `NEEDS VERIFY` and the PDF page wins.

## 1. Daily targets

Whole day: 2705.41 kcal, protein 145.05 g, carbs 416.34 g, fat 54.69 g.

These are the only nutrition numbers in either PDF. There are no per-food calories. Tracking is therefore **portion and exchange based**, not calorie based. Any per-food kcal or macro figure would be invented data, and inventing it is forbidden unless the user explicitly opts in to an approximate external table, in which case it must be visibly labelled as an estimate and must never be presented as the coach's numbers.

## 2. Plan slots

Six slots per day.

### Breakfast
- بيض كامل, 150 g
- سلطة, 100 g
- عصير برتقال طبيعي, 250 g
- فول مدمس بالخلطة المصرية, 100 g
- خبز بلدي مصري, 60 g

### Lunch
- أرز أبيض, 150 g. Alternative given in the plan: مكرونة نية 150 g.
- زيت زيتون, 5 g
- سلطة شمندر وطماطم وخيار وجزر وليمون, 100 g
- صدر دجاج مشوي (لحم فقط), 150 g. Alternatives given in the plan: بوري مشوي 180 g, سمك بلطي مشوي 300 g, كبدة بقري 150 g, كبدة دجاج 180 g, لحم بقري مشوي بدون دهون 150 g.
- كاتشب لايت, 20 g
- مايونيز لايت, 10 g

### Snack
- زبادي خالي الدسم, 100 g
- مانجو, 150 g. Alternatives given in the plan: العنب الأحمر 130 g, تفاح 170 g, موز 100 g.

### Dinner
- خيار, 100 g
- جبنة قريش, 150 g
- توست بني, 60 g

### Before workout
- موز, 100 g
- قهوة تركي سادة أو بسكر دايت, 100 g

### After workout
- لبن خالي من الدسم, 300 g
- الشوفان, 100 g
- بلح أو تمر مجفف, 40 g
- Note from the plan: this may be drunk in two parts.

Note the plan's own per-item alternatives are a separate, narrower list from the global exchange tables in section 4. Both must be offered, and the plan's own list should rank first.

## 3. Plan rules

- Weigh carbohydrates (rice, potato, oats and so on) **before** cooking.
- Weigh protein **after** cooking, with no skin, fat, or bone.
- Cooking method: grilled, boiled, microwaved, or steamed. No added fat unless the plan specifies an oil amount. Otherwise use spray oil or non-stick.
- Fats and oils are allowed only when written into the plan, at exactly the written amount.
- White sugar forbidden. Zero calorie sweeteners such as stevia or sorbitol are allowed. Brown sugar and fructose are not diet sugar, they carry the same calories.
- Vegetables are effectively free and may be added freely.
- Salt is not to be cut. About one level teaspoon per day for all cooking, unless the coach says otherwise.
- Spices allowed and encouraged.
- Herbal drinks (cinnamon, ginger, mint, anise) allowed without sugar or with diet sugar.
- Zero calorie sauces allowed, for example mustard and the Naturista range.
- Zero calorie soft drinks allowed.
- Tea and coffee allowed in moderation, maximum 3 cups of tea or 3 coffees per day.
- Nuts and seeds are calorie dense and must be counted, not snacked on freely. The PDF's example: 10 g almonds is about 70 kcal.
- Fast food only inside a cheat meal, and the plan warns against it.
- There is **no free day**. One cheat meal is permitted at the end of the plan period, typically 15 days, and only on the coach's instruction.
- A cheat meal should be protein led (kebab, kofta, fish, burger). Sweets are discouraged, and if eaten should follow the protein and be small.

## 4. Exchange tables

Within a category, every listed portion is equivalent to every other listed portion. Swapping across categories is not supported.

Conversion rule, printed in the PDF:

```
targetQty = plannedQty * (referenceQty(target) / referenceQty(source))
```

Worked example from the PDF, which must exist as a unit test: rice reference 60 g, potato reference 260 g, planned 100 g rice, so potato = 100 * 260 / 60 = 433.3, printed in the PDF as 435 g. The engine computes the exact value; rounding and display precision is a presentation concern and the test asserts the exact ratio, not the PDF's rounded print.

### Protein (weigh after cooking, no fat or skin)
بياض بيض 300, جبن قريش 200, سمك سالمون 120, سمك ماكريل 120 `NEEDS VERIFY (raw text reads "سمك مكرونه")`, سمك بلطي 120, سمك سردين 120, سمك بوري 120, سمك فيليه 120, جمبري 100, كبدة 130, تونة 100, لحم صدور 120, كبدة دجاج 120, لحم أرانب 100, لحم أحمر 120, بيض كامل 250, لحم وراك 100, فيتا لايت 150, صدور رومي 120 `NEEDS VERIFY (raw text reads "فصوص رومي")`, روست بيف 120. All grams.

The raw dump lists سمك بوري twice; one of the two is a different fish and must be read off the PDF page. `NEEDS VERIFY`

### Carbohydrates (weigh before cooking)
كورن فليكس 55, مكرونة أو شعرية 65, أرز 60, برغل 60, فريك 60, فينو 90, خبز شامي 85, خبز بلدي 100, كيزر 90, توست أبيض 90, توست أسمر 90, كوز ذرة مشوي 90, بطاطس 260, قلقاس 180, بطاطا 260, كينوا 60, شوفان 60, بقسماط 60, بليلة 60, ذرة أو فشار 65, تورتيلا 80. All grams.

### Healthy fats (prefer swapping inside the same sub group)
- Group 1: لوز 20, كاجو 20, بندق 20, فول سوداني 20, بيكان 20, فستق 20 `NEEDS VERIFY (raw text reads "فصدق")`, زيت زيتون 3 small spoons, زيتون أسود 15, أفوكادو 60.
- Group 2: عين جمل 20, زيت نباتي 3 small spoons, بذور كتان 20, بذور شيا 20.
- Group 3: زبد طبيعي 15 g or 3 small spoons, زبد صناعي 15, زيت جوز هند 3 small spoons.

Note two different units appear in this category (grams and small spoons). The domain model must carry a unit on every quantity and refuse to convert across incompatible units without an explicit gram equivalence.

### Fruit (weigh before preparation)
بطيخ 200, تفاح 100, كمثرى 100, حرنكش 85, يوسفي 100, تين شوكي 100, توت 85, كاكا 65, تين برشومي 85, برتقال 100, فراولة 200, مانجا 100, كيوي 100, أناناس 100, عنب 80, برقوق 85, جوافة 100, شمام 200, كانتلوب 200, خوخ 100, رمان 85, مشمش 100, بلح 20, موز 60. Dried fruit: زبيب 20, قراصيا 20, تين 25, مشمش 20. All grams.

### Vegetables
فلفل ألوان 50, خس 100, خيار 100, كوسة 50, بامية 50, جرجير 100, باذنجان 150, فاصوليا خضراء 50, جزر 50, قرنبيط 100, بنجر 50, طماطم 100, مشروم 100, خرشوف 50, بروكلي 50, ملوخية 50, سبانخ 100. All grams.

### Dairy
لبن بودرة 30, لبن كامل الدسم 240, زبادي كامل الدسم 240, لبن خالي الدسم 240. All grams. The PDF advises sticking to the dairy type written in the plan rather than swapping freely.

### Legumes (weigh before cooking)
حمص 25, عدس 30, فاصوليا حمراء 30, فاصوليا بيضاء 30, لوبيا 30, فول 30, ترمس 50, بسلة 30. All grams.

## 5. Cardio

Treadmill, 30 minutes, 5 days a week, heart rate 95 to 120 bpm, 8000 to 10000 steps per day including rest days.

## 6. Open product decision

Whether the app shows estimated calories at all is still undecided by the user. Until they decide, build exchange-first. If estimates are later added, they go behind a flag, live in their own module, and never overwrite or blend with the coach's numbers.

## Everyday portion sizes (not from the coach)

The plan and the exchange tables are written in grams and contain no piece
weights, so there is no way to log "one banana" from the source files alone.
`src/infrastructure/seed/portion-hints.ts` adds everyday size references on top:
a medium banana, a large egg, a slice of toast, a cup of milk.

These are separate from the coach's data and are marked as such:

- `source: 'usda'` are edible portion weights from the USDA FoodData Central
  legacy portion tables, for example a medium banana at 118 g and a large egg
  at 50 g without the shell.
- `source: 'estimate'` are common local sizes with no published weight, for
  example an Egyptian baladi loaf at roughly 90 g. The app labels these as
  approximate, and they are worth checking on a scale once.

They are hints for the amount field only. Nothing is logged from a hint without
the user confirming it, and no hint carries a calorie or macro figure, because
the source files contain none.
