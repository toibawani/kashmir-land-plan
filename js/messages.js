/**
 * Language strings for the critical path.
 *
 * English is the source of truth. Hindi and Urdu cover the screens a farmer
 * meets first: home, the form, the results header, the visit card, the share
 * text and the confirm-locally lines. Option prose in the catalogue is still
 * English, and the interface says so rather than pretending otherwise.
 *
 * These translations have NOT been checked by a native speaker. Every
 * language therefore carries `reviewed: false`, the interface shows a notice
 * while a language is unreviewed, and TRANSLATION_CHECK.md lists every string
 * for a reviewer. Do not flip `reviewed` without a person and a date.
 *
 * Adding Kashmiri later is one object: copy the EN key list, fill it in, add
 * it to LANGS with dir "rtl". No other file needs to change.
 *
 * Interface
 *   MLMP_MESSAGES.t(key, vars)          a translated string, English fallback
 *   MLMP_MESSAGES.apply(root)           paint [data-i18n] elements
 *   MLMP_MESSAGES.set(lang) / get()     current language, persisted on device
 *   MLMP_MESSAGES.dir(lang)             "ltr" or "rtl"
 *   MLMP_MESSAGES.available()           languages offered in the switcher
 *   MLMP_MESSAGES.reviewed(lang)        whether a native speaker checked it
 *   MLMP_MESSAGES.dict(lang) / keys()   strings, for the translation check
 *   MLMP_MESSAGES.register/markReady    add a language, mark it complete
 */
(function () {
  "use strict";

  var STORAGE_KEY = "mlmp_lang_v1";

  var EN = {
    "nav.home": "Home",
    "nav.plan": "Start plan",
    "nav.weather": "Weather",
    "nav.plans": "My plans",
    "nav.about": "About",
    "nav.menu": "Menu",
    "nav.language": "Language",

    "home.eyebrow": "For farmers in Jammu and Kashmir",
    "home.title": "My Land, My Plan",
    "home.lead":
      "An offline-first land planning app that helps you prepare practical options and questions for the agriculture office, without inventing scheme eligibility or crop guarantees.",
    "home.start": "Start a land plan",
    "home.demo": "Try sample journey",
    "home.note":
      "Prepare for the agriculture office visit. This is not a government service, and nothing it suggests has been approved.",

    "home.points.enterTitle": "What you enter",
    "home.points.enterBody":
      "District, altitude zone, village, plot size, water access, terrain, and the main constraint you face. Soil test is optional.",
    "home.points.getTitle": "What you get",
    "home.points.getBody":
      "Two or three activity options to discuss, an office visit card, questions to ask, a checklist, and the official portals to check.",

    "form.location": "Location",
    "form.district": "District",
    "form.altitude": "Altitude zone",
    "form.village": "Village or locality",
    "form.size": "Plot size",
    "form.unit": "Unit",
    "form.water": "Current use and water",
    "form.terrain": "Terrain and soil",
    "form.constraint": "Main constraint",
    "form.required": "required",
    "form.continue": "Continue",
    "form.back": "Back",
    "form.submit": "See options",
    "form.saveDraft": "Save draft on this device",
    "form.selectDistrict": "Select district",
    "form.selectAltitude": "Select the ground you farm",
    "altitude.valley": "Valley or low ground",
    "altitude.plains": "Plains and foothills",
    "altitude.hills": "Mid-altitude hills",
    "altitude.high_altitude": "High altitude",
    "form.landUse": "Current land use",
    "form.landUse.unused": "Mostly unused",
    "form.landUse.partly": "Partly used",
    "form.landUse.cultivated": "Currently cultivated",
    "form.water.reliable": "Reliable",
    "form.water.seasonal": "Seasonal",
    "form.water.limited": "Limited",
    "form.water.unknown": "Not sure",
    "form.terrain.flat": "Mostly flat",
    "form.terrain.sloped": "Sloped or hilly",
    "form.terrain.unknown": "Not sure",
    "form.soil": "Soil test (optional)",
    "form.soil.none": "No recent soil test",
    "form.soil.done": "I have a recent soil test",
    "form.soil.partial": "Partial or old results",
    "form.constraint.water": "Water",
    "form.constraint.cost": "Cost or investment",
    "form.constraint.labour": "Labour",
    "form.constraint.advice": "Access to advice",
    "form.constraint.market": "Market access",
    "form.constraint.unsure": "Not sure",

    "results.title": "Possible activities to explore",
    "results.intro":
      "These are options to discuss, based on what you entered and on general information about your district. They are not an assessment of your plot, and they are not an approval of anything.",
    "results.edit": "Edit details",
    "results.compare": "Compare options",
    "results.plans": "My saved plans",
    "results.reset": "Start over with new details",
    "results.questionsTitle": "Questions to ask at the office",
    "results.questionsIntro":
      "Written from what you entered and from the options you marked. They are questions, not answers, and no officer has seen them.",
    "results.gapTitle": "Not enough local data for this altitude",
    "results.gapBody":
      "This catalogue has no honest data for this altitude zone. No options are shown here on purpose, because filling the gap with lowland crops would be a guess. Ask the officer which activities are actually practised at your height.",

    "visit.title": "Office visit card",
    "visit.intro":
      "This is the one thing worth carrying to the office. It holds what you entered, the options you marked and the questions to ask, all on one page. Nothing on it is a recommendation, and none of it has been approved by anyone.",
    "visit.print": "Print or save as PDF",
    "visit.share": "Share on WhatsApp",
    "visit.download": "Download as text",
    "visit.back": "Back to summary",
    "visit.cardTitle": "My Land, My Plan: office visit card",
    "visit.whatIEntered": "What I entered",
    "visit.options": "Options I want to discuss",
    "visit.questions": "Questions I would like to ask",
    "visit.support": "Support worth asking about",
    "visit.notes": "Notes from the visit",
    "visit.documents": "Documents to carry",
    "visit.soil": "Soil checks",
    "visit.reference": "Plan reference",
    "visit.foot":
      "This card was made by the farmer using a prototype, not by any department. It is not an official document and it does not establish eligibility for anything.",
    "visit.visitMode": "Visit mode",
    "visit.visitModeExit": "Done, leave visit mode",

    "review.badgeNot": "Not reviewed by an officer yet",
    "review.badgeReviewed": "Reviewed by {name}, {office} on {date}",
    "review.notReviewed":
      "Not yet reviewed by an agriculture officer. Treat every suggestion as a question to discuss, not as advice to act on. Always confirm locally before acting.",
    "review.reviewed":
      "Reviewed by {name}, {office} on {date}. Still confirm locally before acting.",

    "share.heading": "My land plan",
    "share.plan": "Plan",
    "share.options": "Options to discuss",
    "share.questions": "Questions I want to ask",
    "share.carry": "Carry",
    "share.soil": "Soil checks",
    "share.marked": "(marked)",
    "share.done": "[done]",
    "share.prepared": "Prepared",
    "share.madeWith": "Made with the My Land, My Plan prototype. Not an official document.",

    "lang.notice":
      "This translation has not been checked by a native speaker yet. Option details are still in English. Always confirm locally before acting.",
    "lang.englishOnly": "Option details are in English only for now.",
    "lang.uncheckedShort": "native-speaker check pending",

    "common.confirmLocally":
      "Always confirm crop choices, costs, and current scheme rules with your local agriculture office or Kisan Khidmat Ghar.",
    "common.notOfficial":
      "This is a working prototype, not a government service. It helps you prepare questions. It cannot verify land, approve a scheme, or guarantee that a crop will suit your plot.",
    "common.illustrative": "Illustrative",
    "common.yourAnswers": "Your answers",
    "common.regional": "Regional background",
    "common.liveWeather": "Live weather",
    "common.askOfficer": "Ask the officer",
    "common.roughEstimate": "Rough estimate, confirm locally",
    "land.title": "Land in {district}",
    "land.summary": "Land in {district}: what the published sources say",
    "land.height": "Height",
    "land.rain": "Rain",
    "land.soils": "Soils",
    "land.crops": "Field crops",
    "land.fruit": "Fruit",
    "land.glance": "At a glance",
    "land.area": "Area",
    "land.population": "Population",
    "land.blocks": "Blocks",
    "land.tehsils": "Tehsils",
    "land.villages": "Revenue villages",
    "land.utTitle": "Across the Union Territory",
    "land.forest": "Under forest",
    "land.sown": "Net area sown",
    "land.irrigated": "Irrigated",
    "land.nearby": "Other districts in the {division} division",
    "land.division.Kashmir": "Kashmir",
    "land.division.Jammu": "Jammu",
    "land.copy": "Copy these details",
    "land.copied": "Copied",
    "land.copyManual": "Select the text above to copy",
    "land.sources": "Where this comes from",
    "land.villageCounts": "The Union Territory has {villages} villages in the 2011 census, {revenue} revenue villages and {halqas} patwar halqas.",
    "land.villageSource": "Village counts:",
  };

  // Hindi. Labels and the sentences a farmer acts on, not literary prose.
  // Unreviewed: a fluent speaker still has to check the agricultural wording.
  var HI = {
    "nav.home": "होम",
    "nav.plan": "योजना शुरू करें",
    "nav.weather": "मौसम",
    "nav.plans": "मेरी योजनाएं",
    "nav.about": "बारे में",
    "nav.menu": "मेनू",
    "nav.language": "भाषा",

    "home.eyebrow": "जम्मू और कश्मीर के किसानों के लिए",
    "home.title": "मेरी ज़मीन, मेरी योजना",
    "home.lead":
      "एक ऑफ़लाइन ज़मीन योजना ऐप, जो आपको व्यावहारिक विकल्प और कृषि कार्यालय के लिए सवाल तैयार करने में मदद करता है। यह योजना की पात्रता या फसल की गारंटी नहीं बनाता।",
    "home.start": "ज़मीन योजना शुरू करें",
    "home.demo": "नमूना यात्रा आज़माएं",
    "home.note":
      "कृषि कार्यालय की यात्रा की तैयारी करें। यह सरकारी सेवा नहीं है, और इसका कोई सुझाव मंजूर नहीं है।",

    "home.points.enterTitle": "आप क्या दर्ज करते हैं",
    "home.points.enterBody":
      "ज़िला, ऊंचाई क्षेत्र, गांव, ज़मीन का आकार, पानी की पहुंच, भूमि का प्रकार और मुख्य समस्या। मिट्टी परीक्षण वैकल्पिक है।",
    "home.points.getTitle": "आपको क्या मिलता है",
    "home.points.getBody":
      "चर्चा के लिए दो या तीन विकल्प, कार्यालय यात्रा कार्ड, पूछने के सवाल, एक चेकलिस्ट और जांचने के लिए आधिकारिक पोर्टल।",

    "form.location": "स्थान",
    "form.district": "ज़िला",
    "form.altitude": "ऊंचाई क्षेत्र",
    "form.village": "गांव या इलाका",
    "form.size": "ज़मीन का आकार",
    "form.unit": "इकाई",
    "form.water": "वर्तमान उपयोग और पानी",
    "form.terrain": "भूमि और मिट्टी",
    "form.constraint": "मुख्य समस्या",
    "form.required": "आवश्यक",
    "form.continue": "आगे बढ़ें",
    "form.back": "पीछे",
    "form.submit": "विकल्प देखें",
    "form.saveDraft": "इस डिवाइस पर ड्राफ्ट सहेजें",
    "form.selectDistrict": "ज़िला चुनें",
    "form.selectAltitude": "जिस ज़मीन पर खेती करते हैं उसे चुनें",
    "altitude.valley": "घाटी या नीची ज़मीन",
    "altitude.plains": "मैदान और तलहटी",
    "altitude.hills": "मध्यम ऊंचाई की पहाड़ियां",
    "altitude.high_altitude": "अधिक ऊंचाई",
    "form.landUse": "वर्तमान भूमि उपयोग",
    "form.landUse.unused": "ज़्यादातर खाली",
    "form.landUse.partly": "कुछ हिस्सा उपयोग में",
    "form.landUse.cultivated": "अभी खेती हो रही है",
    "form.water.reliable": "भरोसेमंद",
    "form.water.seasonal": "मौसमी",
    "form.water.limited": "सीमित",
    "form.water.unknown": "पता नहीं",
    "form.terrain.flat": "ज़्यादातर समतल",
    "form.terrain.sloped": "ढलान या पहाड़ी",
    "form.terrain.unknown": "पता नहीं",
    "form.soil": "मिट्टी परीक्षण (वैकल्पिक)",
    "form.soil.none": "हाल का कोई मिट्टी परीक्षण नहीं",
    "form.soil.done": "मेरे पास हाल का मिट्टी परीक्षण है",
    "form.soil.partial": "आधा या पुराना परिणाम",
    "form.constraint.water": "पानी",
    "form.constraint.cost": "लागत या निवेश",
    "form.constraint.labour": "मजदूरी",
    "form.constraint.advice": "सलाह तक पहुंच",
    "form.constraint.market": "बाज़ार तक पहुंच",
    "form.constraint.unsure": "पता नहीं",

    "results.title": "खोजने के लिए संभावित गतिविधियां",
    "results.intro":
      "ये चर्चा के लिए विकल्प हैं, जो आपके जवाबों और ज़िले की सामान्य जानकारी पर आधारित हैं। ये आपकी ज़मीन का मूल्यांकन नहीं हैं, और किसी बात की मंजूरी भी नहीं हैं।",
    "results.edit": "विवरण बदलें",
    "results.compare": "विकल्पों की तुलना करें",
    "results.plans": "मेरी सहेजी योजनाएं",
    "results.reset": "नए विवरण के साथ फिर शुरू करें",
    "results.questionsTitle": "कार्यालय में पूछने के सवाल",
    "results.questionsIntro":
      "आपके जवाबों और चुने गए विकल्पों से बने सवाल। ये सवाल हैं, जवाब नहीं, और किसी अधिकारी ने इन्हें नहीं देखा।",
    "results.gapTitle": "इस ऊंचाई के लिए पर्याप्त स्थानीय जानकारी नहीं",
    "results.gapBody":
      "इस ऊंचाई क्षेत्र के लिए इस सूची में भरोसेमंद जानकारी नहीं है। यहां कोई विकल्प जानबूझकर नहीं दिखाया गया है, क्योंकि मैदानी फसलों से यह कमी भरना एक अनुमान होगा। अधिकारी से पूछें कि आपकी ऊंचाई पर कौन सी गतिविधियां वास्तव में की जाती हैं।",

    "visit.title": "कार्यालय यात्रा कार्ड",
    "visit.intro":
      "यही एक चीज़ है जो कार्यालय ले जाने लायक है। इसमें आपके जवाब, चुने गए विकल्प और पूछने के सवाल एक पेज पर हैं। इस पर कोई सिफारिश नहीं है, और इसे किसी ने मंजूर नहीं किया है।",
    "visit.print": "प्रिंट करें या PDF सहेजें",
    "visit.share": "WhatsApp पर भेजें",
    "visit.download": "टेक्स्ट के रूप में डाउनलोड करें",
    "visit.back": "सारांश पर वापस",
    "visit.cardTitle": "मेरी ज़मीन, मेरी योजना: कार्यालय यात्रा कार्ड",
    "visit.whatIEntered": "मैंने क्या दर्ज किया",
    "visit.options": "जिन विकल्पों पर चर्चा करनी है",
    "visit.questions": "जो सवाल मैं पूछना चाहता हूं",
    "visit.support": "जिन सहायता के बारे में पूछना चाहिए",
    "visit.notes": "यात्रा के नोट्स",
    "visit.documents": "साथ ले जाने वाले कागज़",
    "visit.soil": "मिट्टी से जुड़ी जांच",
    "visit.reference": "योजना संदर्भ",
    "visit.foot":
      "यह कार्ड किसान ने एक प्रोटोटाइप से बनाया है, किसी विभाग ने नहीं। यह सरकारी दस्तावेज़ नहीं है और किसी चीज़ की पात्रता सिद्ध नहीं करता।",
    "visit.visitMode": "यात्रा मोड",
    "visit.visitModeExit": "हो गया, यात्रा मोड से बाहर",

    "review.badgeNot": "अभी किसी अधिकारी ने जांच नहीं की",
    "review.badgeReviewed": "{name}, {office} द्वारा {date} को जांचा गया",
    "review.notReviewed":
      "अभी किसी कृषि अधिकारी ने जांच नहीं की। हर सुझाव को चर्चा का सवाल मानें, करने की सलाह नहीं। करने से पहले हमेशा स्थानीय रूप से पुष्टि करें।",
    "review.reviewed":
      "{name}, {office} द्वारा {date} को जांचा गया। फिर भी करने से पहले स्थानीय रूप से पुष्टि करें।",

    "share.heading": "मेरी ज़मीन योजना",
    "share.plan": "योजना",
    "share.options": "चर्चा के विकल्प",
    "share.questions": "जो सवाल मैं पूछना चाहता हूं",
    "share.carry": "साथ ले जाएं",
    "share.soil": "मिट्टी की जांच",
    "share.marked": "(चिह्नित)",
    "share.done": "[हो गया]",
    "share.prepared": "तैयार",
    "share.madeWith": "माई लैंड, माई प्लान प्रोटोटाइप से बनाया गया। सरकारी दस्तावेज़ नहीं।",

    "lang.notice":
      "इस अनुवाद को अभी किसी मूल वक्ता ने नहीं जांचा। विकल्पों का विवरण अभी अंग्रेज़ी में है। करने से पहले हमेशा स्थानीय रूप से पुष्टि करें।",
    "lang.englishOnly": "विकल्पों का विवरण अभी केवल अंग्रेज़ी में है।",
    "lang.uncheckedShort": "मूल वक्ता की जाँच बाकी",

    "common.confirmLocally":
      "फसल की पसंद, लागत और वर्तमान योजना नियमों की पुष्टि हमेशा अपने स्थानीय कृषि कार्यालय या किसान खिदमत घर से करें।",
    "common.notOfficial":
      "यह एक काम करने वाला प्रोटोटाइप है, सरकारी सेवा नहीं। यह सवाल तैयार करने में मदद करता है। यह ज़मीन की पुष्टि नहीं कर सकता, योजना मंजूर नहीं कर सकता, और फसल की गारंटी नहीं दे सकता।",
    "common.illustrative": "उदाहरणात्मक",
    "common.yourAnswers": "आपके जवाब",
    "common.regional": "क्षेत्रीय पृष्ठभूमि",
    "common.liveWeather": "लाइव मौसम",
    "common.askOfficer": "अधिकारी से पूछें",
    "common.roughEstimate": "अनुमानित, स्थानीय रूप से पुष्टि करें",
    "land.title": "{district} की ज़मीन",
    "land.summary": "{district}: प्रकाशित स्रोत क्या कहते हैं",
    "land.height": "ऊँचाई",
    "land.rain": "वर्षा",
    "land.soils": "मिट्टी",
    "land.crops": "खेत की फ़सलें",
    "land.fruit": "फल",
    "land.glance": "एक नज़र में",
    "land.area": "क्षेत्रफल",
    "land.population": "जनसंख्या",
    "land.blocks": "ब्लॉक",
    "land.tehsils": "तहसीलें",
    "land.villages": "राजस्व गाँव",
    "land.utTitle": "पूरे केंद्र शासित प्रदेश में",
    "land.forest": "वन क्षेत्र",
    "land.sown": "शुद्ध बोया गया क्षेत्र",
    "land.irrigated": "सिंचित",
    "land.nearby": "{division} संभाग के अन्य ज़िले",
    "land.division.Kashmir": "कश्मीर",
    "land.division.Jammu": "जम्मू",
    "land.copy": "ये विवरण कॉपी करें",
    "land.copied": "कॉपी हो गया",
    "land.copyManual": "कॉपी करने के लिए ऊपर का पाठ चुनें",
    "land.sources": "यह जानकारी कहाँ से है",
    "land.villageCounts": "2011 की जनगणना में केंद्र शासित प्रदेश में {villages} गाँव, {revenue} राजस्व गाँव और {halqas} पटवार हल्के हैं।",
    "land.villageSource": "गाँवों की गिनती:",
  };

  // Urdu, right to left. Same coverage as Hindi.
  var UR = {
    "nav.home": "ہوم",
    "nav.plan": "منصوبہ شروع کریں",
    "nav.weather": "موسم",
    "nav.plans": "میرے منصوبے",
    "nav.about": "بارے میں",
    "nav.menu": "مینو",
    "nav.language": "زبان",

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
  };

  // `reviewed` is false until a native speaker has checked the agricultural
  // wording. The interface shows a notice while it is false.
  var LANGS = {
    en: { label: "English", dir: "ltr", ready: true, reviewed: true, strings: EN },
    hi: { label: "हिन्दी", dir: "ltr", ready: true, reviewed: false, strings: HI },
    ur: { label: "اردو", dir: "rtl", ready: true, reviewed: false, strings: UR },
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

  function available() {
    return Object.keys(LANGS)
      .filter(function (code) {
        return LANGS[code].ready;
      })
      .map(function (code) {
        return {
          code: code,
          label: LANGS[code].label,
          dir: LANGS[code].dir,
          reviewed: !!LANGS[code].reviewed,
        };
      });
  }

  function dictFor(lang) {
    var entry = LANGS[lang || current];
    return entry && entry.strings ? entry.strings : EN;
  }

  /**
   * Translate one key. A missing key falls back to English, and then to the
   * caller's fallback if it was given, so a half-filled language can never
   * blank a screen or print a raw key at a farmer.
   */
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

  function tr(key, fallback, vars) {
    var dict = dictFor(current);
    if (!Object.prototype.hasOwnProperty.call(dict, key) && !Object.prototype.hasOwnProperty.call(EN, key)) {
      return fallback == null ? key : fallback;
    }
    return t(key, vars);
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

  function reviewed(lang) {
    var code = lang || current;
    return !!(LANGS[code] && LANGS[code].reviewed);
  }

  /**
   * The label for a language in the switcher. A language no native speaker has
   * checked is marked in the menu itself, where the choice is made, not only in
   * the notice that appears after the reader has already switched to it. The
   * marker is driven by the same `reviewed` flag as the notice, so it cannot be
   * removed by editing a label: setting `reviewed: true` is the only way, and
   * that needs a person and a date behind it.
   */
  function optionLabel(code) {
    var entry = LANGS[code];
    if (!entry) return "";
    if (entry.reviewed) return entry.label;
    var note =
      (entry.strings && entry.strings["lang.uncheckedShort"]) || EN["lang.uncheckedShort"];
    return entry.label + " \u2014 " + note;
  }

  function register(lang, dict) {
    if (!lang || !dict) return;
    var existing = LANGS[lang] || { label: lang, dir: "ltr", ready: false, reviewed: false, strings: {} };
    existing.strings = dict;
    LANGS[lang] = existing;
  }

  function markReady(lang, ok) {
    if (!LANGS[lang]) return;
    LANGS[lang].ready = ok !== false;
  }

  function markReviewed(lang, ok) {
    if (!LANGS[lang]) return;
    LANGS[lang].reviewed = ok === true;
  }

  function setLabel(lang, label, dirValue) {
    if (!LANGS[lang]) return;
    if (label) LANGS[lang].label = label;
    if (dirValue) LANGS[lang].dir = dirValue;
  }

  function keys() {
    return Object.keys(EN);
  }

  function dict(lang) {
    return dictFor(lang || "en");
  }

  /**
   * Paint every element carrying data-i18n. An element whose key has no
   * translation is left exactly as it is, so the English already in the
   * markup stands and a missing string can never blank a screen.
   */
  function apply(root) {
    var scope = root || (typeof document !== "undefined" ? document : null);
    if (!scope || !scope.querySelectorAll) return;
    var nodes = scope.querySelectorAll("[data-i18n]");
    Array.prototype.forEach.call(nodes, function (el) {
      var key = el.getAttribute("data-i18n");
      var d = dictFor(current);
      if (Object.prototype.hasOwnProperty.call(d, key)) {
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
    tr: tr,
    register: register,
    markReady: markReady,
    markReviewed: markReviewed,
    setLabel: setLabel,
    available: available,
    reviewed: reviewed,
    optionLabel: optionLabel,
    set: set,
    get: get,
    dir: dir,
    apply: apply,
    keys: keys,
    dict: dict,
  };
})();
