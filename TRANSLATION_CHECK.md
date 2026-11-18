# Translation check

Every string the app shows on the critical path, in the three languages it offers. This file exists so a native speaker can review the wording without reading any code.

**These translations have not been checked by a native speaker.** They were written to be plain and short, and the app shows a notice while that is true. Do not change this line or mark a language reviewed until someone has actually read it.

## What still needs a person

- Every row below needs a fluent reader to confirm it says the same thing as the English, in the words a farmer in J&K would use.
- The agricultural nouns matter most: the words for a plot, an office, a scheme, a soil test and confirm-locally.
- The option text in the catalogue is still English only. That is deliberate, not a missing translation: translating agronomy without an officer reviewing it would be worse than leaving it in one language.
- If English is corrected, edit `js/messages.js`. Hindi lives in `js/messages.hi.js` and Urdu in `js/messages.ur.js`; each is fetched only when that language is chosen. Run `node tools/translation-check.js` and commit the regenerated file.

## Strings

| Key | English | हिन्दी | اردو |
| --- | --- | --- | --- |
| `nav.home` | Home | होम | ہوم |
| `nav.plan` | Start plan | योजना शुरू करें | منصوبہ شروع کریں |
| `nav.weather` | Weather | मौसम | موسم |
| `nav.plans` | My plans | मेरी योजनाएं | میرے منصوبے |
| `nav.about` | About | बारे में | بارے میں |
| `nav.menu` | Menu | मेनू | مینو |
| `nav.language` | Language | भाषा | زبان |
| `footer.privacy` | Privacy Policy | गोपनीयता नीति | رازداری کی پالیسی |
| `footer.terms` | Terms of Service | सेवा की शर्तें | خدمات کی شرائط |
| `home.eyebrow` | For farmers in Jammu and Kashmir | जम्मू और कश्मीर के किसानों के लिए | جموں اور کشمیر کے کسانوں کے لیے |
| `home.title` | My Land, My Plan | मेरी ज़मीन, मेरी योजना | میری زمین، میرا منصوبہ |
| `home.lead` | An offline-first land planning app that helps you prepare practical options and questions for the agriculture office, without inventing scheme eligibility or crop guarantees. | एक ऑफ़लाइन ज़मीन योजना ऐप, जो आपको व्यावहारिक विकल्प और कृषि कार्यालय के लिए सवाल तैयार करने में मदद करता है। यह योजना की पात्रता या फसल की गारंटी नहीं बनाता। | ایک آف لائن زمین منصوبہ بندی ایپ، جو آپ کو عملی اختیارات اور زراعت کے دفتر کے لیے سوالات تیار کرنے میں مدد کرتی ہے۔ یہ کسی اسکیم کی اہلیت یا فصل کی ضمانت نہیں بناتی۔ |
| `home.start` | Start a land plan | ज़मीन योजना शुरू करें | زمین کا منصوبہ شروع کریں |
| `home.demo` | Try sample journey | नमूना यात्रा आज़माएं | نمونہ سفر آزمائیں |
| `home.note` | Prepare for the agriculture office visit. This is not a government service, and nothing it suggests has been approved. | कृषि कार्यालय की यात्रा की तैयारी करें। यह सरकारी सेवा नहीं है, और इसका कोई सुझाव मंजूर नहीं है। | زراعت کے دفتر کے دورے کی تیاری کریں۔ یہ سرکاری خدمت نہیں ہے، اور اس کی کوئی تجویز منظور نہیں ہے۔ |
| `home.points.enterTitle` | What you enter | आप क्या दर्ज करते हैं | آپ کیا درج کرتے ہیں |
| `home.points.enterBody` | District, altitude zone, village, plot size, water access, terrain, and the main constraint you face. Soil test is optional. | ज़िला, ऊंचाई क्षेत्र, गांव, ज़मीन का आकार, पानी की पहुंच, भूमि का प्रकार और मुख्य समस्या। मिट्टी परीक्षण वैकल्पिक है। | ضلع، بلندی کا علاقہ، گاؤں، زمین کا سائز، پانی کی رسائی، زمین کی قسم اور سب سے بڑا مسئلہ۔ مٹی کا ٹیسٹ اختیاری ہے۔ |
| `home.points.getTitle` | What you get | आपको क्या मिलता है | آپ کو کیا ملتا ہے |
| `home.points.getBody` | Two or three activity options to discuss, an office visit card, questions to ask, a checklist, and the official portals to check. | चर्चा के लिए दो या तीन विकल्प, कार्यालय यात्रा कार्ड, पूछने के सवाल, एक चेकलिस्ट और जांचने के लिए आधिकारिक पोर्टल। | بحث کے لیے دو یا تین اختیارات، دفتر کے دورے کا کارڈ، پوچھنے کے سوالات، ایک چیک لسٹ اور جانچنے کے لیے سرکاری پورٹل۔ |
| `form.location` | Location | स्थान | مقام |
| `form.district` | District | ज़िला | ضلع |
| `form.altitude` | Altitude zone | ऊंचाई क्षेत्र | بلندی کا علاقہ |
| `form.village` | Village or locality | गांव या इलाका | گاؤں یا محلہ |
| `form.size` | Plot size | ज़मीन का आकार | زمین کا سائز |
| `form.unit` | Unit | इकाई | اکائی |
| `form.water` | Current use and water | वर्तमान उपयोग और पानी | موجودہ استعمال اور پانی |
| `form.terrain` | Terrain and soil | भूमि और मिट्टी | زمین اور مٹی |
| `form.constraint` | Main constraint | मुख्य समस्या | سب سے بڑا مسئلہ |
| `form.required` | required | आवश्यक | ضروری |
| `form.continue` | Continue | आगे बढ़ें | آگے بڑھیں |
| `form.back` | Back | पीछे | پیچھے |
| `form.submit` | See options | विकल्प देखें | اختیارات دیکھیں |
| `form.saveDraft` | Save draft on this device | इस डिवाइस पर ड्राफ्ट सहेजें | اس ڈیوائس پر ڈرافٹ محفوظ کریں |
| `form.selectDistrict` | Select district | ज़िला चुनें | ضلع منتخب کریں |
| `form.selectAltitude` | Select the ground you farm | जिस ज़मीन पर खेती करते हैं उसे चुनें | جس زمین پر کاشت کرتے ہیں وہ منتخب کریں |
| `altitude.valley` | Valley or low ground | घाटी या नीची ज़मीन | وادی یا نشیبی زمین |
| `altitude.plains` | Plains and foothills | मैदान और तलहटी | میدان اور دامن |
| `altitude.hills` | Mid-altitude hills | मध्यम ऊंचाई की पहाड़ियां | درمیانی بلندی کی پہاڑیاں |
| `altitude.high_altitude` | High altitude | अधिक ऊंचाई | زیادہ بلندی |
| `form.landUse` | Current land use | वर्तमान भूमि उपयोग | زمین کا موجودہ استعمال |
| `form.landUse.unused` | Mostly unused | ज़्यादातर खाली | زیادہ تر خالی |
| `form.landUse.partly` | Partly used | कुछ हिस्सा उपयोग में | کچھ حصہ استعمال میں |
| `form.landUse.cultivated` | Currently cultivated | अभी खेती हो रही है | ابھی کاشت ہو رہی ہے |
| `form.water.reliable` | Reliable | भरोसेमंद | قابل بھروسہ |
| `form.water.seasonal` | Seasonal | मौसमी | موسمی |
| `form.water.limited` | Limited | सीमित | محدود |
| `form.water.unknown` | Not sure | पता नहीं | معلوم نہیں |
| `form.terrain.flat` | Mostly flat | ज़्यादातर समतल | زیادہ تر ہموار |
| `form.terrain.sloped` | Sloped or hilly | ढलान या पहाड़ी | ڈھلوان یا پہاڑی |
| `form.terrain.unknown` | Not sure | पता नहीं | معلوم نہیں |
| `form.soil` | Soil test (optional) | मिट्टी परीक्षण (वैकल्पिक) | مٹی کا ٹیسٹ (اختیاری) |
| `form.soil.none` | No recent soil test | हाल का कोई मिट्टी परीक्षण नहीं | حالیہ مٹی کا ٹیسٹ نہیں |
| `form.soil.done` | I have a recent soil test | मेरे पास हाल का मिट्टी परीक्षण है | میرے پاس حالیہ مٹی کا ٹیسٹ ہے |
| `form.soil.partial` | Partial or old results | आधा या पुराना परिणाम | ادھورا یا پرانا نتیجہ |
| `form.constraint.water` | Water | पानी | پانی |
| `form.constraint.cost` | Cost or investment | लागत या निवेश | لاگت یا سرمایہ |
| `form.constraint.labour` | Labour | मजदूरी | محنت |
| `form.constraint.advice` | Access to advice | सलाह तक पहुंच | مشورے تک رسائی |
| `form.constraint.market` | Market access | बाज़ार तक पहुंच | منڈی تک رسائی |
| `form.constraint.unsure` | Not sure | पता नहीं | معلوم نہیں |
| `results.title` | Possible activities to explore | खोजने के लिए संभावित गतिविधियां | دیکھنے کے لیے ممکنہ سرگرمیاں |
| `results.intro` | These are options to discuss, based on what you entered and on general information about your district. They are not an assessment of your plot, and they are not an approval of anything. | ये चर्चा के लिए विकल्प हैं, जो आपके जवाबों और ज़िले की सामान्य जानकारी पर आधारित हैं। ये आपकी ज़मीन का मूल्यांकन नहीं हैं, और किसी बात की मंजूरी भी नहीं हैं। | یہ بحث کے لیے اختیارات ہیں، جو آپ کے جوابات اور ضلع کی عام معلومات پر مبنی ہیں۔ یہ آپ کی زمین کا جائزہ نہیں ہیں، اور کسی بات کی منظوری بھی نہیں ہیں۔ |
| `results.edit` | Edit details | विवरण बदलें | تفصیلات بدلیں |
| `results.compare` | Compare options | विकल्पों की तुलना करें | اختیارات کا موازنہ کریں |
| `results.plans` | My saved plans | मेरी सहेजी योजनाएं | میرے محفوظ منصوبے |
| `results.reset` | Start over with new details | नए विवरण के साथ फिर शुरू करें | نئی تفصیلات کے ساتھ دوبارہ شروع کریں |
| `results.questionsTitle` | Questions to ask at the office | कार्यालय में पूछने के सवाल | دفتر میں پوچھنے کے سوالات |
| `results.questionsIntro` | Written from what you entered and from the options you marked. They are questions, not answers, and no officer has seen them. | आपके जवाबों और चुने गए विकल्पों से बने सवाल। ये सवाल हैं, जवाब नहीं, और किसी अधिकारी ने इन्हें नहीं देखा। | آپ کے جوابات اور منتخب اختیارات سے بنے سوالات۔ یہ سوال ہیں، جواب نہیں، اور کسی افسر نے انہیں نہیں دیکھا۔ |
| `results.gapTitle` | Not enough local data for this altitude | इस ऊंचाई के लिए पर्याप्त स्थानीय जानकारी नहीं | اس بلندی کے لیے کافی مقامی معلومات نہیں |
| `results.gapBody` | This catalogue has no honest data for this altitude zone. No options are shown here on purpose, because filling the gap with lowland crops would be a guess. Ask the officer which activities are actually practised at your height. | इस ऊंचाई क्षेत्र के लिए इस सूची में भरोसेमंद जानकारी नहीं है। यहां कोई विकल्प जानबूझकर नहीं दिखाया गया है, क्योंकि मैदानी फसलों से यह कमी भरना एक अनुमान होगा। अधिकारी से पूछें कि आपकी ऊंचाई पर कौन सी गतिविधियां वास्तव में की जाती हैं। | اس بلندی کے علاقے کے لیے اس فہرست میں قابلِ اعتماد معلومات نہیں ہیں۔ یہاں کوئی اختیار جان بوجھ کر نہیں دکھایا گیا، کیونکہ میدانی فصلوں سے یہ کمی پُر کرنا ایک اندازہ ہوگا۔ افسر سے پوچھیں کہ آپ کی بلندی پر کون سی سرگرمیاں واقعی کی جاتی ہیں۔ |
| `visit.title` | Office visit card | कार्यालय यात्रा कार्ड | دفتر کے دورے کا کارڈ |
| `visit.intro` | This is the one thing worth carrying to the office. It holds what you entered, the options you marked and the questions to ask, all on one page. Nothing on it is a recommendation, and none of it has been approved by anyone. | यही एक चीज़ है जो कार्यालय ले जाने लायक है। इसमें आपके जवाब, चुने गए विकल्प और पूछने के सवाल एक पेज पर हैं। इस पर कोई सिफारिश नहीं है, और इसे किसी ने मंजूर नहीं किया है। | یہی ایک چیز ہے جو دفتر لے جانے کے قابل ہے۔ اس میں آپ کے جوابات، منتخب اختیارات اور پوچھنے کے سوال ایک صفحے پر ہیں۔ اس پر کوئی سفارش نہیں ہے، اور اسے کسی نے منظور نہیں کیا۔ |
| `visit.print` | Print or save as PDF | प्रिंट करें या PDF सहेजें | پرنٹ کریں یا PDF محفوظ کریں |
| `visit.share` | Share on WhatsApp | WhatsApp पर भेजें | واٹس ایپ پر بھیجیں |
| `visit.download` | Download as text | टेक्स्ट के रूप में डाउनलोड करें | متن کے طور پر ڈاؤن لوڈ کریں |
| `visit.back` | Back to summary | सारांश पर वापस | خلاصے پر واپس |
| `visit.cardTitle` | My Land, My Plan: office visit card | मेरी ज़मीन, मेरी योजना: कार्यालय यात्रा कार्ड | میری زمین، میرا منصوبہ: دفتر کے دورے کا کارڈ |
| `visit.whatIEntered` | What I entered | मैंने क्या दर्ज किया | میں نے کیا درج کیا |
| `visit.options` | Options I want to discuss | जिन विकल्पों पर चर्चा करनी है | جن اختیارات پر بحث کرنی ہے |
| `visit.questions` | Questions I would like to ask | जो सवाल मैं पूछना चाहता हूं | جو سوال میں پوچھنا چاہتا ہوں |
| `visit.support` | Support worth asking about | जिन सहायता के बारे में पूछना चाहिए | جن مدد کے بارے میں پوچھنا چاہیے |
| `visit.notes` | Notes from the visit | यात्रा के नोट्स | دورے کے نوٹس |
| `visit.documents` | Documents to carry | साथ ले जाने वाले कागज़ | ساتھ لے جانے والے کاغذات |
| `visit.soil` | Soil checks | मिट्टी से जुड़ी जांच | مٹی سے متعلق جانچ |
| `visit.reference` | Plan reference | योजना संदर्भ | منصوبے کا حوالہ |
| `visit.foot` | This card was made by the farmer using a prototype, not by any department. It is not an official document and it does not establish eligibility for anything. | यह कार्ड किसान ने एक प्रोटोटाइप से बनाया है, किसी विभाग ने नहीं। यह सरकारी दस्तावेज़ नहीं है और किसी चीज़ की पात्रता सिद्ध नहीं करता। | یہ کارڈ کسان نے ایک پروٹو ٹائپ سے بنایا ہے، کسی محکمے نے نہیں۔ یہ سرکاری دستاویز نہیں ہے اور کسی چیز کی اہلیت ثابت نہیں کرتا۔ |
| `visit.visitMode` | Visit mode | यात्रा मोड | دورے کا موڈ |
| `visit.visitModeExit` | Done, leave visit mode | हो गया, यात्रा मोड से बाहर | ہو گیا، دورے کے موڈ سے باہر |
| `review.badgeNot` | Not reviewed by an officer yet | अभी किसी अधिकारी ने जांच नहीं की | ابھی کسی افسر نے جانچ نہیں کی |
| `review.badgeReviewed` | Reviewed by {name}, {office} on {date} | {name}, {office} द्वारा {date} को जांचा गया | {name}، {office} نے {date} کو جانچا |
| `review.notReviewed` | Not yet reviewed by an agriculture officer. Treat every suggestion as a question to discuss, not as advice to act on. Always confirm locally before acting. | अभी किसी कृषि अधिकारी ने जांच नहीं की। हर सुझाव को चर्चा का सवाल मानें, करने की सलाह नहीं। करने से पहले हमेशा स्थानीय रूप से पुष्टि करें। | ابھی کسی زرعی افسر نے جانچ نہیں کی۔ ہر تجویز کو بحث کا سوال سمجھیں، کرنے کا مشورہ نہیں۔ کرنے سے پہلے ہمیشہ مقامی طور پر تصدیق کریں۔ |
| `source.scope` | Scope | दायरा | دائرہ |
| `review.reviewed` | Reviewed by {name}, {office} on {date}. Still confirm locally before acting. | {name}, {office} द्वारा {date} को जांचा गया। फिर भी करने से पहले स्थानीय रूप से पुष्टि करें। | {name}، {office} نے {date} کو جانچا۔ پھر بھی کرنے سے پہلے مقامی طور پر تصدیق کریں۔ |
| `share.heading` | My land plan | मेरी ज़मीन योजना | میرا زمین منصوبہ |
| `share.plan` | Plan | योजना | منصوبہ |
| `share.options` | Options to discuss | चर्चा के विकल्प | بحث کے اختیارات |
| `share.questions` | Questions I want to ask | जो सवाल मैं पूछना चाहता हूं | جو سوال میں پوچھنا چاہتا ہوں |
| `share.carry` | Carry | साथ ले जाएं | ساتھ لے جائیں |
| `share.soil` | Soil checks | मिट्टी की जांच | مٹی کی جانچ |
| `share.marked` | (marked) | (चिह्नित) | (نشان زدہ) |
| `share.done` | [done] | [हो गया] | [ہو گیا] |
| `share.prepared` | Prepared | तैयार | تیار |
| `share.madeWith` | Made with the My Land, My Plan prototype. Not an official document. | माई लैंड, माई प्लान प्रोटोटाइप से बनाया गया। सरकारी दस्तावेज़ नहीं। | مائی لینڈ، مائی پلان پروٹو ٹائپ سے بنایا گیا۔ سرکاری دستاویز نہیں۔ |
| `lang.notice` | This translation has not been checked by a native speaker yet. Option details are still in English. Always confirm locally before acting. | इस अनुवाद को अभी किसी मूल वक्ता ने नहीं जांचा। विकल्पों का विवरण अभी अंग्रेज़ी में है। करने से पहले हमेशा स्थानीय रूप से पुष्टि करें। | اس ترجمے کی ابھی کسی مادری زبان بولنے والے نے جانچ نہیں کی۔ اختیارات کی تفصیل ابھی انگریزی میں ہے۔ کرنے سے پہلے ہمیشہ مقامی طور پر تصدیق کریں۔ |
| `lang.englishOnly` | Option details are in English only for now. | विकल्पों का विवरण अभी केवल अंग्रेज़ी में है। | اختیارات کی تفصیل ابھی صرف انگریزی میں ہے۔ |
| `lang.uncheckedShort` | native-speaker check pending | मूल वक्ता की जाँच बाकी | مادری زبان والے کی جانچ باقی |
| `data.title` | On this device | इस डिवाइस पर | اس ڈیوائس پر |
| `data.intro` | Everything this app keeps stays in this browser on this phone. There is no account and no server copy. From here you can take a backup, restore one, or delete it all. | यह ऐप जो कुछ भी रखता है, इसी फ़ोन के इस ब्राउज़र में रहता है। कोई खाता नहीं और सर्वर पर कोई प्रतिलिपि नहीं। यहाँ से आप बैकअप ले सकते हैं, उसे वापस ला सकते हैं, या सब कुछ मिटा सकते हैं। | یہ ایپ جو کچھ رکھتی ہے، اسی فون کے اسی براؤزر میں رہتا ہے۔ کوئی اکاؤنٹ نہیں اور سرور پر کوئی نقل نہیں۔ یہاں سے آپ بیک اپ لے سکتے ہیں، واپس لا سکتے ہیں، یا سب کچھ مٹا سکتے ہیں۔ |
| `data.storedHeading` | What is stored here | यहाँ क्या रखा है | یہاں کیا رکھا ہے |
| `data.backupHeading` | Backup | बैकअप | بیک اپ |
| `data.dangerHeading` | Delete | मिटाएँ | مٹائیں |
| `data.plansCount` | Saved plans: {count} | सहेजी गई योजनाएँ: {count} | محفوظ منصوبے: {count} |
| `data.draftYes` | A draft of the form you last worked on | उस फ़ॉर्म का मसौदा जिस पर आपने आखिरी बार काम किया | اس فارم کا مسودہ جس پر آپ نے آخری بار کام کیا |
| `data.draftNo` | No draft saved | कोई मसौदा सहेजा नहीं गया | کوئی مسودہ محفوظ نہیں |
| `data.langYes` | Your language choice | आपकी भाषा का चयन | آپ کی زبان کا انتخاب |
| `data.none` | No saved plans yet. | अभी कोई योजना सहेजी नहीं गई। | ابھی کوئی منصوبہ محفوظ نہیں۔ |
| `data.export` | Export all data | सारा डेटा निर्यात करें | سارا ڈیٹا برآمد کریں |
| `data.exportHint` | Saves one JSON file with your plans and draft. It is written to this device, and nothing is uploaded. | आपकी योजनाओं और मसौदे के साथ एक JSON फ़ाइल सहेजता है। यह इसी डिवाइस पर लिखी जाती है, कहीं अपलोड नहीं होती। | آپ کے منصوبوں اور مسودے کے ساتھ ایک JSON فائل محفوظ کرتا ہے۔ یہ اسی ڈیوائس پر لکھی جاتی ہے، کہیں اپ لوڈ نہیں ہوتی۔ |
| `data.import` | Import a backup | बैकअप आयात करें | بیک اپ درآمد کریں |
| `data.importHint` | Choose a backup file made by this app. It replaces what is here now, so export first if you want to keep it. | इस ऐप से बनी बैकअप फ़ाइल चुनें। यह यहाँ मौजूद डेटा की जगह लेगी, इसलिए पहले निर्यात कर लें। | اس ایپ سے بنی بیک اپ فائل چنیں۔ یہ یہاں موجود ڈیٹا کی جگہ لے گی، اس لیے پہلے برآمد کر لیں۔ |
| `data.deleteAll` | Delete everything on this device | इस डिवाइस से सब कुछ मिटाएँ | اس ڈیوائس سے سب کچھ مٹائیں |
| `data.deleteHint` | Removes every plan, the draft, the language choice and the feedback answers. This cannot be undone. | हर योजना, मसौदा, भाषा का चयन और फ़ीडबैक के जवाब हट जाएँगे। इसे वापस नहीं लाया जा सकता। | ہر منصوبہ، مسودہ، زبان کا انتخاب اور فیڈبیک کے جوابات ہٹ جائیں گے۔ اسے واپس نہیں لایا جا سکتا۔ |
| `data.back` | Back to my plans | मेरी योजनाओं पर वापस | میرے منصوبوں پر واپس |
| `data.exported` | Backup saved on this device as a JSON file. | बैकअप इस डिवाइस पर JSON फ़ाइल के रूप में सहेजा गया। | بیک اپ اس ڈیوائس پر JSON فائل کے طور پر محفوظ ہو گیا۔ |
| `data.imported` | {count} plans restored. Your saved plans now match the file. | {count} योजनाएँ बहाल हुईं। आपकी सहेजी योजनाएँ अब फ़ाइल से मिलती हैं। | {count} منصوبے بحال ہوئے۔ آپ کے محفوظ منصوبے اب فائل سے میل کھاتے ہیں۔ |
| `data.deleted` | Everything this app stored on this device has been removed. | इस ऐप ने इस डिवाइस पर जो कुछ रखा था, वह हटा दिया गया है। | اس ایپ نے اس ڈیوائس پر جو کچھ رکھا تھا، وہ ہٹا دیا گیا ہے۔ |
| `data.refused` | Not imported: {why} | आयात नहीं हुआ: {why} | درآمد نہیں ہوا: {why} |
| `data.confirmImport` | Replace what is stored on this device with this backup? The plans and draft here now will be removed. | इस डिवाइस पर रखे डेटा को इस बैकअप से बदलें? यहाँ मौजूद योजनाएँ और मसौदा हट जाएँगे। | اس ڈیوائس پر رکھا ڈیٹا اس بیک اپ سے بدلیں؟ یہاں موجود منصوبے اور مسودہ ہٹ جائیں گے۔ |
| `data.confirmDelete` | Delete every plan, the draft, the language choice and the feedback answers from this device? This cannot be undone. | इस डिवाइस से हर योजना, मसौदा, भाषा का चयन और फ़ीडबैक के जवाब मिटाएँ? इसे वापस नहीं लाया जा सकता। | اس ڈیوائس سے ہر منصوبہ، مسودہ، زبان کا انتخاب اور فیڈبیک کے جوابات مٹائیں؟ اسے واپس نہیں لایا جا سکتا۔ |
| `notes.label` | Notes for this plot | इस ज़मीन के लिए टिप्पणी | اس زمین کے لیے نوٹ |
| `notes.hint` | What the officer said, and what to do next. Kept on this device with the plan. | अधिकारी ने क्या कहा और आगे क्या करना है। योजना के साथ इसी डिवाइस पर रहता है। | افسر نے کیا کہا اور آگے کیا کرنا ہے۔ منصوبے کے ساتھ اسی ڈیوائس پر رہتا ہے۔ |
| `notes.save` | Save note | टिप्पणी सहेजें | نوٹ محفوظ کریں |
| `notes.saved` | Note saved with this plan. | टिप्पणी योजना के साथ सहेजी गई। | نوٹ منصوبے کے ساتھ محفوظ ہو گیا۔ |
| `photos.title` | Photos of this plot | इस ज़मीन की तस्वीरें | اس زمین کی تصاویر |
| `photos.note` | Kept on this device. Each photo is made smaller and its location data is dropped before it is stored. Nothing is uploaded. | इसी डिवाइस पर रखी जाती हैं। हर तस्वीर सहेजने से पहले छोटी की जाती है और उसका स्थान डेटा हटा दिया जाता है। कहीं अपलोड नहीं होती। | اسی ڈیوائس پر رکھی جاتی ہیں۔ ہر تصویر محفوظ کرنے سے پہلے چھوٹی کی جاتی ہے اور اس کا مقام کا ڈیٹا ہٹا دیا جاتا ہے۔ کہیں اپ لوڈ نہیں ہوتی۔ |
| `photos.slot.wide` | Wide view of the plot | ज़मीन का चौड़ा नज़ारा | زمین کا وسیع منظر |
| `photos.slot.ground` | Ground close-up | ज़मीन का नज़दीकी नज़ारा | زمین کا قریبی منظر |
| `photos.slot.water` | Nearest water source | सबसे नज़दीक पानी का स्रोत | قریب ترین پانی کا ذریعہ |
| `photos.optional` | optional | वैकल्पिक | اختیاری |
| `photos.take` | Take photo | तस्वीर लें | تصویر لیں |
| `photos.choose` | Choose from gallery | गैलरी से चुनें | گیلری سے چنیں |
| `photos.retake` | Retake | फिर से लें | دوبارہ لیں |
| `photos.remove` | Delete photo | तस्वीर हटाएँ | تصویر ہٹائیں |
| `photos.empty` | No photo yet. | अभी कोई तस्वीर नहीं। | ابھی کوئی تصویر نہیں۔ |
| `photos.needPlan` | Save this plan first, then photos can be kept with it. | पहले यह योजना सहेजें, फिर तस्वीरें इसके साथ रखी जा सकती हैं। | پہلے یہ منصوبہ محفوظ کریں، پھر تصاویر اس کے ساتھ رکھی جا سکتی ہیں۔ |
| `photos.saving` | Saving the photo on this device... | तस्वीर इस डिवाइस पर सहेजी जा रही है... | تصویر اس ڈیوائس پر محفوظ ہو رہی ہے... |
| `photos.saved` | Photo saved with this plan. | तस्वीर योजना के साथ सहेजी गई। | تصویر منصوبے کے ساتھ محفوظ ہو گئی۔ |
| `photos.tooSmall` | This photo is too small to be useful. Move closer and take it again. | यह तस्वीर बहुत छोटी है। थोड़ा पास आकर फिर से लें। | یہ تصویر بہت چھوٹی ہے۔ تھوڑا قریب آ کر دوبارہ لیں۔ |
| `photos.tooDark` | This photo is too dark. Move into better light and take it again. | यह तस्वीर बहुत अंधेरी है। बेहतर रोशनी में जाकर फिर से लें। | یہ تصویر بہت اندھیری ہے۔ بہتر روشنی میں جا کر دوبارہ لیں۔ |
| `photos.tooBright` | This photo is too bright. Move out of the sun and take it again. | यह तस्वीर बहुत तेज़ रोशनी में है। धूप से हटकर फिर से लें। | یہ تصویر بہت تیز روشنی میں ہے۔ دھوپ سے ہٹ کر دوبارہ لیں۔ |
| `photos.blurry` | This photo looks blurred. Hold the phone still and take it again. | यह तस्वीर धुंधली लगती है। फ़ोन स्थिर रखकर फिर से लें। | یہ تصویر دھندلی لگتی ہے۔ فون کو ساکن رکھ کر دوبارہ لیں۔ |
| `photos.quota` | This device has no room for another photo. Delete one, or free some space, then try again. | इस डिवाइस में एक और तस्वीर के लिए जगह नहीं है। कोई तस्वीर हटाएँ या जगह खाली करें, फिर कोशिश करें। | اس ڈیوائس میں ایک اور تصویر کی جگہ نہیں۔ کوئی تصویر ہٹائیں یا جگہ خالی کریں، پھر کوشش کریں۔ |
| `photos.failed` | The photo could not be read. Try another one. | तस्वीर पढ़ी नहीं जा सकी। दूसरी तस्वीर आज़माएँ। | تصویر پڑھی نہیں جا سکی۔ دوسری تصویر آزمائیں۔ |
| `photos.share` | Share the photos | तस्वीरें साझा करें | تصاویر شیئر کریں |
| `photos.noneToShare` | No photos to share yet. | साझा करने के लिए अभी कोई तस्वीर नहीं। | شیئر کرنے کے لیے ابھی کوئی تصویر نہیں۔ |
| `photos.downloaded` | This browser cannot share files, so the photos were saved on this device. | यह ब्राउज़र फ़ाइलें साझा नहीं कर सकता, इसलिए तस्वीरें इस डिवाइस पर सहेज दी गईं। | یہ براؤزر فائلیں شیئر نہیں کر سکتا، اس لیے تصاویر اس ڈیوائس پر محفوظ کر دی گئیں۔ |
| `photos.confirmRemove` | Delete this photo from this device? | यह तस्वीर इस डिवाइस से हटाएँ? | یہ تصویر اس ڈیوائس سے ہٹائیں؟ |
| `photos.removed` | Photo deleted from this device. | तस्वीर इस डिवाइस से हटा दी गई। | تصویر اس ڈیوائس سے ہٹا دی گئی۔ |
| `photos.removeFailed` | This device refused to delete the photo. Try again. | डिवाइस ने तस्वीर हटाने से मना किया। फिर कोशिश करें। | ڈیوائس نے تصویر ہٹانے سے انکار کیا۔ دوبارہ کوشش کریں۔ |
| `photos.timeline` | Photos over time | समय के साथ तस्वीरें | وقت کے ساتھ تصاویر |
| `photos.timelineNote` | Every photo kept for this plan, newest first, with the date it was taken. Pick two to see them side by side. | इस योजना के लिए रखी हर तस्वीर, नई सबसे पहले, तारीख के साथ। दो चुनकर उन्हें साथ-साथ देखें। | اس منصوبے کے لیے رکھی ہر تصویر، نئی پہلے، تاریخ کے ساتھ۔ دو چن کر انہیں ساتھ ساتھ دیکھیں۔ |
| `photos.compare` | Compare | तुलना करें | موازنہ کریں |
| `photos.comparePicked` | Picked | चुनी गई | منتخب |
| `photos.compareHint` | Pick two photos to see them side by side. | साथ-साथ देखने के लिए दो तस्वीरें चुनें। | ساتھ ساتھ دیکھنے کے لیے دو تصاویر چنیں۔ |
| `photos.compareTitle` | Side by side | साथ-साथ | ساتھ ساتھ |
| `photos.compareClear` | Clear the comparison | तुलना हटाएँ | موازنہ ہٹائیں |
| `photos.photoNote` | Note | टिप्पणी | نوٹ |
| `photos.photoNoteLabel` | Note about this photo | इस तस्वीर के बारे में टिप्पणी | اس تصویر کے بارے میں نوٹ |
| `photos.photoNoteSave` | Save note | टिप्पणी सहेजें | نوٹ محفوظ کریں |
| `photos.photoNoteSaved` | Note saved with this photo. | टिप्पणी तस्वीर के साथ सहेजी गई। | نوٹ تصویر کے ساتھ محفوظ ہو گیا۔ |
| `photos.photoNoteFailed` | This device refused to store the note. Free some space and try again. | डिवाइस ने टिप्पणी सहेजने से मना किया। जगह खाली करके फिर कोशिश करें। | ڈیوائس نے نوٹ محفوظ کرنے سے انکار کیا۔ جگہ خالی کر کے دوبارہ کوشش کریں۔ |
| `photos.full` | This plan already has the maximum of 40 photos. Delete one to take another. | इस योजना में पहले से 40 तस्वीरें हैं। एक और लेने के लिए कोई तस्वीर हटाएँ। | اس منصوبے میں پہلے سے 40 تصاویر ہیں۔ ایک اور لینے کے لیے کوئی تصویر ہٹائیں۔ |
| `observe.title` | Description of a photo (not connected) | तस्वीर का विवरण (अभी जुड़ा नहीं) | تصویر کی تفصیل (ابھی منسلک نہیں) |
| `observe.note` | This build has no description service. The switch records your choice, but nothing is sent and there is nothing to show yet. | इस बिल्ड में विवरण सेवा नहीं है। स्विच आपका चुनाव दर्ज करता है, पर कुछ नहीं भेजा जाता और दिखाने के लिए कुछ नहीं है। | اس بلڈ میں تفصیل کی سروس نہیں ہے۔ سوئچ آپ کا انتخاب محفوظ کرتا ہے، مگر کچھ نہیں بھیجا جاتا اور دکھانے کے لیے کچھ نہیں ہے۔ |
| `observe.limits` | Even when connected, it may report only four things it can see: ground cover, water, a structure, and slope. It will not name a crop, a soil, a pest or a yield, and it will not advise. | जुड़ने पर भी यह केवल चार दिखने वाली बातें बता सकता है: ज़मीन का ढकाव, पानी, कोई ढाँचा और ढलान। यह फसल, मिट्टी, कीट या उपज का नाम नहीं लेगा, और सलाह नहीं देगा। | منسلک ہونے پر بھی یہ صرف چار نظر آنے والی باتیں بتا سکتا ہے: زمین کا ڈھانپ، پانی، کوئی ڈھانچہ اور ڈھلوان۔ یہ فصل، مٹی، کیڑے یا پیداوار کا نام نہیں لے گا، اور مشورہ نہیں دے گا۔ |
| `observe.consent` | I understand that a photo would leave this phone | मैं समझता हूँ कि तस्वीर इस फ़ोन से बाहर जाएगी | میں سمجھتا ہوں کہ تصویر اس فون سے باہر جائے گی |
| `observe.try` | Ask for a description | विवरण माँगें | تفصیل طلب کریں |
| `observe.notConnected` | No description service is connected in this build, so nothing was sent. | इस बिल्ड में कोई विवरण सेवा नहीं जुड़ी, इसलिए कुछ नहीं भेजा गया। | اس بلڈ میں کوئی تفصیل سروس منسلک نہیں، اس لیے کچھ نہیں بھیجا گیا۔ |
| `observe.needConsent` | Turn the switch on first. Nothing is sent without it. | पहले स्विच चालू करें। इसके बिना कुछ नहीं भेजा जाता। | پہلے سوئچ آن کریں۔ اس کے بغیر کچھ نہیں بھیجا جاتا۔ |
| `observe.needPhoto` | Take a photo first. | पहले एक तस्वीर लें। | پہلے ایک تصویر لیں۔ |
| `observe.consentOff` | Photos will not be sent from this phone. | इस फ़ोन से तस्वीरें नहीं भेजी जाएँगी। | اس فون سے تصاویر نہیں بھیجی جائیں گی۔ |
| `observe.unavailable` | The description service is switched off, so nothing was sent. | विवरण सेवा बंद है, इसलिए कुछ नहीं भेजा गया। | تفصیل کی سروس بند ہے، اس لیے کچھ نہیں بھیجا گیا۔ |
| `observe.limited` | Too many descriptions have been asked for today. Nothing was sent. | आज के लिए बहुत सारे विवरण माँगे जा चुके हैं। कुछ नहीं भेजा गया। | آج کے لیے بہت سی تفصیلیں طلب کی جا چکی ہیں۔ کچھ نہیں بھیجا گیا۔ |
| `observe.refused` | The description service refused the request. Nothing was shown. | विवरण सेवा ने अनुरोध ठुकरा दिया। कुछ नहीं दिखाया गया। | تفصیل کی سروس نے درخواست مسترد کر دی۔ کچھ نہیں دکھایا گیا۔ |
| `observe.ready` | A description came back. This build does not show it yet. | विवरण आया है। यह बिल्ड इसे अभी नहीं दिखाता। | تفصیل موصول ہوئی ہے۔ یہ بلڈ اسے ابھی نہیں دکھاتا۔ |
| `update.ready` | A newer version of this app is ready. | इस ऐप का एक नया संस्करण तैयार है। | اس ایپ کا ایک نیا ورژن تیار ہے۔ |
| `update.reload` | Reload | फिर से खोलें | دوبارہ کھولیں |
| `common.confirmLocally` | Always confirm crop choices, costs, and current scheme rules with your local agriculture office or Kisan Khidmat Ghar. | फसल की पसंद, लागत और वर्तमान योजना नियमों की पुष्टि हमेशा अपने स्थानीय कृषि कार्यालय या किसान खिदमत घर से करें। | فصل کی پسند، لاگت اور موجودہ اسکیم قواعد کی تصدیق ہمیشہ اپنے مقامی زراعت کے دفتر یا کسان خدمت گھر سے کریں۔ |
| `common.notOfficial` | This is a working prototype, not a government service. It helps you prepare questions. It cannot verify land, approve a scheme, or guarantee that a crop will suit your plot. | यह एक काम करने वाला प्रोटोटाइप है, सरकारी सेवा नहीं। यह सवाल तैयार करने में मदद करता है। यह ज़मीन की पुष्टि नहीं कर सकता, योजना मंजूर नहीं कर सकता, और फसल की गारंटी नहीं दे सकता। | یہ ایک کام کرنے والا پروٹو ٹائپ ہے، سرکاری خدمت نہیں۔ یہ سوالات تیار کرنے میں مدد کرتا ہے۔ یہ زمین کی تصدیق نہیں کر سکتا، اسکیم منظور نہیں کر سکتا، اور فصل کی ضمانت نہیں دے سکتا۔ |
| `common.illustrative` | Illustrative | उदाहरणात्मक | مثالی |
| `common.yourAnswers` | Your answers | आपके जवाब | آپ کے جوابات |
| `common.regional` | Regional background | क्षेत्रीय पृष्ठभूमि | علاقائی پس منظر |
| `common.liveWeather` | Live weather | लाइव मौसम | لائیو موسم |
| `common.askOfficer` | Ask the officer | अधिकारी से पूछें | افسر سے پوچھیں |
| `common.roughEstimate` | Rough estimate, confirm locally | अनुमानित, स्थानीय रूप से पुष्टि करें | اندازہ، مقامی طور پر تصدیق کریں |
| `land.actions` | Land card actions | भूमि कार्ड की क्रियाएँ | زمین کارڈ کے اعمال |
| `land.share` | Share | साझा करें | شیئر کریں |
| `land.download` | Save as text file | टेक्स्ट फ़ाइल में सहेजें | متن فائل میں محفوظ کریں |
| `a11y.skip` | Skip to main content | मुख्य सामग्री पर जाएँ | مرکزی مواد پر جائیں |
| `offline.banner` | You are offline. The land plan still works on this device. Weather needs a connection. | आप ऑफ़लाइन हैं। भूमि योजना इस डिवाइस पर काम करती रहेगी। मौसम के लिए इंटरनेट चाहिए। | آپ آف لائن ہیں۔ زمین کا منصوبہ اس ڈیوائس پر کام کرتا رہے گا۔ موسم کے لیے انٹرنیٹ درکار ہے۔ |
| `land.title` | Land in {district} | {district} की ज़मीन | {district} کی زمین |
| `land.summary` | Land in {district}: what the published sources say | {district}: प्रकाशित स्रोत क्या कहते हैं | {district}: شائع شدہ ذرائع کیا کہتے ہیں |
| `land.height` | Height | ऊँचाई | اونچائی |
| `land.rain` | Rain | वर्षा | بارش |
| `land.soils` | Soils | मिट्टी | مٹی |
| `land.crops` | Field crops | खेत की फ़सलें | کھیت کی فصلیں |
| `land.fruit` | Fruit | फल | پھل |
| `land.glance` | At a glance | एक नज़र में | ایک نظر میں |
| `land.area` | Area | क्षेत्रफल | رقبہ |
| `land.population` | Population | जनसंख्या | آبادی |
| `land.blocks` | Blocks | ब्लॉक | بلاک |
| `land.tehsils` | Tehsils | तहसीलें | تحصیلیں |
| `land.villages` | Revenue villages | राजस्व गाँव | ریونیو گاؤں |
| `land.utTitle` | Across the Union Territory | पूरे केंद्र शासित प्रदेश में | پورے مرکز کے زیر انتظام علاقے میں |
| `land.forest` | Under forest | वन क्षेत्र | جنگلات |
| `land.sown` | Net area sown | शुद्ध बोया गया क्षेत्र | خالص بویا گیا رقبہ |
| `land.irrigated` | Irrigated | सिंचित | آبپاش |
| `land.nearby` | Other districts in the {division} division | {division} संभाग के अन्य ज़िले | {division} ڈویژن کے دیگر اضلاع |
| `land.division.Kashmir` | Kashmir | कश्मीर | کشمیر |
| `land.division.Jammu` | Jammu | जम्मू | جموں |
| `land.copy` | Copy these details | ये विवरण कॉपी करें | یہ تفصیل کاپی کریں |
| `land.copied` | Copied | कॉपी हो गया | کاپی ہو گئی |
| `land.copyManual` | Select the text above to copy | कॉपी करने के लिए ऊपर का पाठ चुनें | کاپی کرنے کے لیے اوپر کا متن منتخب کریں |
| `land.sources` | Where this comes from | यह जानकारी कहाँ से है | یہ معلومات کہاں سے ہیں |
| `land.villageCounts` | The Union Territory has {villages} villages in the 2011 census, {revenue} revenue villages and {halqas} patwar halqas. | 2011 की जनगणना में केंद्र शासित प्रदेश में {villages} गाँव, {revenue} राजस्व गाँव और {halqas} पटवार हल्के हैं। | 2011 کی مردم شماری میں مرکز کے زیر انتظام علاقے میں {villages} گاؤں، {revenue} ریونیو گاؤں اور {halqas} پٹوار حلقے ہیں۔ |
| `land.villageSource` | Village counts: | गाँवों की गिनती: | گاؤں کی گنتی: |
| `lazy.failed` | This part could not be loaded. Check your connection and try again. | यह हिस्सा लोड नहीं हो सका। अपना कनेक्शन जाँचें और फिर कोशिश करें। | یہ حصہ لوڈ نہیں ہو سکا۔ اپنا کنکشن دیکھیں اور دوبارہ کوشش کریں۔ |
| `lazy.retry` | Try again | फिर कोशिश करें | دوبارہ کوشش کریں |

## Direction

- Urdu is right to left. The app sets `dir="rtl"` on the document and the layout mirrors; the catalogue prose stays left to right inside its own block.
- Hindi is left to right.
- Adding Kashmiri later is one new `js/messages.ks.js`, one line in the `LANGS` table in `js/messages.js`, and one line in the loader and the service worker. No other file needs to change.
