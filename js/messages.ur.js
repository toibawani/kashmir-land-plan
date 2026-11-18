/**
 * Urdu strings, loaded only when Urdu is chosen.
 *
 * Urdu is right to left. Same coverage as English: the screens a farmer
 * acts on, not the option prose, which stays in English.
 *
 * This file is fetched on demand by MLMP_LOAD and registered into
 * js/messages.js, so a farmer reading English never downloads it. Every key
 * here exists in English in js/messages.js; a key that goes missing falls back
 * to the English string rather than printing a raw key.
 *
 * These translations have NOT been checked by a native speaker. Do not flip
 * `reviewed` in js/messages.js without a person and a date.
 */
(function () {
  "use strict";

  var UR = {
    "nav.home": "ہوم",
    "nav.plan": "منصوبہ شروع کریں",
    "nav.weather": "موسم",
    "nav.plans": "میرے منصوبے",
    "nav.about": "بارے میں",
    "nav.menu": "مینو",
    "nav.language": "زبان",
    "footer.privacy": "رازداری کی پالیسی",
    "footer.terms": "خدمات کی شرائط",

    "home.eyebrow": "جموں اور کشمیر کے کسانوں کے لیے",
    "home.title": "میری زمین، میرا منصوبہ",
    "home.lead":
      "ایک آف لائن زمین منصوبہ بندی ایپ، جو آپ کو عملی اختیارات اور زراعت کے دفتر کے لیے سوالات تیار کرنے میں مدد کرتی ہے۔ یہ کسی اسکیم کی اہلیت یا فصل کی ضمانت نہیں بناتی۔",
    "home.start": "زمین کا منصوبہ شروع کریں",
    "home.demo": "نمونہ سفر آزمائیں",
    "home.note":
      "زراعت کے دفتر کے دورے کی تیاری کریں۔ یہ سرکاری خدمت نہیں ہے، اور اس کی کوئی تجویز منظور نہیں ہے۔",

    "home.points.enterTitle": "آپ کیا درج کرتے ہیں",
    "home.points.enterBody":
      "ضلع، بلندی کا علاقہ، گاؤں، زمین کا سائز، پانی کی رسائی، زمین کی قسم اور سب سے بڑا مسئلہ۔ مٹی کا ٹیسٹ اختیاری ہے۔",
    "home.points.getTitle": "آپ کو کیا ملتا ہے",
    "home.points.getBody":
      "بحث کے لیے دو یا تین اختیارات، دفتر کے دورے کا کارڈ، پوچھنے کے سوالات، ایک چیک لسٹ اور جانچنے کے لیے سرکاری پورٹل۔",

    "form.location": "مقام",
    "form.district": "ضلع",
    "form.altitude": "بلندی کا علاقہ",
    "form.village": "گاؤں یا محلہ",
    "form.size": "زمین کا سائز",
    "form.unit": "اکائی",
    "form.water": "موجودہ استعمال اور پانی",
    "form.terrain": "زمین اور مٹی",
    "form.constraint": "سب سے بڑا مسئلہ",
    "form.required": "ضروری",
    "form.continue": "آگے بڑھیں",
    "form.back": "پیچھے",
    "form.submit": "اختیارات دیکھیں",
    "form.saveDraft": "اس ڈیوائس پر ڈرافٹ محفوظ کریں",
    "form.selectDistrict": "ضلع منتخب کریں",
    "form.selectAltitude": "جس زمین پر کاشت کرتے ہیں وہ منتخب کریں",
    "altitude.valley": "وادی یا نشیبی زمین",
    "altitude.plains": "میدان اور دامن",
    "altitude.hills": "درمیانی بلندی کی پہاڑیاں",
    "altitude.high_altitude": "زیادہ بلندی",
    "form.landUse": "زمین کا موجودہ استعمال",
    "form.landUse.unused": "زیادہ تر خالی",
    "form.landUse.partly": "کچھ حصہ استعمال میں",
    "form.landUse.cultivated": "ابھی کاشت ہو رہی ہے",
    "form.water.reliable": "قابل بھروسہ",
    "form.water.seasonal": "موسمی",
    "form.water.limited": "محدود",
    "form.water.unknown": "معلوم نہیں",
    "form.terrain.flat": "زیادہ تر ہموار",
    "form.terrain.sloped": "ڈھلوان یا پہاڑی",
    "form.terrain.unknown": "معلوم نہیں",
    "form.soil": "مٹی کا ٹیسٹ (اختیاری)",
    "form.soil.none": "حالیہ مٹی کا ٹیسٹ نہیں",
    "form.soil.done": "میرے پاس حالیہ مٹی کا ٹیسٹ ہے",
    "form.soil.partial": "ادھورا یا پرانا نتیجہ",
    "form.constraint.water": "پانی",
    "form.constraint.cost": "لاگت یا سرمایہ",
    "form.constraint.labour": "محنت",
    "form.constraint.advice": "مشورے تک رسائی",
    "form.constraint.market": "منڈی تک رسائی",
    "form.constraint.unsure": "معلوم نہیں",

    "results.title": "دیکھنے کے لیے ممکنہ سرگرمیاں",
    "results.intro":
      "یہ بحث کے لیے اختیارات ہیں، جو آپ کے جوابات اور ضلع کی عام معلومات پر مبنی ہیں۔ یہ آپ کی زمین کا جائزہ نہیں ہیں، اور کسی بات کی منظوری بھی نہیں ہیں۔",
    "results.edit": "تفصیلات بدلیں",
    "results.compare": "اختیارات کا موازنہ کریں",
    "results.plans": "میرے محفوظ منصوبے",
    "results.reset": "نئی تفصیلات کے ساتھ دوبارہ شروع کریں",
    "results.questionsTitle": "دفتر میں پوچھنے کے سوالات",
    "results.questionsIntro":
      "آپ کے جوابات اور منتخب اختیارات سے بنے سوالات۔ یہ سوال ہیں، جواب نہیں، اور کسی افسر نے انہیں نہیں دیکھا۔",
    "results.gapTitle": "اس بلندی کے لیے کافی مقامی معلومات نہیں",
    "results.gapBody":
      "اس بلندی کے علاقے کے لیے اس فہرست میں قابلِ اعتماد معلومات نہیں ہیں۔ یہاں کوئی اختیار جان بوجھ کر نہیں دکھایا گیا، کیونکہ میدانی فصلوں سے یہ کمی پُر کرنا ایک اندازہ ہوگا۔ افسر سے پوچھیں کہ آپ کی بلندی پر کون سی سرگرمیاں واقعی کی جاتی ہیں۔",

    "visit.title": "دفتر کے دورے کا کارڈ",
    "visit.intro":
      "یہی ایک چیز ہے جو دفتر لے جانے کے قابل ہے۔ اس میں آپ کے جوابات، منتخب اختیارات اور پوچھنے کے سوال ایک صفحے پر ہیں۔ اس پر کوئی سفارش نہیں ہے، اور اسے کسی نے منظور نہیں کیا۔",
    "visit.print": "پرنٹ کریں یا PDF محفوظ کریں",
    "visit.share": "واٹس ایپ پر بھیجیں",
    "visit.download": "متن کے طور پر ڈاؤن لوڈ کریں",
    "visit.back": "خلاصے پر واپس",
    "visit.cardTitle": "میری زمین، میرا منصوبہ: دفتر کے دورے کا کارڈ",
    "visit.whatIEntered": "میں نے کیا درج کیا",
    "visit.options": "جن اختیارات پر بحث کرنی ہے",
    "visit.questions": "جو سوال میں پوچھنا چاہتا ہوں",
    "visit.support": "جن مدد کے بارے میں پوچھنا چاہیے",
    "visit.notes": "دورے کے نوٹس",
    "visit.documents": "ساتھ لے جانے والے کاغذات",
    "visit.soil": "مٹی سے متعلق جانچ",
    "visit.reference": "منصوبے کا حوالہ",
    "visit.foot":
      "یہ کارڈ کسان نے ایک پروٹو ٹائپ سے بنایا ہے، کسی محکمے نے نہیں۔ یہ سرکاری دستاویز نہیں ہے اور کسی چیز کی اہلیت ثابت نہیں کرتا۔",
    "visit.visitMode": "دورے کا موڈ",
    "visit.visitModeExit": "ہو گیا، دورے کے موڈ سے باہر",

    "review.badgeNot": "ابھی کسی افسر نے جانچ نہیں کی",
    "review.badgeReviewed": "{name}، {office} نے {date} کو جانچا",
    "review.notReviewed":
      "ابھی کسی زرعی افسر نے جانچ نہیں کی۔ ہر تجویز کو بحث کا سوال سمجھیں، کرنے کا مشورہ نہیں۔ کرنے سے پہلے ہمیشہ مقامی طور پر تصدیق کریں۔",
    "review.reviewed":
      "{name}، {office} نے {date} کو جانچا۔ پھر بھی کرنے سے پہلے مقامی طور پر تصدیق کریں۔",

    "share.heading": "میرا زمین منصوبہ",
    "share.plan": "منصوبہ",
    "share.options": "بحث کے اختیارات",
    "share.questions": "جو سوال میں پوچھنا چاہتا ہوں",
    "share.carry": "ساتھ لے جائیں",
    "share.soil": "مٹی کی جانچ",
    "share.marked": "(نشان زدہ)",
    "share.done": "[ہو گیا]",
    "share.prepared": "تیار",
    "share.madeWith": "مائی لینڈ، مائی پلان پروٹو ٹائپ سے بنایا گیا۔ سرکاری دستاویز نہیں۔",

    "lang.notice":
      "اس ترجمے کی ابھی کسی مادری زبان بولنے والے نے جانچ نہیں کی۔ اختیارات کی تفصیل ابھی انگریزی میں ہے۔ کرنے سے پہلے ہمیشہ مقامی طور پر تصدیق کریں۔",
    "lang.englishOnly": "اختیارات کی تفصیل ابھی صرف انگریزی میں ہے۔",
    "lang.uncheckedShort": "مادری زبان والے کی جانچ باقی",

    "data.title": "اس ڈیوائس پر",
    "data.intro":
      "یہ ایپ جو کچھ رکھتی ہے، اسی فون کے اسی براؤزر میں رہتا ہے۔ کوئی اکاؤنٹ نہیں اور سرور پر کوئی نقل نہیں۔ یہاں سے آپ بیک اپ لے سکتے ہیں، واپس لا سکتے ہیں، یا سب کچھ مٹا سکتے ہیں۔",
    "data.storedHeading": "یہاں کیا رکھا ہے",
    "data.backupHeading": "بیک اپ",
    "data.dangerHeading": "مٹائیں",
    "data.plansCount": "محفوظ منصوبے: {count}",
    "data.draftYes": "اس فارم کا مسودہ جس پر آپ نے آخری بار کام کیا",
    "data.draftNo": "کوئی مسودہ محفوظ نہیں",
    "data.langYes": "آپ کی زبان کا انتخاب",
    "data.none": "ابھی کوئی منصوبہ محفوظ نہیں۔",
    "data.export": "سارا ڈیٹا برآمد کریں",
    "data.exportHint":
      "آپ کے منصوبوں اور مسودے کے ساتھ ایک JSON فائل محفوظ کرتا ہے۔ یہ اسی ڈیوائس پر لکھی جاتی ہے، کہیں اپ لوڈ نہیں ہوتی۔",
    "data.import": "بیک اپ درآمد کریں",
    "data.importHint":
      "اس ایپ سے بنی بیک اپ فائل چنیں۔ یہ یہاں موجود ڈیٹا کی جگہ لے گی، اس لیے پہلے برآمد کر لیں۔",
    "data.deleteAll": "اس ڈیوائس سے سب کچھ مٹائیں",
    "data.deleteHint":
      "ہر منصوبہ، مسودہ، زبان کا انتخاب اور فیڈبیک کے جوابات ہٹ جائیں گے۔ اسے واپس نہیں لایا جا سکتا۔",
    "data.back": "میرے منصوبوں پر واپس",
    "data.exported": "بیک اپ اس ڈیوائس پر JSON فائل کے طور پر محفوظ ہو گیا۔",
    "data.imported": "{count} منصوبے بحال ہوئے۔ آپ کے محفوظ منصوبے اب فائل سے میل کھاتے ہیں۔",
    "data.deleted": "اس ایپ نے اس ڈیوائس پر جو کچھ رکھا تھا، وہ ہٹا دیا گیا ہے۔",
    "data.refused": "درآمد نہیں ہوا: {why}",
    "data.confirmImport":
      "اس ڈیوائس پر رکھا ڈیٹا اس بیک اپ سے بدلیں؟ یہاں موجود منصوبے اور مسودہ ہٹ جائیں گے۔",
    "data.confirmDelete":
      "اس ڈیوائس سے ہر منصوبہ، مسودہ، زبان کا انتخاب اور فیڈبیک کے جوابات مٹائیں؟ اسے واپس نہیں لایا جا سکتا۔",
    "notes.label": "اس زمین کے لیے نوٹ",
    "notes.hint": "افسر نے کیا کہا اور آگے کیا کرنا ہے۔ منصوبے کے ساتھ اسی ڈیوائس پر رہتا ہے۔",
    "notes.save": "نوٹ محفوظ کریں",
    "notes.saved": "نوٹ منصوبے کے ساتھ محفوظ ہو گیا۔",

    "photos.title": "اس زمین کی تصاویر",
    "photos.note":
      "اسی ڈیوائس پر رکھی جاتی ہیں۔ ہر تصویر محفوظ کرنے سے پہلے چھوٹی کی جاتی ہے اور اس کا مقام کا ڈیٹا ہٹا دیا جاتا ہے۔ کہیں اپ لوڈ نہیں ہوتی۔",
    "photos.slot.wide": "زمین کا وسیع منظر",
    "photos.slot.ground": "زمین کا قریبی منظر",
    "photos.slot.water": "قریب ترین پانی کا ذریعہ",
    "photos.optional": "اختیاری",
    "photos.take": "تصویر لیں",
    "photos.choose": "گیلری سے چنیں",
    "photos.retake": "دوبارہ لیں",
    "photos.remove": "تصویر ہٹائیں",
    "photos.empty": "ابھی کوئی تصویر نہیں۔",
    "photos.needPlan": "پہلے یہ منصوبہ محفوظ کریں، پھر تصاویر اس کے ساتھ رکھی جا سکتی ہیں۔",
    "photos.saving": "تصویر اس ڈیوائس پر محفوظ ہو رہی ہے...",
    "photos.saved": "تصویر منصوبے کے ساتھ محفوظ ہو گئی۔",
    "photos.tooSmall": "یہ تصویر بہت چھوٹی ہے۔ تھوڑا قریب آ کر دوبارہ لیں۔",
    "photos.tooDark": "یہ تصویر بہت اندھیری ہے۔ بہتر روشنی میں جا کر دوبارہ لیں۔",
    "photos.tooBright": "یہ تصویر بہت تیز روشنی میں ہے۔ دھوپ سے ہٹ کر دوبارہ لیں۔",
    "photos.blurry": "یہ تصویر دھندلی لگتی ہے۔ فون کو ساکن رکھ کر دوبارہ لیں۔",
    "photos.quota": "اس ڈیوائس میں ایک اور تصویر کی جگہ نہیں۔ کوئی تصویر ہٹائیں یا جگہ خالی کریں، پھر کوشش کریں۔",
    "photos.failed": "تصویر پڑھی نہیں جا سکی۔ دوسری تصویر آزمائیں۔",
    "photos.share": "تصاویر شیئر کریں",
    "photos.noneToShare": "شیئر کرنے کے لیے ابھی کوئی تصویر نہیں۔",
    "photos.downloaded": "یہ براؤزر فائلیں شیئر نہیں کر سکتا، اس لیے تصاویر اس ڈیوائس پر محفوظ کر دی گئیں۔",
    "photos.confirmRemove": "یہ تصویر اس ڈیوائس سے ہٹائیں؟",
    "photos.removed": "تصویر اس ڈیوائس سے ہٹا دی گئی۔",
    "photos.removeFailed": "ڈیوائس نے تصویر ہٹانے سے انکار کیا۔ دوبارہ کوشش کریں۔",
    "photos.timeline": "وقت کے ساتھ تصاویر",
    "photos.timelineNote": "اس منصوبے کے لیے رکھی ہر تصویر، نئی پہلے، تاریخ کے ساتھ۔ دو چن کر انہیں ساتھ ساتھ دیکھیں۔",
    "photos.compare": "موازنہ کریں",
    "photos.comparePicked": "منتخب",
    "photos.compareHint": "ساتھ ساتھ دیکھنے کے لیے دو تصاویر چنیں۔",
    "photos.compareTitle": "ساتھ ساتھ",
    "photos.compareClear": "موازنہ ہٹائیں",
    "photos.photoNote": "نوٹ",
    "photos.photoNoteLabel": "اس تصویر کے بارے میں نوٹ",
    "photos.photoNoteSave": "نوٹ محفوظ کریں",
    "photos.photoNoteSaved": "نوٹ تصویر کے ساتھ محفوظ ہو گیا۔",
    "photos.photoNoteFailed": "ڈیوائس نے نوٹ محفوظ کرنے سے انکار کیا۔ جگہ خالی کر کے دوبارہ کوشش کریں۔",
    "photos.full": "اس منصوبے میں پہلے سے 40 تصاویر ہیں۔ ایک اور لینے کے لیے کوئی تصویر ہٹائیں۔",
    "observe.title": "تصویر کی تفصیل (ابھی منسلک نہیں)",
    "observe.note": "اس بلڈ میں تفصیل کی سروس نہیں ہے۔ سوئچ آپ کا انتخاب محفوظ کرتا ہے، مگر کچھ نہیں بھیجا جاتا اور دکھانے کے لیے کچھ نہیں ہے۔",
    "observe.limits": "منسلک ہونے پر بھی یہ صرف چار نظر آنے والی باتیں بتا سکتا ہے: زمین کا ڈھانپ، پانی، کوئی ڈھانچہ اور ڈھلوان۔ یہ فصل، مٹی، کیڑے یا پیداوار کا نام نہیں لے گا، اور مشورہ نہیں دے گا۔",
    "observe.consent": "میں سمجھتا ہوں کہ تصویر اس فون سے باہر جائے گی",
    "observe.try": "تفصیل طلب کریں",
    "observe.notConnected": "اس بلڈ میں کوئی تفصیل سروس منسلک نہیں، اس لیے کچھ نہیں بھیجا گیا۔",
    "observe.needConsent": "پہلے سوئچ آن کریں۔ اس کے بغیر کچھ نہیں بھیجا جاتا۔",
    "observe.needPhoto": "پہلے ایک تصویر لیں۔",
    "observe.consentOff": "اس فون سے تصاویر نہیں بھیجی جائیں گی۔",
    "observe.unavailable": "تفصیل کی سروس بند ہے، اس لیے کچھ نہیں بھیجا گیا۔",
    "observe.limited": "آج کے لیے بہت سی تفصیلیں طلب کی جا چکی ہیں۔ کچھ نہیں بھیجا گیا۔",
    "observe.refused": "تفصیل کی سروس نے درخواست مسترد کر دی۔ کچھ نہیں دکھایا گیا۔",
    "observe.ready": "تفصیل موصول ہوئی ہے۔ یہ بلڈ اسے ابھی نہیں دکھاتا۔",
    "update.ready": "اس ایپ کا ایک نیا ورژن تیار ہے۔",
    "update.reload": "دوبارہ کھولیں",

    "common.confirmLocally":
      "فصل کی پسند، لاگت اور موجودہ اسکیم قواعد کی تصدیق ہمیشہ اپنے مقامی زراعت کے دفتر یا کسان خدمت گھر سے کریں۔",
    "common.notOfficial":
      "یہ ایک کام کرنے والا پروٹو ٹائپ ہے، سرکاری خدمت نہیں۔ یہ سوالات تیار کرنے میں مدد کرتا ہے۔ یہ زمین کی تصدیق نہیں کر سکتا، اسکیم منظور نہیں کر سکتا، اور فصل کی ضمانت نہیں دے سکتا۔",
    "common.illustrative": "مثالی",
    "common.yourAnswers": "آپ کے جوابات",
    "common.regional": "علاقائی پس منظر",
    "common.liveWeather": "لائیو موسم",
    "common.askOfficer": "افسر سے پوچھیں",
    "common.roughEstimate": "اندازہ، مقامی طور پر تصدیق کریں",
    "land.actions": "زمین کارڈ کے اعمال",
    "land.share": "شیئر کریں",
    "land.download": "متن فائل میں محفوظ کریں",
    "a11y.skip": "مرکزی مواد پر جائیں",
    "offline.banner": "آپ آف لائن ہیں۔ زمین کا منصوبہ اس ڈیوائس پر کام کرتا رہے گا۔ موسم کے لیے انٹرنیٹ درکار ہے۔",
    "land.title": "{district} کی زمین",
    "land.summary": "{district}: شائع شدہ ذرائع کیا کہتے ہیں",
    "land.height": "اونچائی",
    "land.rain": "بارش",
    "land.soils": "مٹی",
    "land.crops": "کھیت کی فصلیں",
    "land.fruit": "پھل",
    "land.glance": "ایک نظر میں",
    "land.area": "رقبہ",
    "land.population": "آبادی",
    "land.blocks": "بلاک",
    "land.tehsils": "تحصیلیں",
    "land.villages": "ریونیو گاؤں",
    "land.utTitle": "پورے مرکز کے زیر انتظام علاقے میں",
    "land.forest": "جنگلات",
    "land.sown": "خالص بویا گیا رقبہ",
    "land.irrigated": "آبپاش",
    "land.nearby": "{division} ڈویژن کے دیگر اضلاع",
    "land.division.Kashmir": "کشمیر",
    "land.division.Jammu": "جموں",
    "land.copy": "یہ تفصیل کاپی کریں",
    "land.copied": "کاپی ہو گئی",
    "land.copyManual": "کاپی کرنے کے لیے اوپر کا متن منتخب کریں",
    "land.sources": "یہ معلومات کہاں سے ہیں",
    "land.villageCounts": "2011 کی مردم شماری میں مرکز کے زیر انتظام علاقے میں {villages} گاؤں، {revenue} ریونیو گاؤں اور {halqas} پٹوار حلقے ہیں۔",
    "land.villageSource": "گاؤں کی گنتی:",
    "lazy.failed": "یہ حصہ لوڈ نہیں ہو سکا۔ اپنا کنکشن دیکھیں اور دوبارہ کوشش کریں۔",
    "lazy.retry": "دوبارہ کوشش کریں",
  };

  if (window.MLMP_MESSAGES && window.MLMP_MESSAGES.register) {
    window.MLMP_MESSAGES.register("ur", UR);
  }
})();
