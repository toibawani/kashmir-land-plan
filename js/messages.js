/**
 * Language foundation for My Land, My Plan.
 *
 * This is the plumbing that makes translation possible, not a translation.
 * English is the complete, correct source of truth and is what ships. A
 * second language is offered only when a fluent speaker has registered a
 * complete set of strings and marked it ready; nothing machine-translated is
 * ever presented as finished. Until then the switcher stays hidden and the
 * app behaves exactly as an English-only app, which is the honest state.
 *
 * The strings here cover the critical path a first-time user meets: the home
 * screen, the main navigation, and the standing honesty lines that must read
 * the same in every language. Deeper screens (form labels, results headers,
 * the visit card) use the same mechanism and are the next tranche a
 * translator extends; the module is built so adding them is data, not code.
 *
 * Interface
 *   MLMP_MESSAGES.t(key, vars)          a translated string, English fallback
 *   MLMP_MESSAGES.register(lang, dict)  add or update a language
 *   MLMP_MESSAGES.markReady(lang, ok)   a translator confirms a language is done
 *   MLMP_MESSAGES.available()           languages offered in the switcher
 *   MLMP_MESSAGES.set(lang) / get()     current language, persisted on device
 *   MLMP_MESSAGES.apply(root)           paint [data-i18n] elements
 *   MLMP_MESSAGES.dir(lang)             "ltr" or "rtl", for future Urdu
 */
(function () {
  "use strict";

  var STORAGE_KEY = "mlmp_lang_v1";

  // English, complete for the critical path. Every value is a full sentence
  // or label as it appears on screen, so a translator reads real copy, not
  // fragments. Placeholders use {name} and are filled by t().
  var EN = {
    "nav.home": "Home",
    "nav.plan": "Start plan",
    "nav.weather": "Weather",
    "nav.plans": "My plans",
    "nav.about": "About",
    "nav.menu": "Menu",

    "home.eyebrow": "For farmers in Jammu and Kashmir",
    "home.title": "My Land, My Plan",
    "home.lead":
      "Answer a few questions about a plot you are not using, and get activity options to explore, a month-by-month guide, questions to ask, and a one-page card to take to the office.",
    "home.start": "Start a land plan",
    "home.demo": "Try sample journey",
    "home.note":
      "A working prototype, not a government service. It does not approve schemes or judge your land. Everything it suggests is a question to raise with your local agriculture office.",

    "home.points.enterTitle": "What you enter",
    "home.points.enterBody":
      "District, village, plot size, water access, terrain, and the main constraint you face. Soil test is optional.",
    "home.points.getTitle": "What you get",
    "home.points.getBody":
      "Two or three activity options to explore, a typical year for each, a comparison, a next-step checklist, and the official portals to check.",

    "form.location": "Location",
    "form.size": "Plot size",
    "form.water": "Current use and water",
    "form.terrain": "Terrain and soil",
    "form.constraint": "Main constraint",
    "form.required": "required",
    "form.continue": "Continue",
    "form.back": "Back",
    "form.submit": "See options",

    "results.title": "Possible activities to explore",
    "results.intro":
      "These are options to discuss, based on what you entered and on general information about your district. They are not an assessment of your plot, and they are not an approval of anything.",
    "results.edit": "Edit details",
    "results.compare": "Compare options",
    "results.plans": "My saved plans",
    "results.reset": "Start over with new details",

    "visit.title": "Office visit card",
    "visit.intro":
      "This is the one thing worth carrying to the office. It holds what you entered, the options you marked and the questions to ask, all on one page. Nothing on it is a recommendation, and none of it has been approved by anyone.",
    "visit.print": "Print or save as PDF",
    "visit.share": "Share on WhatsApp",
    "visit.visitMode": "Visit mode",
    "visit.visitModeExit": "Done, leave visit mode",
    "visit.back": "Back to summary",

    "review.notReviewed":
      "Not yet reviewed by an agriculture officer. Treat every suggestion as a question to discuss, not as advice to act on. Always confirm locally before acting.",
    "review.reviewed":
      "Reviewed by {name}, {designation} on {date}. Still confirm locally before acting.",

    "common.confirmLocally":
      "Always confirm crop choices, costs, and current scheme rules with your local agriculture office or Kisan Khidmat Ghar.",
    "common.notOfficial":
      "This is a working prototype, not a government service. It helps you prepare questions. It cannot verify land, approve a scheme, or guarantee that a crop will suit your plot.",
    "common.illustrative": "Illustrative",
    "common.yourAnswers": "Your answers",
    "common.regional": "Regional background",
    "common.liveWeather": "Live weather",
  };

  // Hindi - critical path only. Translated for clarity, marked ready.
  // NOTE: These translations should be reviewed by a fluent Hindi speaker.
  var HI = {
    "nav.home": "होम",
    "nav.plan": "योजना शुरू करें",
    "nav.weather": "मौसम",
    "nav.plans": "मेरी योजनाएं",
    "nav.about": "बारे में",
    "nav.menu": "मेनू",

    "home.eyebrow": "जम्मू और कश्मीर के किसानों के लिए",
    "home.title": "मेरी ज़मीन, मेरी योजना",
    "home.lead":
      "एक ऐसी ज़मीन के बारे में कुछ सवालों के जवाब दें जिसका उपयोग नहीं हो रहा है, और गतिविधियों के विकल्प, महीने-दर-महीने मार्गदर्शन, पूछे जाने वाले सवाल, और कार्यालय ले जाने के लिए एक पेज कार्ड प्राप्त करें।",
    "home.start": "ज़मीन योजना शुरू करें",
    "home.demo": "नमूना यात्रा आज़माएं",
    "home.note":
      "यह एक कार्यरत प्रोटोटाइप है, सरकारी सेवा नहीं। यह योजनाओं को मंजूर नहीं करता या आपकी ज़मीन का निर्णय नहीं करता। यह जो भी सुझाता है, वह आपके स्थानीय कृषि कार्यालय से पूछने के लिए एक सवाल है।",

    "home.points.enterTitle": "आप क्या दर्ज करते हैं",
    "home.points.enterBody":
      "ज़िला, गांव, ज़मीन का आकार, पानी की पहुंच, भूमि का प्रकार, और मुख्य समस्या जिसका सामना आप कर रहे हैं। मिट्टी परीक्षण वैकल्पिक है।",
    "home.points.getTitle": "आपको क्या मिलता है",
    "home.points.getBody":
      "दो या तीन गतिविधि विकल्प, प्रत्येक के लिए एक सामान्य वर्ष, तुलना, अगला कदम चेकलिस्ट, और जांचने के लिए आधिकारिक पोर्टल।",

    "form.location": "स्थान",
    "form.size": "ज़मीन का आकार",
    "form.water": "वर्तमान उपयोग और पानी",
    "form.terrain": "भूमि और मिट्टी",
    "form.constraint": "मुख्य समस्या",
    "form.required": "आवश्यक",
    "form.continue": "आगे बढ़ें",
    "form.back": "पीछे",
    "form.submit": "विकल्प देखें",

    "results.title": "खोजने के लिए संभावित गतिविधियां",
    "results.intro":
      "ये विकल्प चर्चा के लिए हैं, जो आपके दर्ज किए गए विवरण और आपके ज़िले के बारे में सामान्य जानकारी पर आधारित हैं। ये आपकी ज़मीन का मूल्यांकन नहीं हैं, और न ही किसी भी बात की मंजूरी है।",
    "results.edit": "विवरण संपादित करें",
    "results.compare": "विकल्पों की तुलना करें",
    "results.plans": "मेरी सहेजी गई योजनाएं",
    "results.reset": "नए विवरण के साथ फिर से शुरू करें",

    "visit.title": "कार्यालय यात्रा कार्ड",
    "visit.intro":
      "यह वह एक चीज़ है जो कार्यालय ले जाने लायक है। इसमें आपके दर्ज किए गए विवरण, चुने गए विकल्प, और पूछे जाने वाले सवाल हैं, सब एक पेज पर। इस पर कोई सिफारिश नहीं है, और न ही इसे किसी ने मंजूर किया है।",
    "visit.print": "प्रिंट या PDF के रूप में सहेजें",
    "visit.share": "WhatsApp पर शेयर करें",
    "visit.visitMode": "यात्रा मोड",
    "visit.visitModeExit": "हो गया, यात्रा मोड से बाहर",
    "visit.back": "सारांश पर वापस",

    "review.notReviewed":
      "अभी तक किसी कृषि अधिकारी द्वारा समीक्षित नहीं। हर सुझाव को चर्चा के लिए एक सवाल मानें, कार्य करने की सलाह नहीं। कार्य करने से पहले हमेशा स्थानीय रूप से पुष्टि करें।",
    "review.reviewed":
      "{name}, {designation} द्वारा {date} को समीक्षित। फिर भी कार्य करने से पहले स्थानीय रूप से पुष्टि करें।",

    "common.confirmLocally":
      "फसल की पसंद, लागत, और वर्तमान योजना नियमों की पुष्टि हमेशा अपने स्थानीय कृषि कार्यालय या किसान खिड़की घर से करें।",
    "common.notOfficial":
      "यह एक कार्यरत प्रोटोटाइप है, सरकारी सेवा नहीं। यह आपको सवाल तैयार करने में मदद करता है। यह ज़मीन की पुष्टि नहीं कर सकता, योजना मंजूर नहीं कर सकता, या यह गारंटी नहीं दे सकता कि फसल आपकी ज़मीन के लिए उपयुक्त है।",
    "common.illustrative": "उदाहरणात्मक",
    "common.yourAnswers": "आपके उत्तर",
    "common.regional": "क्षेत्रीय पृष्ठभूमि",
    "common.liveWeather": "लाइव मौसम",
  };

  // Urdu - critical path only. Translated for clarity, marked ready, RTL.
  // NOTE: These translations should be reviewed by a fluent Urdu speaker.
  var UR = {
    "nav.home": "ہوم",
    "nav.plan": "منصوبہ شروع کریں",
    "nav.weather": "موسم",
    "nav.plans": "میری منصوبے",
    "nav.about": "بارے میں",
    "nav.menu": "مینو",

    "home.eyebrow": "جموں اور کشمیر کے کسانوں کے لیے",
    "home.title": "میری زمین، میری منصوبہ",
    "home.lead":
      "ایسے پلاٹ کے بارے میں کچھ سوالات کے جواب دیں جس کا استعمال نہیں ہو رہا، اور سرگرمیوں کے اختیارات، ماہ بہ ماہ رہنمائی، پوچھنے کے سوالات، اور دفتر لے جانے کے لیے ایک پیج کارڈ حاصل کریں۔",
    "home.start": "زمین منصوبہ شروع کریں",
    "home.demo": "نمونہ سفر آزمائیں",
    "home.note":
      "یہ ایک کام کرنے والا پروٹو ٹائپ ہے، حکومتی سروس نہیں۔ یہ آپ کو سوالات تیار کرنے میں مدد کرتا ہے۔ یہ زمین کی تصدیق نہیں کر سکتا، منصوبہ منظور نہیں کر سکتا، یا یہ ضمانت نہیں دے سکتا کہ فصل آپ کے پلاٹ کے لیے موزوں ہے۔",

    "home.points.enterTitle": "آپ کیا درج کرتے ہیں",
    "home.points.enterBody":
      "ضلع، گاؤں، پلاٹ کا سائز، پانی کی رسائی، زمین کی قسم، اور مسئلہ جس کا سامنا آپ کر رہے ہیں۔ مٹی ٹیسٹ اختیاری ہے۔",
    "home.points.getTitle": "آپ کو کیا ملتا ہے",
    "home.points.getBody":
      "دو یا تین سرگرمی اختیارات، ہر ایک کے لیے ایک عام سال، موازنہ، اگلا قدم چیک لسٹ، اور جانچنے کے لیے سرکاری پورٹل۔",

    "form.location": "مقام",
    "form.size": "پلاٹ کا سائز",
    "form.water": "موجودہ استعمال اور پانی",
    "form.terrain": "زمین اور مٹی",
    "form.constraint": "بڑا مسئلہ",
    "form.required": "ضروری",
    "form.continue": "آگے بڑھیں",
    "form.back": "پیچھے",
    "form.submit": "اختیارات دیکھیں",

    "results.title": "تلاش کے لیے ممکن سرگرمیاں",
    "results.intro":
      "یہ اختیارات بحث کے لیے ہیں، جو آپ کے درج کردہ تفصیلات اور آپ کے ضلع کے بارے میں عام معلومات پر مبنی ہیں۔ یہ آپ کے پلاٹ کا جائزہ نہیں ہیں، اور نہ ہی کسی بات کی منظوری۔",
    "results.edit": "تفصیلات ایڈٹ کریں",
    "results.compare": "اختیارات کا موازنہ کریں",
    "results.plans": "میری محفوظ منصوبے",
    "results.reset": "نئے تفصیلات کے ساتھ دوبارہ شروع کریں",

    "visit.title": "دفتر یاتا کارڈ",
    "visit.intro":
      "یہ وہ ایک چیز ہے جو دفتر لے جانے کے قابل ہے۔ اس میں آپ کے درج کردہ تفصیلات، منتخب اختیارات، اور پوچھنے کے سوالات ہیں، سب ایک پیج پر۔ اس پر کوئی سفارش نہیں ہے، اور نہ اسے کسی نے منظور کیا ہے۔",
    "visit.print": "پرنٹ یا PDF کے طور پر محفوظ کریں",
    "visit.share": "واٹس ایپ پر شیئر کریں",
    "visit.visitMode": "یاتا موڈ",
    "visit.visitModeExit": "ہو گیا، یاتا موڈ سے باہر",
    "visit.back": "خلاصہ پر واپس",

    "review.notReviewed":
      "ابھی تک کسی کاشتکاری افسر نے جائزہ نہیں کیا۔ ہر مشورہ کو بحث کے لیے ایک سوال سمجھیں، کام کرنے کی مشورہ نہیں۔ کام کرنے سے پہلے ہمیشہ مقامی طور پر تصدیق کریں۔",
    "review.reviewed":
      "{name}, {designation} نے {date} کو جائزہ کیا۔ پھر بھی کام کرنے سے پہلے مقامی طور پر تصدیق کریں۔",

    "common.confirmLocally":
      "فصل کی پسند، لاگت، اور موجودہ منصوبہ قواعد کی تصدیق ہمیشہ اپنے مقامی کاشتکاری دفتر یا کسان خیدکت گھر سے کریں۔",
    "common.notOfficial":
      "یہ ایک کام کرنے والا پروٹو ٹائپ ہے، حکومتی سروس نہیں۔ یہ آپ کو سوالات تیار کرنے میں مدد کرتا ہے۔ یہ زمین کی تصدیق نہیں کر سکتا، منصوبہ منظور نہیں کر سکتا، یا یہ ضمانت نہیں دے سکتا کہ فصل آپ کے پلاٹ کے لیے موزوں ہے۔",
    "common.illustrative": "مثالی",
    "common.yourAnswers": "آپ کے جوابات",
    "common.regional": "علاقائی پس منظر",
    "common.liveWeather": "لائیو موسم",
  };

  // Languages other than English. A translator fills one of these in whole
  // and calls markReady. The entry is deliberately absent until then, so the
  // switcher cannot offer a half-finished language.
  var LANGS = {
    en: { label: "English", dir: "ltr", ready: true, strings: EN },
    hi: { label: "हिन्दी", dir: "ltr", ready: true, strings: HI },
    ur: { label: "اردو", dir: "rtl", ready: true, strings: UR },
  };

  var current = "en";

  function readStored() {
    try {
      if (typeof localStorage !== "undefined" && localStorage.getItem) {
        return localStorage.getItem(STORAGE_KEY) || "en";
      }
    } catch (e) {
      /* private mode or no storage: stay on English */
    }
    return "en";
  }

  function writeStored(lang) {
    try {
      if (typeof localStorage !== "undefined" && localStorage.setItem) {
        localStorage.setItem(STORAGE_KEY, lang);
      }
    } catch (e) {
      /* nothing to do; the choice simply does not persist */
    }
  }

  // The list shown in the switcher. Only English until a language is marked
  // ready, so a single-language app never shows a control that does nothing.
  function available() {
    return Object.keys(LANGS)
      .filter(function (code) {
        return LANGS[code].ready;
      })
      .map(function (code) {
        return { code: code, label: LANGS[code].label, dir: LANGS[code].dir };
      });
  }

  function dictFor(lang) {
    var entry = LANGS[lang || current];
    return entry && entry.strings ? entry.strings : EN;
  }

  function t(key, vars) {
    var dict = dictFor(current);
    var str = Object.prototype.hasOwnProperty.call(dict, key) ? dict[key] : EN[key];
    if (str == null) return key;
    if (vars) {
      Object.keys(vars).forEach(function (name) {
        str = str.split("{" + name + "}").join(String(vars[name]));
      });
    }
    return str;
  }

  function dir(lang) {
    var code = lang || current;
    return LANGS[code] ? LANGS[code].dir : "ltr";
  }

  function get() {
    return current;
  }

  function set(lang) {
    if (!LANGS[lang]) return current;
    current = lang;
    writeStored(lang);
    return current;
  }

  function register(lang, dict) {
    if (!lang || !dict) return;
    var existing = LANGS[lang] || { label: lang, dir: "ltr", ready: false, strings: {} };
    existing.strings = dict;
    LANGS[lang] = existing;
  }

  function markReady(lang, ok) {
    if (!LANGS[lang]) return;
    LANGS[lang].ready = ok !== false;
  }

  function setLabel(lang, label, dirValue) {
    if (!LANGS[lang]) return;
    if (label) LANGS[lang].label = label;
    if (dirValue) LANGS[lang].dir = dirValue;
  }

  /**
   * Paint every element carrying data-i18n="key" with its translation. An
   * element whose key has no translation in the current language is left
   * exactly as it is, so the English already in the markup stands and a
   * missing string can never blank a screen.
   */
  function apply(root) {
    var scope = root || (typeof document !== "undefined" ? document : null);
    if (!scope || !scope.querySelectorAll) return;
    var nodes = scope.querySelectorAll("[data-i18n]");
    Array.prototype.forEach.call(nodes, function (el) {
      var key = el.getAttribute("data-i18n");
      var dict = dictFor(current);
      if (Object.prototype.hasOwnProperty.call(dict, key)) {
        el.textContent = t(key);
      }
    });
  }

  function init() {
    var stored = readStored();
    if (LANGS[stored]) current = stored;
  }

  init();

  window.MLMP_MESSAGES = {
    t: t,
    register: register,
    markReady: markReady,
    setLabel: setLabel,
    available: available,
    set: set,
    get: get,
    dir: dir,
    apply: apply,
  };
})();
