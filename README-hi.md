# dsh-site-log-check — निर्माण स्थल के दैनिक पर्यवेक्षण लॉग की निरंतरता और स्थल-पर्यवेक्षण रिकॉर्ड की व्याप्ति की जाँच

[English](README.md) · [简体中文](README-zh.md) · [Español](README-es.md) · [Português](README-pt.md) · [हिन्दी](README-hi.md)

```sh
dsh plugin --profile <name> add dsh-site-log-check
```


[![DSH Market](https://raw.githubusercontent.com/2BingLing/dsh-market/master/assets/readme/badge-listed-en.svg)](https://dsh.market/)

`dsh-site-log-check` किसी निर्माण परियोजना का पर्यवेक्षण अभिलेख पढ़ता है — पर्यवेक्षण सेवा अवधि, दैनिक पर्यवेक्षण लॉग, स्थल-पर्यवेक्षण आवश्यक बताए गए मुख्य भागों और प्रक्रियाओं की घोषित सूची, और स्थल-पर्यवेक्षण रिकॉर्ड — और उसे अपने नियम-पैक में उद्धृत धाराओं से मिलाता है: क्या एक ही कैलेंडर दिन पर एक से अधिक लॉग हैं या कोई लॉग सेवा अवधि के बाहर की तारीख का है, अवधि के कौन-से दिन बिना लॉग हैं, क्या प्रत्येक लॉग अपने कॉलम भरता है और लेखक का नाम देता है, घोषित सूची मौजूद है और हर मुख्य भाग या प्रक्रिया का स्थल-पर्यवेक्षण रिकॉर्ड है, स्थल-पर्यवेक्षण रिकॉर्ड में आरंभ और समाप्ति समय क्रम में, मुख्य भाग या प्रक्रिया, निर्माण इकाई, जो पाया गया और हस्ताक्षर दर्ज हैं, और लॉग में बताया गया स्थल-पर्यवेक्षण उसी तारीख के रिकॉर्ड से मेल खाता है। जो दर्ज होता है वह शब्दशः अंतर है और हर अंतर के साथ उसकी धारा आती है; समीक्षा मनुष्य करता है।

## Install

```sh
dsh plugin --profile <name> add dsh-site-log-check
dsh --profile <name> --dump-config | grep 'dsh-site-log-check'
```

## आउटपुट कैसा दिखता है

![Terminal demo of dsh-site-log-check: real output over its SL-014 fixture](https://raw.githubusercontent.com/PerryLink/dsh-site-log-check/main/docs/assets/dsh-site-log-check-hero.png)

![Animated terminal demo of dsh-site-log-check](https://raw.githubusercontent.com/PerryLink/dsh-site-log-check/main/docs/assets/dsh-site-log-check-demo.gif)

इस प्लगइन का अपने ही `SL-014` टेस्ट फ़िक्स्चर पर वास्तविक आउटपुट — कोई नकली चित्र नहीं। नियम-पैक उद्धरण नहीं गढ़ता, इसलिए हर निष्कर्ष लागू किए गए खंड का नाम और यह भी बताता है कि उसका मूल पाठ इस बार प्राप्त नहीं हुआ।

## यह किन सवालों का जवाब देता है

| आपका सवाल | इसका जवाब |
|---|---|
| दो लॉग प्रविष्टियों पर एक ही कैलेंडर तारीख है — क्या यह दर्ज होता है? | हाँ। `SL-001` `params.maxPerDay` (1) लागू करता है और हर उस कैलेंडर दिन को दर्ज करता है जिस पर एक से अधिक लॉग हैं; वह उस लॉग को भी दर्ज करता है जिसकी तारीख `project.serviceStart` और `project.serviceEnd` से ली गई सेवा अवधि के बाहर है। यह तारीखों और गिनती की तुलना करता है; यह तय नहीं करता कि दोनों में से कौन-सी प्रविष्टि उस दिन की है, और न ही यह कि बाद में जोड़ी गई प्रविष्टि उचित थी। यदि सामग्री में कोई भी लॉग तारीख पढ़ी न जा सके, तो नियम चुपचाप पास होने के बजाय बताता है कि वह चल नहीं सका। |
| सेवा अवधि के बीच तीन दिन के लॉग नहीं हैं। जाँच क्या करती है? | `SL-002` `project.serviceStart` से `project.serviceEnd` के बीच उन कैलेंडर दिनों को गिनता है जिनका कोई लॉग नहीं है। यह पैक का एकमात्र `info` नियम है: तारीखें क्रमागत होने की बात फ़ूजियान प्रांतीय मानक DBJT 13-144-2019 में है, GB/T 50319-2013 में नहीं, इसलिए यह केवल चेताता है, रोकता नहीं। `params.minCoverageRatio` (0.9) से कम होने पर हर छूटा दिन अंतर के रूप में सूचीबद्ध होता है; उस अनुपात पर या उससे ऊपर नियम बताता है कि वह चल नहीं सका और वहीं छूटे दिनों के नाम देता है। अंतराल कार्य-रोकाव, अवकाश या बिना अभिलेखित लॉग के कारण था या नहीं, यह मनुष्य तय करता है। |
| किसी दिन के लॉग में समस्याओं वाला कॉलम खाली है। | `SL-006` उस प्रविष्टि को दर्ज करता है: हर दैनिक लॉग में उस दिन की समस्याओं और उनके समाधान का कॉलम भरा होना चाहिए। यह देखता है कि कॉलम भरा है, यह नहीं कि लिखा हुआ सही है, इसलिए «कुछ नहीं पाया गया» लिखी प्रविष्टि पास होती है और खाली सेल नहीं। पैक दर्ज करता है कि 第7.2.2条第4款 के दो उपलब्ध पाठों का शब्दों में अंतर है और आधिकारिक स्कैन दोबारा नहीं पढ़ा जा सका, इसलिए नियम जानबूझकर शब्दों पर टिप्पणी नहीं करता और केवल यह देखता है कि कॉलम भरा है या नहीं। |
| सामग्री में यह घोषित नहीं है कि किन मुख्य भागों और प्रक्रियाओं पर स्थल-पर्यवेक्षण चाहिए। क्या यह चुपचाप पास हो जाता है? | नहीं। जब सामग्री से दिखे कि स्थल-पर्यवेक्षण हुआ (कोई स्थल-पर्यवेक्षण रिकॉर्ड मौजूद है, या किसी लॉग के पर्यवेक्षण कॉलम में 旁站 का उल्लेख है), तब `SL-008` घोषित सूची के छूटने को दर्ज करता है। जब स्थल-पर्यवेक्षण का कोई संकेत न हो, तो नियम उस कारण के साथ बताता है कि वह चल नहीं सका, बजाय इसके कि परियोजना पर ऐसी माँग गढ़ी जाए जो उस पर लागू ही न हो। पैक नोट करता है कि GB/T 50319-2013 का पाठ इन भागों और प्रक्रियाओं की सूची नहीं देता, और सूची 建市〔2002〕189号第二条 से आती है। |
| हमारे स्थल-पर्यवेक्षण रिकॉर्ड पर केवल पर्यवेक्षक के हस्ताक्षर हैं। क्या यह दर्ज होता है? | हाँ। `params.requireContractorSignature` चालू होने पर `SL-011` 旁站监理人员 के हस्ताक्षर छूटने और 施工企业现场质检人员 के हस्ताक्षर छूटने, दोनों को दर्ज करता है। पैक जानबूझकर दो आधार अलग रखता है: 表 A.0.6 में केवल 旁站监理人员（签字） का खाना है, और दूसरा हस्ताक्षर 建市〔2002〕189号第七条 से आता है, इसलिए उसे GB/T 50319-2013 के नाम नहीं लिखा जाना चाहिए। नियम देखता है कि हस्ताक्षर दर्ज हैं, यह नहीं कि वे असली हैं। |
| एक लॉग कहता है कि 12 मई को स्थल-पर्यवेक्षण हुआ, पर उस तारीख का कोई स्थल-पर्यवेक्षण रिकॉर्ड नहीं है। | `SL-013` इसे दर्ज करता है: यह उन दैनिक लॉग की तारीखों को, जिनके पर्यवेक्षण कॉलम में 旁站 का उल्लेख है, स्थल-पर्यवेक्षण रिकॉर्ड के आरंभ समय की तारीखों से मिलाता है। यह केवल देखता है कि दोनों मेल खाते हैं; पैक कहता है कि न GB/T 50319-2013 और न 建市〔2002〕189号 यह माँगते हैं कि दोनों दस्तावेज़ एक-दूसरे के क्रमांक से जुड़ें। यदि किसी भी स्थल-पर्यवेक्षण रिकॉर्ड में आरंभ समय न हो, या कोई लॉग स्थल-पर्यवेक्षण की घोषणा न करे, तो नियम चुपचाप पास होने के बजाय बताता है कि वह चल नहीं सका। |

## यह किन मानकों पर आधारित है

| दस्तावेज़ | संख्यांक | इन्हें उद्धृत करने वाले नियम |
|---|---|---|
| 《建设工程监理规范》 | GB/T 50319-2013 | SL-001, SL-002, SL-003, SL-004, SL-005, SL-006, SL-007, SL-008, SL-009, SL-010, SL-011, SL-013, SL-014 |
| 福建省《建设工程监理文件资料管理标准》 | DBJT 13-144-2019 | SL-002 |
| 《建设工程质量管理条例》 | 国务院令第279号 | SL-008 |
| 《房屋建筑工程施工旁站监理管理办法（试行）》 | 建市〔2002〕189号 | SL-011, SL-012 |

**Boundary:** this plugin checks the **continuity of the daily supervision log and the coverage of
on-site supervision records** for a construction project — the site-supervision domain (工程监理).
It is not `dsh-archive-check` (which checks whether project records are complete for archiving), not
`dsh-hazplan-check` (which checks the sections of a plan for a hazardous sub-project), and not a
site-safety inspector. It reads a machine-readable export of the supervision office's own records and
reports literal mismatches against cited clauses.

## Compatibility

| सतह | स्थिति |
|---|---|
| Harness | peer रेंज `>=0.1.2-rc.1 <0.2.0 \|\| >=0.2.0-0 <0.3.0` — `0.2.0-rc.2` और `0.2.1-rc.2` दोनों को स्वीकार करने के लिए सत्यापित। **`engines.dsh` `>=0.2.1-0 <0.3.0` के रूप में घोषित है** और 0.2.1 से होस्ट इसे लागू करता है |
| Node | `^22.19.0 || >=24.0.0` |
| प्लेटफ़ॉर्म | सभी (शुद्ध ESM; कोई नेटिव कोड नहीं, कोई नेटवर्क नहीं, कोई मॉडल कॉल नहीं) |
| टूल मोड | `native` और `ptc` में काम करता है; पूरे फ़ोल्डर के लिए `ptc` चुनें |

## What it does

नियम-सूची, फ़ील्ड और विस्तृत व्यवहार [README.md](README.md#what-it-does) (अंग्रेज़ी मुख्य संस्करण) में हैं। यह प्लगइन केवल उद्धृत धाराओं के सामने शाब्दिक अंतर सूचीबद्ध करता है और हर न चल पाई जाँच को `skipped` में बताता है।

## Configuration

सभी समायोज्य पैरामीटर `src/config.ts` की Schemastery स्कीमा में हैं, इसलिए कोड बदले बिना `cordis.yml` से बदले जा सकते हैं; प्रति-नियम सीमाएँ `rules/` के नियम-पैक में हैं।

| कुंजी | प्रकार | डिफ़ॉल्ट | विवरण |
|---|---|---|---|
| `rulesFile` | string | `rules/site-log-check.yaml` | नियम-पैक का पथ, पैकेज रूट के सापेक्ष |
| `disabledRules` | string[] | `[]` | बंद करने वाले नियम id; प्रत्येक `skipped` में दिखता है |
| `onlyRules` | string[] | `[]` | केवल ये नियम चलाएँ; खाली होने पर सभी नियम चलते हैं |
| `skipNotes` | string | `""` | हर `skipped` कारण के आगे जोड़ी जाने वाली टिप्पणी |
| `timeoutMs` | number | `120000` | उपकरण का सहकारी समय-सीमा बजट |

## Material format

JSON या YAML स्वीकार्य है। पूरा फ़ील्ड उदाहरण [README.md](README.md#material-format) (अंग्रेज़ी मुख्य संस्करण) में है। पढ़ने की परत में फ़ील्ड वैकल्पिक हैं और जाँच इंजन उन्हें सत्यापित करता है, इसलिए आंशिक निर्यात पर क्रैश के बजाय "अनुपस्थित" श्रेणी के निष्कर्ष मिलते हैं।

## Rule sources

नियम-डेटा कोड से अलग है: प्रत्येक नियम में दस्तावेज़, संख्या, स्रोत की अपनी क्रमांकन-प्रणाली के अनुसार धारा, शब्दशः उद्धरण और स्रोत URL होता है। लोडर लागू करता है कि उद्धरण कम से कम आठ अक्षरों का वास्तविक उद्धरण हो, और जिस जाँच का आधार केवल सामान्य सिद्धांत (`kind: derived-from-principle`, अधिकतम `warn`) या स्थानीय नीति (`kind: institutional-configuration`, अधिकतम `info`) हो, उसे कभी `error` घोषित न किया जाए।

सत्यापित सीमाएँ और जान-बूझकर **न** कहे गए निष्कर्ष [README.md](README.md#rule-sources) (अंग्रेज़ी मुख्य संस्करण) और `rules/evidence/` में हैं।

## Troubleshooting

- **प्लगइन इंस्टॉल हो गया पर टूल दिखता नहीं**: जाँचें कि `main` `lib/index.mjs` पर जाता है और `pnpm run build` ने उसे बनाया है।
- **`dsh plugin add` असंगत बताकर मना करता है**: peer range `0.1.x` और `0.2.x` दोनों को कवर करती है; बाहर होने पर स्पष्ट छूट दें: `dsh plugin --profile <name> allow-version <pkg@ver> --dsh-version <runtime> --accept-risk`।
- **कोई नियम नहीं चला**: `skipped` सरणी देखें।
- **`check` में `manifest-peers` विफल दिखता है**: यह `dsh-plugin-dev` की ज्ञात अपस्ट्रीम समस्या है; रनटाइम इंस्टॉल के समय अनुकूलता लागू करता है।
- **समय खिसका हुआ लगता है**: सारी गणना दिए गए स्ट्रिंग पर वॉल-क्लॉक है।

## Development

```sh
pnpm install
pnpm run typecheck
pnpm test
pnpm run build
node ../scripts/sync-shared.mjs dsh-site-log-check
```

अंतिम कमांड `../_shared` का साझा किट `src/shared/` में कॉपी करता है; हर साझा बदलाव के बाद इसे दोबारा चलाएँ।

## PerryLink DSH प्लगइन परिवार

यह प्रोजेक्ट [PerryLink](https://github.com/PerryLink) के DeepSeek Harness प्लगइन परिवार का हिस्सा है। पूरी सूची नीचे संक्षिप्त रखी गई है ताकि हर README की पहली स्क्रीन छोटी रहे; हर पंक्ति और उसकी स्थिति देखने के लिए इसे खोलें।

<details>
<summary>सभी प्लगइन खोलें</summary>

| प्लगइन | स्थिति |
|---|---|
| **[dsh-aqua-input-check](https://github.com/PerryLink/dsh-aqua-input-check)** |  |
| **[dsh-archive-check](https://github.com/PerryLink/dsh-archive-check)** |  |
| **[dsh-auto-review](https://github.com/PerryLink/dsh-auto-review)** |  |
| **[dsh-autotier](https://github.com/PerryLink/dsh-autotier)** |  |
| **[dsh-bid-ca-precheck](https://github.com/PerryLink/dsh-bid-ca-precheck)** |  |
| **[dsh-bid-qual-check](https://github.com/PerryLink/dsh-bid-qual-check)** |  |
| **[dsh-cert-mcp](https://github.com/PerryLink/dsh-cert-mcp)** |  |
| **[dsh-checkpoint-rewind](https://github.com/PerryLink/dsh-checkpoint-rewind)** |  |
| **[dsh-click](https://github.com/PerryLink/dsh-click)** |  |
| **[dsh-composer-history](https://github.com/PerryLink/dsh-composer-history)** |  |
| **[dsh-contract-stance](https://github.com/PerryLink/dsh-contract-stance)** |  |
| **[dsh-customs-doc-check](https://github.com/PerryLink/dsh-customs-doc-check)** |  |
| **[dsh-data-quality](https://github.com/PerryLink/dsh-data-quality)** |  |
| **[dsh-demurrage-ledger](https://github.com/PerryLink/dsh-demurrage-ledger)** |  |
| **[dsh-doublecheck](https://github.com/PerryLink/dsh-doublecheck)** |  |
| **[dsh-drill-script-check](https://github.com/PerryLink/dsh-drill-script-check)** |  |
| **[dsh-eia-guide-check](https://github.com/PerryLink/dsh-eia-guide-check)** |  |
| **[dsh-emergency-plan](https://github.com/PerryLink/dsh-emergency-plan)** |  |
| **[dsh-essay-rubric-check](https://github.com/PerryLink/dsh-essay-rubric-check)** |  |
| **[dsh-evidence-check](https://github.com/PerryLink/dsh-evidence-check)** |  |
| **[dsh-export-ctl-check](https://github.com/PerryLink/dsh-export-ctl-check)** |  |
| **[dsh-fast](https://github.com/PerryLink/dsh-fast)** |  |
| **[dsh-fmea-table-check](https://github.com/PerryLink/dsh-fmea-table-check)** |  |
| **[dsh-forecast-penalty](https://github.com/PerryLink/dsh-forecast-penalty)** |  |
| **[dsh-fund-research](https://github.com/PerryLink/dsh-fund-research)** |  |
| **[dsh-github](https://github.com/PerryLink/dsh-github)** |  |
| **[dsh-gongwen-flow-check](https://github.com/PerryLink/dsh-gongwen-flow-check)** |  |
| **[dsh-gongwen-word-check](https://github.com/PerryLink/dsh-gongwen-word-check)** |  |
| **[dsh-guard-plan-qc](https://github.com/PerryLink/dsh-guard-plan-qc)** |  |
| **[dsh-hazchem-check](https://github.com/PerryLink/dsh-hazchem-check)** |  |
| **[dsh-hazplan-check](https://github.com/PerryLink/dsh-hazplan-check)** |  |
| **[dsh-hidden-risk-map](https://github.com/PerryLink/dsh-hidden-risk-map)** |  |
| **[dsh-hs-classify](https://github.com/PerryLink/dsh-hs-classify)** |  |
| **[dsh-icd-rule-check](https://github.com/PerryLink/dsh-icd-rule-check)** |  |
| **[dsh-industry-research](https://github.com/PerryLink/dsh-industry-research)** |  |
| **[dsh-lawcite-adapter](https://github.com/PerryLink/dsh-lawcite-adapter)** |  |
| **[dsh-laya](https://github.com/PerryLink/dsh-laya)** |  |
| **[dsh-lc-doc-check](https://github.com/PerryLink/dsh-lc-doc-check)** |  |
| **[dsh-learning-gap-check](https://github.com/PerryLink/dsh-learning-gap-check)** |  |
| **[dsh-library](https://github.com/PerryLink/dsh-library)** |  |
| **[dsh-local-ai](https://github.com/PerryLink/dsh-local-ai)** |  |
| **[dsh-lsp-actions](https://github.com/PerryLink/dsh-lsp-actions)** |  |
| **[dsh-mask](https://github.com/PerryLink/dsh-mask)** |  |
| **[dsh-mcp-panel](https://github.com/PerryLink/dsh-mcp-panel)** |  |
| **[dsh-medrec-qc](https://github.com/PerryLink/dsh-medrec-qc)** |  |
| **[dsh-memento](https://github.com/PerryLink/dsh-memento)** |  |
| **[dsh-nsfc-form-check](https://github.com/PerryLink/dsh-nsfc-form-check)** |  |
| **[dsh-nurse-record-check](https://github.com/PerryLink/dsh-nurse-record-check)** |  |
| **[dsh-observe](https://github.com/PerryLink/dsh-observe)** |  |
| **[dsh-origin-rvc-check](https://github.com/PerryLink/dsh-origin-rvc-check)** |  |
| **[dsh-ota-review-check](https://github.com/PerryLink/dsh-ota-review-check)** |  |
| **[dsh-output-styles](https://github.com/PerryLink/dsh-output-styles)** |  |
| **[dsh-paper-doc-adapter](https://github.com/PerryLink/dsh-paper-doc-adapter)** |  |
| **[dsh-permission-rules](https://github.com/PerryLink/dsh-permission-rules)** |  |
| **[dsh-permit-report-check](https://github.com/PerryLink/dsh-permit-report-check)** |  |
| **[dsh-pipeline-check](https://github.com/PerryLink/dsh-pipeline-check)** |  |
| **[dsh-pleading-draft](https://github.com/PerryLink/dsh-pleading-draft)** |  |
| **[dsh-plugin-doctor](https://github.com/PerryLink/dsh-plugin-doctor)** |  |
| **[dsh-plugin-guide](https://github.com/PerryLink/dsh-plugin-guide)** |  |
| **[dsh-plugin-kit](https://github.com/PerryLink/dsh-plugin-kit)** |  |
| **[dsh-plugin-upgrade](https://github.com/PerryLink/dsh-plugin-upgrade)** |  |
| **[dsh-policy-brief-draft](https://github.com/PerryLink/dsh-policy-brief-draft)** |  |
| **[dsh-power-loss-split](https://github.com/PerryLink/dsh-power-loss-split)** |  |
| **[dsh-power-ticket-check](https://github.com/PerryLink/dsh-power-ticket-check)** |  |
| **[dsh-ppap-check](https://github.com/PerryLink/dsh-ppap-check)** |  |
| **[dsh-protest-deadline](https://github.com/PerryLink/dsh-protest-deadline)** |  |
| **[dsh-railway-window](https://github.com/PerryLink/dsh-railway-window)** |  |
| **[dsh-repair-order-qc](https://github.com/PerryLink/dsh-repair-order-qc)** |  |
| **[dsh-research-report](https://github.com/PerryLink/dsh-research-report)** |  |
| **[dsh-review-reply-check](https://github.com/PerryLink/dsh-review-reply-check)** |  |
| **[dsh-rulefile-check](https://github.com/PerryLink/dsh-rulefile-check)** |  |
| **[dsh-safety-brief-check](https://github.com/PerryLink/dsh-safety-brief-check)** |  |
| **[dsh-score](https://github.com/PerryLink/dsh-score)** |  |
| **[dsh-session-sync](https://github.com/PerryLink/dsh-session-sync)** |  |
| **[dsh-site-log-check](https://github.com/PerryLink/dsh-site-log-check)** |  |
| **[dsh-skill-pack-security](https://github.com/PerryLink/dsh-skill-pack-security)** |  |
| **[dsh-soe-decision-check](https://github.com/PerryLink/dsh-soe-decision-check)** |  |
| **[dsh-soilwater-check](https://github.com/PerryLink/dsh-soilwater-check)** |  |
| **[dsh-sop-sync-check](https://github.com/PerryLink/dsh-sop-sync-check)** |  |
| **[dsh-spc-gbt-adapter](https://github.com/PerryLink/dsh-spc-gbt-adapter)** |  |
| **[dsh-talk](https://github.com/PerryLink/dsh-talk)** |  |
| **[dsh-tender-extract](https://github.com/PerryLink/dsh-tender-extract)** |  |
| **[dsh-tender-matrix](https://github.com/PerryLink/dsh-tender-matrix)** |  |
| **[dsh-test-drive](https://github.com/PerryLink/dsh-test-drive)** |  |
| **[dsh-ticktick](https://github.com/PerryLink/dsh-ticktick)** |  |
| **[dsh-translate](https://github.com/PerryLink/dsh-translate)** |  |
| **[dsh-warranty-calc](https://github.com/PerryLink/dsh-warranty-calc)** |  |
| **[dsh-budget](https://github.com/PerryLink/dsh-budget)** | 🧊 फ़्रोज़न — रिपॉज़िटरी README देखें |
| **[dsh-claude-move](https://github.com/PerryLink/dsh-claude-move)** | 🧊 फ़्रोज़न — रिपॉज़िटरी README देखें |
| **[dsh-defend](https://github.com/PerryLink/dsh-defend)** | 🧊 फ़्रोज़न — रिपॉज़िटरी README देखें |
| **[dsh-draw](https://github.com/PerryLink/dsh-draw)** | 🧊 फ़्रोज़न — रिपॉज़िटरी README देखें |
| **[dsh-reach](https://github.com/PerryLink/dsh-reach)** | 🧊 फ़्रोज़न — रिपॉज़िटरी README देखें |
| **[dsh-background-agents](https://github.com/PerryLink/dsh-background-agents)** | 🚫 सेवानिवृत्त — रिपॉज़िटरी README देखें |
| **[dsh-session-pin](https://github.com/PerryLink/dsh-session-pin)** | 🚫 सेवानिवृत्त — रिपॉज़िटरी README देखें |
| **[dsh-team-rooms](https://github.com/PerryLink/dsh-team-rooms)** | 🚫 सेवानिवृत्त — रिपॉज़िटरी README देखें |

</details>

## License

[Apache License 2.0](LICENSE) © 2026 dsh-site-log-check contributors.
