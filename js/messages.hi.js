/**
 * Hindi strings, loaded only when Hindi is chosen.
 *
 * Hindi is left to right. Same coverage as English: the screens a farmer
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

  var HI = {
    "nav.home": "होम",
    "nav.plan": "योजना शुरू करें",
    "nav.weather": "मौसम",
    "nav.plans": "मेरी योजनाएं",
    "nav.about": "बारे में",
    "nav.menu": "मेनू",
    "nav.language": "भाषा",
    "footer.privacy": "गोपनीयता नीति",
    "footer.terms": "सेवा की शर्तें",

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

    "source.scope": "दायरा",

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

    "data.title": "इस डिवाइस पर",
    "data.intro":
      "यह ऐप जो कुछ भी रखता है, इसी फ़ोन के इस ब्राउज़र में रहता है। कोई खाता नहीं और सर्वर पर कोई प्रतिलिपि नहीं। यहाँ से आप बैकअप ले सकते हैं, उसे वापस ला सकते हैं, या सब कुछ मिटा सकते हैं।",
    "data.storedHeading": "यहाँ क्या रखा है",
    "data.backupHeading": "बैकअप",
    "data.dangerHeading": "मिटाएँ",
    "data.plansCount": "सहेजी गई योजनाएँ: {count}",
    "data.draftYes": "उस फ़ॉर्म का मसौदा जिस पर आपने आखिरी बार काम किया",
    "data.draftNo": "कोई मसौदा सहेजा नहीं गया",
    "data.langYes": "आपकी भाषा का चयन",
    "data.none": "अभी कोई योजना सहेजी नहीं गई।",
    "data.export": "सारा डेटा निर्यात करें",
    "data.exportHint":
      "आपकी योजनाओं और मसौदे के साथ एक JSON फ़ाइल सहेजता है। यह इसी डिवाइस पर लिखी जाती है, कहीं अपलोड नहीं होती।",
    "data.import": "बैकअप आयात करें",
    "data.importHint":
      "इस ऐप से बनी बैकअप फ़ाइल चुनें। यह यहाँ मौजूद डेटा की जगह लेगी, इसलिए पहले निर्यात कर लें।",
    "data.deleteAll": "इस डिवाइस से सब कुछ मिटाएँ",
    "data.deleteHint":
      "हर योजना, मसौदा, भाषा का चयन और फ़ीडबैक के जवाब हट जाएँगे। इसे वापस नहीं लाया जा सकता।",
    "data.back": "मेरी योजनाओं पर वापस",
    "data.exported": "बैकअप इस डिवाइस पर JSON फ़ाइल के रूप में सहेजा गया।",
    "data.imported": "{count} योजनाएँ बहाल हुईं। आपकी सहेजी योजनाएँ अब फ़ाइल से मिलती हैं।",
    "data.deleted": "इस ऐप ने इस डिवाइस पर जो कुछ रखा था, वह हटा दिया गया है।",
    "data.refused": "आयात नहीं हुआ: {why}",
    "data.confirmImport":
      "इस डिवाइस पर रखे डेटा को इस बैकअप से बदलें? यहाँ मौजूद योजनाएँ और मसौदा हट जाएँगे।",
    "data.confirmDelete":
      "इस डिवाइस से हर योजना, मसौदा, भाषा का चयन और फ़ीडबैक के जवाब मिटाएँ? इसे वापस नहीं लाया जा सकता।",
    "notes.label": "इस ज़मीन के लिए टिप्पणी",
    "notes.hint": "अधिकारी ने क्या कहा और आगे क्या करना है। योजना के साथ इसी डिवाइस पर रहता है।",
    "notes.save": "टिप्पणी सहेजें",
    "notes.saved": "टिप्पणी योजना के साथ सहेजी गई।",

    "photos.title": "इस ज़मीन की तस्वीरें",
    "photos.note":
      "इसी डिवाइस पर रखी जाती हैं। हर तस्वीर सहेजने से पहले छोटी की जाती है और उसका स्थान डेटा हटा दिया जाता है। कहीं अपलोड नहीं होती।",
    "photos.slot.wide": "ज़मीन का चौड़ा नज़ारा",
    "photos.slot.ground": "ज़मीन का नज़दीकी नज़ारा",
    "photos.slot.water": "सबसे नज़दीक पानी का स्रोत",
    "photos.optional": "वैकल्पिक",
    "photos.take": "तस्वीर लें",
    "photos.choose": "गैलरी से चुनें",
    "photos.retake": "फिर से लें",
    "photos.remove": "तस्वीर हटाएँ",
    "photos.empty": "अभी कोई तस्वीर नहीं।",
    "photos.needPlan": "पहले यह योजना सहेजें, फिर तस्वीरें इसके साथ रखी जा सकती हैं।",
    "photos.saving": "तस्वीर इस डिवाइस पर सहेजी जा रही है...",
    "photos.saved": "तस्वीर योजना के साथ सहेजी गई।",
    "photos.tooSmall": "यह तस्वीर बहुत छोटी है। थोड़ा पास आकर फिर से लें।",
    "photos.tooDark": "यह तस्वीर बहुत अंधेरी है। बेहतर रोशनी में जाकर फिर से लें।",
    "photos.tooBright": "यह तस्वीर बहुत तेज़ रोशनी में है। धूप से हटकर फिर से लें।",
    "photos.blurry": "यह तस्वीर धुंधली लगती है। फ़ोन स्थिर रखकर फिर से लें।",
    "photos.quota": "इस डिवाइस में एक और तस्वीर के लिए जगह नहीं है। कोई तस्वीर हटाएँ या जगह खाली करें, फिर कोशिश करें।",
    "photos.failed": "तस्वीर पढ़ी नहीं जा सकी। दूसरी तस्वीर आज़माएँ।",
    "photos.share": "तस्वीरें साझा करें",
    "photos.noneToShare": "साझा करने के लिए अभी कोई तस्वीर नहीं।",
    "photos.downloaded": "यह ब्राउज़र फ़ाइलें साझा नहीं कर सकता, इसलिए तस्वीरें इस डिवाइस पर सहेज दी गईं।",
    "photos.confirmRemove": "यह तस्वीर इस डिवाइस से हटाएँ?",
    "photos.removed": "तस्वीर इस डिवाइस से हटा दी गई।",
    "photos.removeFailed": "डिवाइस ने तस्वीर हटाने से मना किया। फिर कोशिश करें।",
    "photos.timeline": "समय के साथ तस्वीरें",
    "photos.timelineNote": "इस योजना के लिए रखी हर तस्वीर, नई सबसे पहले, तारीख के साथ। दो चुनकर उन्हें साथ-साथ देखें।",
    "photos.compare": "तुलना करें",
    "photos.comparePicked": "चुनी गई",
    "photos.compareHint": "साथ-साथ देखने के लिए दो तस्वीरें चुनें।",
    "photos.compareTitle": "साथ-साथ",
    "photos.compareClear": "तुलना हटाएँ",
    "photos.photoNote": "टिप्पणी",
    "photos.photoNoteLabel": "इस तस्वीर के बारे में टिप्पणी",
    "photos.photoNoteSave": "टिप्पणी सहेजें",
    "photos.photoNoteSaved": "टिप्पणी तस्वीर के साथ सहेजी गई।",
    "photos.photoNoteFailed": "डिवाइस ने टिप्पणी सहेजने से मना किया। जगह खाली करके फिर कोशिश करें।",
    "photos.full": "इस योजना में पहले से 40 तस्वीरें हैं। एक और लेने के लिए कोई तस्वीर हटाएँ।",
    "observe.title": "तस्वीर का विवरण (अभी जुड़ा नहीं)",
    "observe.note": "इस बिल्ड में विवरण सेवा नहीं है। स्विच आपका चुनाव दर्ज करता है, पर कुछ नहीं भेजा जाता और दिखाने के लिए कुछ नहीं है।",
    "observe.limits": "जुड़ने पर भी यह केवल चार दिखने वाली बातें बता सकता है: ज़मीन का ढकाव, पानी, कोई ढाँचा और ढलान। यह फसल, मिट्टी, कीट या उपज का नाम नहीं लेगा, और सलाह नहीं देगा।",
    "observe.consent": "मैं समझता हूँ कि तस्वीर इस फ़ोन से बाहर जाएगी",
    "observe.try": "विवरण माँगें",
    "observe.notConnected": "इस बिल्ड में कोई विवरण सेवा नहीं जुड़ी, इसलिए कुछ नहीं भेजा गया।",
    "observe.needConsent": "पहले स्विच चालू करें। इसके बिना कुछ नहीं भेजा जाता।",
    "observe.needPhoto": "पहले एक तस्वीर लें।",
    "observe.consentOff": "इस फ़ोन से तस्वीरें नहीं भेजी जाएँगी।",
    "observe.unavailable": "विवरण सेवा बंद है, इसलिए कुछ नहीं भेजा गया।",
    "observe.limited": "आज के लिए बहुत सारे विवरण माँगे जा चुके हैं। कुछ नहीं भेजा गया।",
    "observe.refused": "विवरण सेवा ने अनुरोध ठुकरा दिया। कुछ नहीं दिखाया गया।",
    "observe.ready": "विवरण आया है। यह बिल्ड इसे अभी नहीं दिखाता।",
    "update.ready": "इस ऐप का एक नया संस्करण तैयार है।",
    "update.reload": "फिर से खोलें",

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
    "land.actions": "भूमि कार्ड की क्रियाएँ",
    "land.share": "साझा करें",
    "land.download": "टेक्स्ट फ़ाइल में सहेजें",
    "a11y.skip": "मुख्य सामग्री पर जाएँ",
    "offline.banner": "आप ऑफ़लाइन हैं। भूमि योजना इस डिवाइस पर काम करती रहेगी। मौसम के लिए इंटरनेट चाहिए।",
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
    "lazy.failed": "यह हिस्सा लोड नहीं हो सका। अपना कनेक्शन जाँचें और फिर कोशिश करें।",
    "lazy.retry": "फिर कोशिश करें",
  };

  if (window.MLMP_MESSAGES && window.MLMP_MESSAGES.register) {
    window.MLMP_MESSAGES.register("hi", HI);
  }
})();
