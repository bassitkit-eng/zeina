-- Zeina: seed Egypt governorates and cities
-- Run this in Supabase SQL Editor.
-- Safe to run multiple times.

begin;

with gov_data(name_ar, name_en) as (
  values
    ('القاهرة', 'Cairo'),
    ('الجيزة', 'Giza'),
    ('القليوبية', 'Qalyubia'),
    ('الإسكندرية', 'Alexandria'),
    ('البحيرة', 'Beheira'),
    ('مطروح', 'Matrouh'),
    ('كفر الشيخ', 'Kafr El Sheikh'),
    ('الغربية', 'Gharbia'),
    ('المنوفية', 'Monufia'),
    ('الدقهلية', 'Dakahlia'),
    ('دمياط', 'Damietta'),
    ('بورسعيد', 'Port Said'),
    ('الإسماعيلية', 'Ismailia'),
    ('السويس', 'Suez'),
    ('الشرقية', 'Sharqia'),
    ('شمال سيناء', 'North Sinai'),
    ('جنوب سيناء', 'South Sinai'),
    ('الفيوم', 'Faiyum'),
    ('بني سويف', 'Beni Suef'),
    ('المنيا', 'Minya'),
    ('أسيوط', 'Asyut'),
    ('سوهاج', 'Sohag'),
    ('قنا', 'Qena'),
    ('الأقصر', 'Luxor'),
    ('أسوان', 'Aswan'),
    ('البحر الأحمر', 'Red Sea'),
    ('الوادي الجديد', 'New Valley')
)
update public.governorates g
set
  name_ar = d.name_ar,
  name_en = d.name_en
from gov_data d
where lower(coalesce(g.name_en, '')) = lower(d.name_en)
   or coalesce(g.name_ar, '') = d.name_ar;

with gov_data(name_ar, name_en) as (
  values
    ('القاهرة', 'Cairo'),
    ('الجيزة', 'Giza'),
    ('القليوبية', 'Qalyubia'),
    ('الإسكندرية', 'Alexandria'),
    ('البحيرة', 'Beheira'),
    ('مطروح', 'Matrouh'),
    ('كفر الشيخ', 'Kafr El Sheikh'),
    ('الغربية', 'Gharbia'),
    ('المنوفية', 'Monufia'),
    ('الدقهلية', 'Dakahlia'),
    ('دمياط', 'Damietta'),
    ('بورسعيد', 'Port Said'),
    ('الإسماعيلية', 'Ismailia'),
    ('السويس', 'Suez'),
    ('الشرقية', 'Sharqia'),
    ('شمال سيناء', 'North Sinai'),
    ('جنوب سيناء', 'South Sinai'),
    ('الفيوم', 'Faiyum'),
    ('بني سويف', 'Beni Suef'),
    ('المنيا', 'Minya'),
    ('أسيوط', 'Asyut'),
    ('سوهاج', 'Sohag'),
    ('قنا', 'Qena'),
    ('الأقصر', 'Luxor'),
    ('أسوان', 'Aswan'),
    ('البحر الأحمر', 'Red Sea'),
    ('الوادي الجديد', 'New Valley')
)
insert into public.governorates (name_ar, name_en)
select d.name_ar, d.name_en
from gov_data d
where not exists (
  select 1
  from public.governorates g
  where lower(coalesce(g.name_en, '')) = lower(d.name_en)
     or coalesce(g.name_ar, '') = d.name_ar
);

with city_data(governorate_en, name_ar, name_en) as (
  values
    ('Cairo', 'مدينة نصر', 'Nasr City'),
    ('Cairo', 'مصر الجديدة', 'Heliopolis'),
    ('Cairo', 'المعادي', 'Maadi'),
    ('Cairo', 'التجمع الخامس', 'Fifth Settlement'),
    ('Cairo', 'حلوان', 'Helwan'),
    ('Cairo', 'شبرا', 'Shubra'),
    ('Cairo', 'الزيتون', 'El Zeitoun'),
    ('Cairo', 'عين شمس', 'Ain Shams'),
    ('Cairo', 'المقطم', 'Mokattam'),

    ('Giza', 'الدقي', 'Dokki'),
    ('Giza', 'المهندسين', 'Mohandessin'),
    ('Giza', 'العجوزة', 'Agouza'),
    ('Giza', 'الهرم', 'Haram'),
    ('Giza', 'فيصل', 'Faisal'),
    ('Giza', '6 أكتوبر', '6th of October'),
    ('Giza', 'الشيخ زايد', 'Sheikh Zayed'),
    ('Giza', 'بولاق الدكرور', 'Bulaq Dakrur'),
    ('Giza', 'العمرانية', 'Omraneya'),

    ('Alexandria', 'سيدي جابر', 'Sidi Gaber'),
    ('Alexandria', 'سموحة', 'Smouha'),
    ('Alexandria', 'العصافرة', 'Asafra'),
    ('Alexandria', 'محرم بك', 'Moharram Bek'),
    ('Alexandria', 'المنتزه', 'Montaza'),
    ('Alexandria', 'العجمي', 'Agami'),
    ('Alexandria', 'ميامي', 'Miami'),
    ('Alexandria', 'باكوس', 'Bacos'),

    ('Qalyubia', 'بنها', 'Banha'),
    ('Qalyubia', 'شبرا الخيمة', 'Shubra El Kheima'),
    ('Qalyubia', 'قليوب', 'Qalyub'),
    ('Qalyubia', 'القناطر الخيرية', 'Qanater'),
    ('Qalyubia', 'طوخ', 'Toukh'),
    ('Qalyubia', 'الخانكة', 'El Khanka'),
    ('Qalyubia', 'كفر شكر', 'Kafr Shokr'),

    ('Beheira', 'دمنهور', 'Damanhour'),
    ('Beheira', 'كفر الدوار', 'Kafr El Dawar'),
    ('Beheira', 'رشيد', 'Rashid'),
    ('Beheira', 'إيتاي البارود', 'Itay El Barud'),
    ('Beheira', 'أبو حمص', 'Abu Hummus'),
    ('Beheira', 'إدكو', 'Edku'),

    ('Matrouh', 'مرسى مطروح', 'Marsa Matrouh'),
    ('Matrouh', 'الحمام', 'El Hammam'),
    ('Matrouh', 'الضبعة', 'El Dabaa'),
    ('Matrouh', 'العلمين', 'El Alamein'),
    ('Matrouh', 'سيوة', 'Siwa'),

    ('Kafr El Sheikh', 'كفر الشيخ', 'Kafr El Sheikh'),
    ('Kafr El Sheikh', 'دسوق', 'Desouk'),
    ('Kafr El Sheikh', 'فوه', 'Fouh'),
    ('Kafr El Sheikh', 'بلطيم', 'Baltim'),
    ('Kafr El Sheikh', 'سيدي سالم', 'Sidi Salem'),
    ('Kafr El Sheikh', 'بيلا', 'Bila'),

    ('Gharbia', 'طنطا', 'Tanta'),
    ('Gharbia', 'المحلة الكبرى', 'Mahalla'),
    ('Gharbia', 'زفتى', 'Zefta'),
    ('Gharbia', 'كفر الزيات', 'Kafr El Zayat'),
    ('Gharbia', 'قطور', 'Qutur'),
    ('Gharbia', 'السنطة', 'El Santa'),

    ('Monufia', 'شبين الكوم', 'Shibin El Kom'),
    ('Monufia', 'منوف', 'Menouf'),
    ('Monufia', 'السادات', 'Sadat'),
    ('Monufia', 'أشمون', 'Ashmoun'),
    ('Monufia', 'قويسنا', 'Quesna'),
    ('Monufia', 'بركة السبع', 'Berket El Sab'),

    ('Dakahlia', 'المنصورة', 'Mansoura'),
    ('Dakahlia', 'ميت غمر', 'Meet Ghamr'),
    ('Dakahlia', 'طلخا', 'Talkha'),
    ('Dakahlia', 'بلقاس', 'Belqas'),
    ('Dakahlia', 'السنبلاوين', 'Sinbillawin'),
    ('Dakahlia', 'دكرنس', 'Dekernes'),

    ('Damietta', 'دمياط', 'Damietta'),
    ('Damietta', 'رأس البر', 'Ras El Bar'),
    ('Damietta', 'فارسكور', 'Farskur'),
    ('Damietta', 'كفر سعد', 'Kafr Saad'),
    ('Damietta', 'الزرقا', 'El Zarqa'),
    ('Damietta', 'دمياط الجديدة', 'New Damietta'),

    ('Port Said', 'حي الشرق', 'Sharq District'),
    ('Port Said', 'حي العرب', 'Arab District'),
    ('Port Said', 'بورفؤاد', 'Port Fouad'),
    ('Port Said', 'الزهور', 'Zohour'),
    ('Port Said', 'الضواحي', 'Dawahy'),
    ('Port Said', 'المناخ', 'Manakh'),

    ('Ismailia', 'الإسماعيلية', 'Ismailia'),
    ('Ismailia', 'فايد', 'Fayed'),
    ('Ismailia', 'القنطرة شرق', 'Qantara East'),
    ('Ismailia', 'القنطرة غرب', 'Qantara West'),
    ('Ismailia', 'التل الكبير', 'Tell El Kebir'),
    ('Ismailia', 'أبو صوير', 'Abu Suwir'),

    ('Suez', 'الأربعين', 'Arbaeen'),
    ('Suez', 'السويس', 'Suez'),
    ('Suez', 'عتاقة', 'Ataqa'),
    ('Suez', 'الجناين', 'Ganayen'),
    ('Suez', 'فيصل', 'Faisal'),

    ('Sharqia', 'الزقازيق', 'Zagazig'),
    ('Sharqia', 'العاشر من رمضان', '10th of Ramadan'),
    ('Sharqia', 'بلبيس', 'Belbeis'),
    ('Sharqia', 'فاقوس', 'Faqous'),
    ('Sharqia', 'أبو كبير', 'Abu Kebir'),
    ('Sharqia', 'منيا القمح', 'Minya El Qamh'),

    ('North Sinai', 'العريش', 'Arish'),
    ('North Sinai', 'بئر العبد', 'Bir El Abd'),
    ('North Sinai', 'الشيخ زويد', 'Sheikh Zuweid'),
    ('North Sinai', 'رفح', 'Rafah'),
    ('North Sinai', 'الحسنة', 'El Hassana'),

    ('South Sinai', 'شرم الشيخ', 'Sharm El Sheikh'),
    ('South Sinai', 'الطور', 'El Tor'),
    ('South Sinai', 'دهب', 'Dahab'),
    ('South Sinai', 'نويبع', 'Nuweiba'),
    ('South Sinai', 'سانت كاترين', 'Saint Catherine'),
    ('South Sinai', 'رأس سدر', 'Ras Sedr'),

    ('Faiyum', 'الفيوم', 'Faiyum'),
    ('Faiyum', 'سنورس', 'Sinnuris'),
    ('Faiyum', 'إطسا', 'Itsa'),
    ('Faiyum', 'طامية', 'Tamiya'),
    ('Faiyum', 'أبشواي', 'Abshaway'),
    ('Faiyum', 'يوسف الصديق', 'Youssef El Seddik'),

    ('Beni Suef', 'بني سويف', 'Beni Suef'),
    ('Beni Suef', 'الواسطى', 'El Wasta'),
    ('Beni Suef', 'ناصر', 'Nasser'),
    ('Beni Suef', 'إهناسيا', 'Ehnasia'),
    ('Beni Suef', 'ببا', 'Biba'),
    ('Beni Suef', 'سمسطا', 'Somosta'),

    ('Minya', 'المنيا', 'Minya'),
    ('Minya', 'ملوي', 'Mallawi'),
    ('Minya', 'سمالوط', 'Samalut'),
    ('Minya', 'بني مزار', 'Beni Mazar'),
    ('Minya', 'أبو قرقاص', 'Abu Qurqas'),
    ('Minya', 'مطاي', 'Mattai'),

    ('Asyut', 'أسيوط', 'Asyut'),
    ('Asyut', 'ديروط', 'Dayrout'),
    ('Asyut', 'منفلوط', 'Manfalut'),
    ('Asyut', 'أبنوب', 'Abnoub'),
    ('Asyut', 'القوصية', 'El Qusiya'),
    ('Asyut', 'أبو تيج', 'Abu Tig'),

    ('Sohag', 'سوهاج', 'Sohag'),
    ('Sohag', 'أخميم', 'Akhmim'),
    ('Sohag', 'جرجا', 'Girga'),
    ('Sohag', 'طهطا', 'Tahta'),
    ('Sohag', 'البلينا', 'El Balyana'),
    ('Sohag', 'المراغة', 'El Maragha'),

    ('Qena', 'قنا', 'Qena'),
    ('Qena', 'نجع حمادي', 'Nag Hammadi'),
    ('Qena', 'دشنا', 'Deshna'),
    ('Qena', 'قفط', 'Qift'),
    ('Qena', 'قوص', 'Qus'),
    ('Qena', 'أبو تشت', 'Abu Tesht'),

    ('Luxor', 'الأقصر', 'Luxor'),
    ('Luxor', 'إسنا', 'Esna'),
    ('Luxor', 'أرمنت', 'Armant'),
    ('Luxor', 'القرنة', 'Qurna'),
    ('Luxor', 'البياضية', 'Al Bayadiyah'),
    ('Luxor', 'الزينية', 'Az Ziniyah'),

    ('Aswan', 'أسوان', 'Aswan'),
    ('Aswan', 'دراو', 'Daraw'),
    ('Aswan', 'كوم أمبو', 'Kom Ombo'),
    ('Aswan', 'إدفو', 'Edfu'),
    ('Aswan', 'نصر النوبة', 'Nasr El Nuba'),

    ('Red Sea', 'الغردقة', 'Hurghada'),
    ('Red Sea', 'سفاجا', 'Safaga'),
    ('Red Sea', 'القصير', 'Quseir'),
    ('Red Sea', 'مرسى علم', 'Marsa Alam'),
    ('Red Sea', 'رأس غارب', 'Ras Ghareb'),

    ('New Valley', 'الخارجة', 'Kharga'),
    ('New Valley', 'الداخلة', 'Dakhla'),
    ('New Valley', 'الفرافرة', 'Farafra'),
    ('New Valley', 'باريس', 'Paris'),
    ('New Valley', 'بلاط', 'Balat')
),
city_targets as (
  select
    g.id as governorate_id,
    c.name_ar,
    c.name_en
  from city_data c
  join public.governorates g
    on lower(g.name_en) = lower(c.governorate_en)
)
update public.cities city
set
  name_ar = t.name_ar,
  name_en = t.name_en
from city_targets t
where city.governorate_id = t.governorate_id
  and (
    city.name_ar = t.name_ar
    or lower(coalesce(city.name_en, '')) = lower(t.name_en)
  );

with city_data(governorate_en, name_ar, name_en) as (
  values
    ('Cairo', 'مدينة نصر', 'Nasr City'),
    ('Cairo', 'مصر الجديدة', 'Heliopolis'),
    ('Cairo', 'المعادي', 'Maadi'),
    ('Cairo', 'التجمع الخامس', 'Fifth Settlement'),
    ('Cairo', 'حلوان', 'Helwan'),
    ('Cairo', 'شبرا', 'Shubra'),
    ('Cairo', 'الزيتون', 'El Zeitoun'),
    ('Cairo', 'عين شمس', 'Ain Shams'),
    ('Cairo', 'المقطم', 'Mokattam'),
    ('Giza', 'الدقي', 'Dokki'),
    ('Giza', 'المهندسين', 'Mohandessin'),
    ('Giza', 'العجوزة', 'Agouza'),
    ('Giza', 'الهرم', 'Haram'),
    ('Giza', 'فيصل', 'Faisal'),
    ('Giza', '6 أكتوبر', '6th of October'),
    ('Giza', 'الشيخ زايد', 'Sheikh Zayed'),
    ('Giza', 'بولاق الدكرور', 'Bulaq Dakrur'),
    ('Giza', 'العمرانية', 'Omraneya'),
    ('Alexandria', 'سيدي جابر', 'Sidi Gaber'),
    ('Alexandria', 'سموحة', 'Smouha'),
    ('Alexandria', 'العصافرة', 'Asafra'),
    ('Alexandria', 'محرم بك', 'Moharram Bek'),
    ('Alexandria', 'المنتزه', 'Montaza'),
    ('Alexandria', 'العجمي', 'Agami'),
    ('Alexandria', 'ميامي', 'Miami'),
    ('Alexandria', 'باكوس', 'Bacos'),
    ('Qalyubia', 'بنها', 'Banha'),
    ('Qalyubia', 'شبرا الخيمة', 'Shubra El Kheima'),
    ('Qalyubia', 'قليوب', 'Qalyub'),
    ('Qalyubia', 'القناطر الخيرية', 'Qanater'),
    ('Qalyubia', 'طوخ', 'Toukh'),
    ('Qalyubia', 'الخانكة', 'El Khanka'),
    ('Qalyubia', 'كفر شكر', 'Kafr Shokr'),
    ('Beheira', 'دمنهور', 'Damanhour'),
    ('Beheira', 'كفر الدوار', 'Kafr El Dawar'),
    ('Beheira', 'رشيد', 'Rashid'),
    ('Beheira', 'إيتاي البارود', 'Itay El Barud'),
    ('Beheira', 'أبو حمص', 'Abu Hummus'),
    ('Beheira', 'إدكو', 'Edku'),
    ('Matrouh', 'مرسى مطروح', 'Marsa Matrouh'),
    ('Matrouh', 'الحمام', 'El Hammam'),
    ('Matrouh', 'الضبعة', 'El Dabaa'),
    ('Matrouh', 'العلمين', 'El Alamein'),
    ('Matrouh', 'سيوة', 'Siwa'),
    ('Kafr El Sheikh', 'كفر الشيخ', 'Kafr El Sheikh'),
    ('Kafr El Sheikh', 'دسوق', 'Desouk'),
    ('Kafr El Sheikh', 'فوه', 'Fouh'),
    ('Kafr El Sheikh', 'بلطيم', 'Baltim'),
    ('Kafr El Sheikh', 'سيدي سالم', 'Sidi Salem'),
    ('Kafr El Sheikh', 'بيلا', 'Bila'),
    ('Gharbia', 'طنطا', 'Tanta'),
    ('Gharbia', 'المحلة الكبرى', 'Mahalla'),
    ('Gharbia', 'زفتى', 'Zefta'),
    ('Gharbia', 'كفر الزيات', 'Kafr El Zayat'),
    ('Gharbia', 'قطور', 'Qutur'),
    ('Gharbia', 'السنطة', 'El Santa'),
    ('Monufia', 'شبين الكوم', 'Shibin El Kom'),
    ('Monufia', 'منوف', 'Menouf'),
    ('Monufia', 'السادات', 'Sadat'),
    ('Monufia', 'أشمون', 'Ashmoun'),
    ('Monufia', 'قويسنا', 'Quesna'),
    ('Monufia', 'بركة السبع', 'Berket El Sab'),
    ('Dakahlia', 'المنصورة', 'Mansoura'),
    ('Dakahlia', 'ميت غمر', 'Meet Ghamr'),
    ('Dakahlia', 'طلخا', 'Talkha'),
    ('Dakahlia', 'بلقاس', 'Belqas'),
    ('Dakahlia', 'السنبلاوين', 'Sinbillawin'),
    ('Dakahlia', 'دكرنس', 'Dekernes'),
    ('Damietta', 'دمياط', 'Damietta'),
    ('Damietta', 'رأس البر', 'Ras El Bar'),
    ('Damietta', 'فارسكور', 'Farskur'),
    ('Damietta', 'كفر سعد', 'Kafr Saad'),
    ('Damietta', 'الزرقا', 'El Zarqa'),
    ('Damietta', 'دمياط الجديدة', 'New Damietta'),
    ('Port Said', 'حي الشرق', 'Sharq District'),
    ('Port Said', 'حي العرب', 'Arab District'),
    ('Port Said', 'بورفؤاد', 'Port Fouad'),
    ('Port Said', 'الزهور', 'Zohour'),
    ('Port Said', 'الضواحي', 'Dawahy'),
    ('Port Said', 'المناخ', 'Manakh'),
    ('Ismailia', 'الإسماعيلية', 'Ismailia'),
    ('Ismailia', 'فايد', 'Fayed'),
    ('Ismailia', 'القنطرة شرق', 'Qantara East'),
    ('Ismailia', 'القنطرة غرب', 'Qantara West'),
    ('Ismailia', 'التل الكبير', 'Tell El Kebir'),
    ('Ismailia', 'أبو صوير', 'Abu Suwir'),
    ('Suez', 'الأربعين', 'Arbaeen'),
    ('Suez', 'السويس', 'Suez'),
    ('Suez', 'عتاقة', 'Ataqa'),
    ('Suez', 'الجناين', 'Ganayen'),
    ('Suez', 'فيصل', 'Faisal'),
    ('Sharqia', 'الزقازيق', 'Zagazig'),
    ('Sharqia', 'العاشر من رمضان', '10th of Ramadan'),
    ('Sharqia', 'بلبيس', 'Belbeis'),
    ('Sharqia', 'فاقوس', 'Faqous'),
    ('Sharqia', 'أبو كبير', 'Abu Kebir'),
    ('Sharqia', 'منيا القمح', 'Minya El Qamh'),
    ('North Sinai', 'العريش', 'Arish'),
    ('North Sinai', 'بئر العبد', 'Bir El Abd'),
    ('North Sinai', 'الشيخ زويد', 'Sheikh Zuweid'),
    ('North Sinai', 'رفح', 'Rafah'),
    ('North Sinai', 'الحسنة', 'El Hassana'),
    ('South Sinai', 'شرم الشيخ', 'Sharm El Sheikh'),
    ('South Sinai', 'الطور', 'El Tor'),
    ('South Sinai', 'دهب', 'Dahab'),
    ('South Sinai', 'نويبع', 'Nuweiba'),
    ('South Sinai', 'سانت كاترين', 'Saint Catherine'),
    ('South Sinai', 'رأس سدر', 'Ras Sedr'),
    ('Faiyum', 'الفيوم', 'Faiyum'),
    ('Faiyum', 'سنورس', 'Sinnuris'),
    ('Faiyum', 'إطسا', 'Itsa'),
    ('Faiyum', 'طامية', 'Tamiya'),
    ('Faiyum', 'أبشواي', 'Abshaway'),
    ('Faiyum', 'يوسف الصديق', 'Youssef El Seddik'),
    ('Beni Suef', 'بني سويف', 'Beni Suef'),
    ('Beni Suef', 'الواسطى', 'El Wasta'),
    ('Beni Suef', 'ناصر', 'Nasser'),
    ('Beni Suef', 'إهناسيا', 'Ehnasia'),
    ('Beni Suef', 'ببا', 'Biba'),
    ('Beni Suef', 'سمسطا', 'Somosta'),
    ('Minya', 'المنيا', 'Minya'),
    ('Minya', 'ملوي', 'Mallawi'),
    ('Minya', 'سمالوط', 'Samalut'),
    ('Minya', 'بني مزار', 'Beni Mazar'),
    ('Minya', 'أبو قرقاص', 'Abu Qurqas'),
    ('Minya', 'مطاي', 'Mattai'),
    ('Asyut', 'أسيوط', 'Asyut'),
    ('Asyut', 'ديروط', 'Dayrout'),
    ('Asyut', 'منفلوط', 'Manfalut'),
    ('Asyut', 'أبنوب', 'Abnoub'),
    ('Asyut', 'القوصية', 'El Qusiya'),
    ('Asyut', 'أبو تيج', 'Abu Tig'),
    ('Sohag', 'سوهاج', 'Sohag'),
    ('Sohag', 'أخميم', 'Akhmim'),
    ('Sohag', 'جرجا', 'Girga'),
    ('Sohag', 'طهطا', 'Tahta'),
    ('Sohag', 'البلينا', 'El Balyana'),
    ('Sohag', 'المراغة', 'El Maragha'),
    ('Qena', 'قنا', 'Qena'),
    ('Qena', 'نجع حمادي', 'Nag Hammadi'),
    ('Qena', 'دشنا', 'Deshna'),
    ('Qena', 'قفط', 'Qift'),
    ('Qena', 'قوص', 'Qus'),
    ('Qena', 'أبو تشت', 'Abu Tesht'),
    ('Luxor', 'الأقصر', 'Luxor'),
    ('Luxor', 'إسنا', 'Esna'),
    ('Luxor', 'أرمنت', 'Armant'),
    ('Luxor', 'القرنة', 'Qurna'),
    ('Luxor', 'البياضية', 'Al Bayadiyah'),
    ('Luxor', 'الزينية', 'Az Ziniyah'),
    ('Aswan', 'أسوان', 'Aswan'),
    ('Aswan', 'دراو', 'Daraw'),
    ('Aswan', 'كوم أمبو', 'Kom Ombo'),
    ('Aswan', 'إدفو', 'Edfu'),
    ('Aswan', 'نصر النوبة', 'Nasr El Nuba'),
    ('Red Sea', 'الغردقة', 'Hurghada'),
    ('Red Sea', 'سفاجا', 'Safaga'),
    ('Red Sea', 'القصير', 'Quseir'),
    ('Red Sea', 'مرسى علم', 'Marsa Alam'),
    ('Red Sea', 'رأس غارب', 'Ras Ghareb'),
    ('New Valley', 'الخارجة', 'Kharga'),
    ('New Valley', 'الداخلة', 'Dakhla'),
    ('New Valley', 'الفرافرة', 'Farafra'),
    ('New Valley', 'باريس', 'Paris'),
    ('New Valley', 'بلاط', 'Balat')
),
city_targets as (
  select
    g.id as governorate_id,
    c.name_ar,
    c.name_en
  from city_data c
  join public.governorates g
    on lower(g.name_en) = lower(c.governorate_en)
)
insert into public.cities (governorate_id, name_ar, name_en)
select t.governorate_id, t.name_ar, t.name_en
from city_targets t
where not exists (
  select 1
  from public.cities c
  where c.governorate_id = t.governorate_id
    and (
      c.name_ar = t.name_ar
      or lower(coalesce(c.name_en, '')) = lower(t.name_en)
    )
);

commit;
