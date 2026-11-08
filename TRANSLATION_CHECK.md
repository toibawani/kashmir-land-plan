# Translation check

Every string the app shows on the critical path, in the three languages it offers. This file exists so a native speaker can review the wording without reading any code.

**These translations have not been checked by a native speaker.** They were written to be plain and short, and the app shows a notice while that is true. Do not change this line or mark a language reviewed until someone has actually read it.

## What still needs a person

- Every row below needs a fluent reader to confirm it says the same thing as the English, in the words a farmer in J&K would use.
- The agricultural nouns matter most: the words for a plot, an office, a scheme, a soil test and confirm-locally.
- The option text in the catalogue is still English only. That is deliberate, not a missing translation: translating agronomy without an officer reviewing it would be worse than leaving it in one language.
- If a language is corrected, edit `js/messages.js`, run `node tools/translation-check.js`, and commit the regenerated file.

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
| `common.confirmLocally` | Always confirm crop choices, costs, and current scheme rules with your local agriculture office or Kisan Khidmat Ghar. | फसल की पसंद, लागत और वर्तमान योजना नियमों की पुष्टि हमेशा अपने स्थानीय कृषि कार्यालय या किसान खिदमत घर से करें। | فصل کی پسند، لاگت اور موجودہ اسکیم قواعد کی تصدیق ہمیشہ اپنے مقامی زراعت کے دفتر یا کسان خدمت گھر سے کریں۔ |
| `common.notOfficial` | This is a working prototype, not a government service. It helps you prepare questions. It cannot verify land, approve a scheme, or guarantee that a crop will suit your plot. | यह एक काम करने वाला प्रोटोटाइप है, सरकारी सेवा नहीं। यह सवाल तैयार करने में मदद करता है। यह ज़मीन की पुष्टि नहीं कर सकता, योजना मंजूर नहीं कर सकता, और फसल की गारंटी नहीं दे सकता। | یہ ایک کام کرنے والا پروٹو ٹائپ ہے، سرکاری خدمت نہیں۔ یہ سوالات تیار کرنے میں مدد کرتا ہے۔ یہ زمین کی تصدیق نہیں کر سکتا، اسکیم منظور نہیں کر سکتا، اور فصل کی ضمانت نہیں دے سکتا۔ |
| `common.illustrative` | Illustrative | उदाहरणात्मक | مثالی |
| `common.yourAnswers` | Your answers | आपके जवाब | آپ کے جوابات |
| `common.regional` | Regional background | क्षेत्रीय पृष्ठभूमि | علاقائی پس منظر |
| `common.liveWeather` | Live weather | लाइव मौसम | لائیو موسم |
| `common.askOfficer` | Ask the officer | अधिकारी से पूछें | افسر سے پوچھیں |
| `common.roughEstimate` | Rough estimate, confirm locally | अनुमानित, स्थानीय रूप से पुष्टि करें | اندازہ، مقامی طور پر تصدیق کریں |
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

## Direction

- Urdu is right to left. The app sets `dir="rtl"` on the document and the layout mirrors; the catalogue prose stays left to right inside its own block.
- Hindi is left to right.
- Adding Kashmiri later is one object in `js/messages.js` plus a `LANGS` entry. No other file needs to change.
