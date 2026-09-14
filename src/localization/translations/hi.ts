import { Translations } from '../types';

export const hi: Translations = {
  appName: "डी-हिलोरा",
  tagline: "आपका एआई स्वास्थ्य साथी",
  nav: {
    dashboard: "डैशबोर्ड",
    vitals: "वाइटल्स ट्रैकर",
    medicines: "दवा अलार्म",
    reports: "एआई रिपोर्ट विश्लेषण",
    chat: "हिलोरा एआई बातचीत",
    appointments: "डॉक्टर अपॉइंटमेंट",
    healthTwin: "हेल्थ ट्विन व जोखिम",
    copilot: "एआई स्वास्थ्य कॉपायलट",
    insights: "स्वास्थ्य सुझाव",
    careCircle: "केयर सर्कल (परिवार)",
    emergencySos: "आपातकालीन एसओएस",
    settings: "सेटिंग्स",
    adminPanel: "व्यवस्थापक पैनल",
    doctorBooking: "डॉक्टर परामर्श",
    marketplace: "हेल्थकेयर बाज़ार"
  },
  dashboard: {
    greeting: "नमस्ते",
    quickStats: "स्वास्थ्य अवलोकन",
    vitalsOverview: "वर्तमान वाइटल्स",
    medicineReminder: "आज की दवाएं",
    upcomingAppointments: "आगामी परामर्श",
    askHealora: "हिलोरा एआई से स्वास्थ्य प्रश्न पूछें...",
    recordVitals: "वाइटल दर्ज करें",
    logSymptoms: "दैनिक जांच",
    emergencyButton: "आपातकालीन SOS"
  },
  common: {
    save: "सुरक्षित करें",
    cancel: "रद्द करें",
    delete: "हटाएं",
    edit: "संपादित करें",
    add: "नया जोड़ें",
    search: "खोजें...",
    loading: "प्रक्रिया जारी है...",
    status: "स्थिति",
    actions: "क्रियाएं",
    viewAll: "सभी देखें",
    close: "बंद करें",
    confirm: "पुष्टि करें",
    success: "सफलतापूर्वक संपन्न",
    error: "त्रुटि हुई"
  },
  insights: {
    header: {
      title: "स्वास्थ्य सुझाव",
      subtitle: "आपके दर्ज किए गए स्वास्थ्य रिकॉर्ड के आधार पर तैयार किए गए रियल-टाइम बायोमेट्रिक रुझान और स्वास्थ्य अवलोकन",
      refresh: "रुझान रीफ़्रेश करें"
    },
    summary: {
      active: "सक्रिय सुझाव",
      urgent: "आपातकालीन अलर्ट",
      observations: "स्वास्थ्य अवलोकन",
      positive: "सकारात्मक रुझान"
    },
    criticalBanner: {
      title: "गंभीर बायोमेट्रिक स्तर का पता चला",
      description: "आपकी एक या अधिक स्वास्थ्य रीडिंग गंभीर स्तर पर पहुंच गई हैं। कृपया नीचे दिए गए कार्ड की समीक्षा करें और तुरंत अपने चिकित्सक से परामर्श लें।"
    },
    error: {
      title: "स्वास्थ्य सुझावों की गणना विफल रही",
      retry: "पुनः गणना करें"
    },
    empty: {
      title: "अभी तक कोई व्यक्तिगत रुझान नहीं मिला",
      description: "डी-हिलोरा पर सुझाव आपके वास्तविक स्वास्थ्य रिकॉर्ड से तैयार किए जाते हैं। व्यक्तिगत स्वास्थ्य सुझाव पाने के लिए अपने वाइटल्स, दवाएं और दैनिक जांच दर्ज करना शुरू करें।",
      vitalsCardTitle: "वाइटल्स आधार रेखा",
      vitalsCardDesc: "रुझान और स्थिरता विश्लेषण के लिए कम से कम 5 ब्लड प्रेशर या 3 ब्लड शुगर रीडिंग दर्ज करें।",
      medsCardTitle: "दवा अनुसूची व रीफ़िल",
      medsCardDesc: "रीफ़िल उलटी गिनती और दवा लेने की नियमितता जानने के लिए गोलियों की संख्या के साथ सक्रिय दवाएं जोड़ें।",
      checkinsCardTitle: "दैनिक जांच",
      checkinsCardDesc: "नींद-ऊर्जा संबंध, जल सेवन औसत और निरंतरता जानने के लिए 7+ दैनिक जांच रिकॉर्ड करें।",
      loggedReadings: "दर्ज: {count} रीडिंग",
      loggedMedicines: "दर्ज: {count} दवा(एं)",
      loggedCheckins: "दर्ज: {count} दैनिक जांच",
      logVitals: "वाइटल्स दर्ज करें",
      addMedication: "दवा जोड़ें",
      completeCheckIn: "दैनिक जांच पूरी करें"
    },
    disclaimer: "ये आपके दर्ज डेटा के पैटर्न अवलोकन हैं, कोई चिकित्सीय निदान नहीं — चिकित्सकीय सलाह के लिए अपने डॉक्टर से संपर्क करें।",
    evidenceLabel: "अवलोकित साक्ष्य:",
    evidenceFallback: "आपके हालिया स्वास्थ्य रिकॉर्ड के आधार पर",
    severity: {
      critical: "अति आवश्यक ध्यान",
      warning: "निगरानी चेतावनी",
      positive: "सकारात्मक उपलब्धि",
      info: "आधार रेखा रिकॉर्ड"
    },
    categories: {
      cardiovascular: "हृदय व रक्तचाप",
      metabolic: "मेटाबॉलिक",
      prescriptionSchedule: "दवा अनुसूची",
      lifestyle: "जीवनशैली",
      general: "सामान्य"
    },
    bp: {
      criticalTitle: "अति आवश्यक: अत्यधिक उच्च रक्तचाप",
      criticalDesc: "हालिया रक्तचाप हाइपरटेंसिव क्राइसिस स्तर (≥180/120 mmHg) को पार कर गया है। कृपया आराम करें, शारीरिक परिश्रम से बचें और तुरंत आपातकालीन चिकित्सीय सहायता लें।",
      criticalEvidence: "हालिया औसत: {recentAvgSys}/{recentAvgDia} mmHg (उच्चतम: {maxSys}/{maxDia} mmHg, कुल {count} दर्ज रीडिंग में)",
      hypotensionTitle: "निम्न रक्तचाप (हाइपोटेंशन) का पता चला",
      hypotensionDesc: "आपका हालिया औसत रक्तचाप सामान्य स्तर से कम (<90/60 mmHg) है। पर्याप्त पानी पिएं, धीरे-धीरे मुद्रा बदलें और चक्कर या थकान होने पर डॉक्टर से परामर्श लें।",
      hypotensionEvidence: "हालिया औसत: {recentAvgSys}/{recentAvgDia} mmHg (न्यूनतम: {minSys}/{minDia} mmHg, कुल {count} रीडिंग में)",
      elevatedTitle: "बढ़े हुए रक्तचाप का रुझान",
      elevatedDesc: "आपका औसत रक्तचाप सामान्य लक्ष्य सीमा से ऊपर (सिस्टोलिक ≥130 या डायस्टोलिक ≥85 mmHg) रहा है। नमक का सेवन सीमित करें, तनाव कम करें और डॉक्टर से नियमित जांच कराएं।",
      elevatedEvidence: "हालिया औसत: {recentAvgSys}/{recentAvgDia} mmHg (पिछले {recentCount} रिकॉर्ड में, समग्र औसत: {avgSys}/{avgDia} mmHg)",
      improvementTitle: "रक्तचाप में सुधार देखा गया",
      improvementDesc: "आपका सिस्टोलिक रक्तचाप पहले के औसत {earlierSys} mmHg से घटकर {laterSys} mmHg पर आ गया है, जो सकारात्मक हृदय स्वास्थ्य को दर्शाता है।",
      improvementEvidence: "हालिया {laterCount} रिकॉर्ड में औसत {laterSys}/{laterDia} mmHg बनाम पिछले {earlierCount} रिकॉर्ड में {earlierSys}/{earlierDia} mmHg",
      optimalTitle: "रक्तचाप आदर्श सीमा में",
      optimalDesc: "आपका रक्तचाप लगातार स्वस्थ व आदर्श सीमा (<120/80 mmHg) में बना हुआ है, जो अच्छे हृदय स्वास्थ्य का संकेत है।",
      optimalEvidence: "हालिया औसत: {recentAvgSys}/{recentAvgDia} mmHg (पिछले {count} दर्ज रिकॉर्ड में)",
      normalTitle: "स्थिर रक्तचाप आधार रेखा",
      normalDesc: "आपका रक्तचाप सामान्य मानक स्तर पर है। बेहतर स्वास्थ्य बनाए रखने के लिए नियमित ट्रैकिंग जारी रखें।",
      normalEvidence: "औसत {avgSys}/{avgDia} mmHg (कुल {count} दर्ज रिकॉर्ड में)"
    },
    sugar: {
      criticalHighTitle: "गंभीर उच्च रक्त शर्करा (हाइपरग्लाइसीमिया)",
      criticalHighDesc: "आपका दर्ज ब्लड ग्लूकोज 250 mg/dL से अधिक हो गया है। गंभीर उच्च शर्करा के लिए तुरंत चिकित्सीय समीक्षा आवश्यक है। अपनी निर्धारित उपचार योजना का पालन करें।",
      criticalLowTitle: "गंभीर निम्न रक्त शर्करा (हाइपोग्लाइसीमिया) अलर्ट",
      criticalLowDesc: "आपका दर्ज ब्लड ग्लूकोज 55 mg/dL से नीचे गिर गया है। तुरंत तेजी से असर करने वाले कार्बोहाइड्रेट लें और चिकित्सीय सलाह लें।",
      criticalEvidence: "हालिया मान: {latest} mg/dL (सीमा: {min}–{max} mg/dL, कुल {count} रिकॉर्ड में)",
      elevatedTitle: "बढ़े हुए ब्लड ग्लूकोज का पैटर्न",
      elevatedDesc: "आपका औसत ब्लड शुगर सामान्य स्तर से अधिक (>140 mg/dL) है। भोजन के संदर्भ (खाली पेट बनाम भोजन के बाद) को दर्ज करें और डॉक्टर से चर्चा करें।",
      elevatedEvidence: "औसत: {avg} mg/dL (उच्चतम: {max} mg/dL, हालिया: {latest} mg/dL, {count} रिकॉर्ड में)",
      lowTitle: "कम ब्लड ग्लूकोज का रुझान",
      lowDesc: "आपका औसत ब्लड ग्लूकोज 70 mg/dL से कम है। नियमित अंतराल पर भोजन करें और डॉक्टर से अपनी दवा की खुराक की समीक्षा कराएं।",
      lowEvidence: "औसत: {avg} mg/dL (न्यूनतम: {min} mg/dL, कुल {count} रिकॉर्ड में)",
      stableTitle: "ब्लड ग्लूकोज लक्ष्य सीमा में",
      stableDesc: "आपके ब्लड ग्लूकोज रिकॉर्ड सामान्य लक्ष्य सीमा (70–130 mg/dL) के भीतर निरंतर नियंत्रण दर्शाते हैं।",
      stableEvidence: "औसत: {avg} mg/dL ({count} दर्ज रीडिंग में, सीमा: {min}–{max} mg/dL)"
    },
    adherence: {
      refillUrgentTitle: "अति आवश्यक रीफ़िल: {name}",
      refillUrgentDesc: "{name} के लिए केवल {remainingPills} खुराक शेष हैं (~{daysLeft} दिन की आपूर्ति)। निरंतर उपचार बनाए रखने के लिए तुरंत रीफ़िल करें।",
      refillUrgentEvidence: "{remainingPills} गोलियां शेष ({daysLeft} दिन की आपूर्ति, {dailyDoses} खुराक/दिन पर)",
      refillWarningTitle: "रीफ़िल अनुस्मारक: {name}",
      refillWarningDesc: "आपके पास {name} की लगभग {daysLeft} दिन की दवा ({remainingPills} गोलियां) बची है। जल्द ही फ़ार्मेसी से पुनः ऑर्डर की योजना बनाएं।",
      refillWarningEvidence: "{remainingPills} गोलियां शेष (~{daysLeft} दिन की आपूर्ति, {dailyDoses} खुराक/दिन पर)",
      highTitle: "{name} के लिए उच्च नियमितता",
      highDesc: "आपने {name} के लिए {adherencePct}% नियमितता दर हासिल की है। समय पर दवा लेने से उपचार का प्रभाव अधिकतम होता है।",
      highEvidence: "{adherencePct}% नियमितता (दर्ज {totalDoses} में से {takenDoses} ली गईं)",
      lowTitle: "{name} की छूटी हुई खुराकें पाई गईं",
      lowDesc: "{name} के लिए आपकी नियमितता दर वर्तमान में {adherencePct}% है। निर्धारित खुराक छूटने से उपचार का प्रभाव कम हो सकता है। दवा अलर्ट सक्षम करने पर विचार करें।",
      lowEvidence: "{adherencePct}% नियमितता (निर्धारित {totalDoses} में से {missedDoses} छूटीं)"
    },
    lifestyle: {
      sleepTitle: "नींद की अवधि और दैनिक ऊर्जा पैटर्न",
      sleepDesc: "आपके रिकॉर्ड में, 7+ घंटे की नींद वाले दिनों में 6 घंटे से कम नींद वाले दिनों ({avgLowEnergy}/5) की तुलना में उल्लेखनीय रूप से अधिक ऊर्जा स्तर ({avgHighEnergy}/5) देखा गया।",
      sleepEvidence: "ऊर्जा औसत: ≥7 घंटे नींद पर {avgHighEnergy}/5 ({highSleepDays} दिन) बनाम <6 घंटे नींद पर {avgLowEnergy}/5 ({lowSleepDays} दिन)",
      hydrationOptimalTitle: "नियमित दैनिक जल सेवन",
      hydrationOptimalDesc: "आपने {count} दैनिक जांच में औसतन {avgWater}L/दिन पानी का सेवन बनाए रखा है, जो मेटाबॉलिक और किडनी स्वास्थ्य के लिए उत्तम है।",
      hydrationOptimalEvidence: "पिछले {count} दैनिक जांच में दर्ज औसत {avgWater}L/दिन",
      hydrationLowTitle: "जल सेवन अनुशंसित स्तर से कम",
      hydrationLowDesc: "आपका दर्ज जल सेवन औसतन {avgWater}L/दिन है। इसे धीरे-धीरे बढ़ाकर 2.0–2.5L प्रतिदिन करने से ऊर्जा और शारीरिक क्षमता में सुधार हो सकता है।",
      hydrationLowEvidence: "{count} दैनिक जांच में दर्ज औसत {avgWater}L/दिन"
    },
    streak: {
      title: "{streak}-दिवसीय दैनिक जांच स्ट्रीक",
      desc: "आपने लगातार {streak} दिनों तक अपनी स्वास्थ्य स्थिति दर्ज की है। नियमित ट्रैकिंग आपके और आपकी केयर टीम के लिए सटीक डेटा तैयार करती है।",
      evidence: "लगातार {streak} दैनिक जांच दर्ज (अंतिम: {lastDate})"
    }
  },
  copilot: {
    title: "एकीकृत एआई स्वास्थ्य कॉपायलट",
    subtitle: "व्यक्तिगत बेसलाइन मॉडलिंग, 30-दिवसीय स्वास्थ्य पूर्वानुमान व त्वरित क्लिनिकल सारांश",
    proBadge: "प्रो कॉपायलट",
    disclaimer: "यह आपके हालिया रुझान पर आधारित पैटर्न प्रोजेक्शन है, कोई चिकित्सीय निदान नहीं।",
    tabs: {
      trajectory: "रुझान और पूर्वानुमान",
      doctorBrief: "डॉक्टर परामर्श सारांश",
      whatIf: "व्हाट-इफ़ सिम्युलेटर",
      familyDigest: "परिवार स्वास्थ्य डाइजेस्ट"
    },
    trajectory: {
      title: "बायोमेट्रिक प्रक्षेपवक्र व जोखिम पूर्वानुमान",
      subtitle: "संभावित स्वास्थ्य परिवर्तनों को समय पूर्व समझने के लिए हालिया रुझानों का 4-5 सप्ताह आगे का प्रक्षेपण",
      currentTrend: "वर्तमान रुझान",
      projectedIn30Days: "30-दिवसीय अनुमान",
      personalBaseline: "व्यक्तिगत बेसलाइन (औसत ± विचलन)",
      sampleSize: "रीडिंग सैंपल",
      confidence: "मॉडल विश्वसनीयता",
      thresholdAlert: "क्लिनिकल स्टेज चेतावनी",
      weeksToThreshold: "वर्तमान गति रहने पर अनुमानित सप्ताह:",
      discussDoctor: "अपने डॉक्टर से परामर्श करें",
      insufficientData: "अपर्याप्त ऐतिहासिक डेटा",
      insufficientDesc: "विश्वसनीय गणितीय प्रक्षेपवक्र की गणना के लिए कम से कम 4-8 स्वास्थ्य रीडिंग आवश्यक हैं।",
      logVitalsCta: "वाइटल्स दर्ज करें"
    },
    doctorBrief: {
      title: "त्वरित डॉक्टर परामर्श सारांश",
      subtitle: "हालिया वाइटल्स, दवा नियमितता, सह-संबंध और डॉक्टर से पूछने योग्य प्रश्नों का संपूर्ण विश्लेषण",
      timeframeLabel: "विश्लेषण समय सीमा",
      generateBtn: "क्लिनिकल सारांश तैयार करें",
      generating: "क्लिनिकल सारांश तैयार हो रहा है...",
      vitalsSection: "वाइटल्स व शारीरिक रुझान",
      medsSection: "दवाएं व नियमितता दर",
      symptomsSection: "प्रमुख लक्षण व दैनिक रिकॉर्ड",
      correlationsSection: "परस्पर सह-संबंध विश्लेषण",
      questionsSection: "डॉक्टर से पूछने योग्य प्रश्न",
      shareCareCircle: "केयर सर्कल के साथ साझा करें",
      exportPdf: "पीडीएफ निर्यात / प्रिंट",
      roiFraming: "इस तरह के रुझानों की समय रहते पहचान गंभीर जटिलताओं से बचा सकती है — अपने डॉक्टर से चर्चा करें।"
    },
    paywall: {
      title: "डी-हिलोरा हेल्थ कॉपायलट अनलॉक करें",
      description: "व्यक्तिगत प्रक्षेपवक्र पूर्वानुमान, सह-संबंध खोज और त्वरित क्लिनिकल सारांश पाने के लिए अपग्रेड करें।",
      unlockBtn: "हेल्थ कॉपायलट सक्षम करें",
      liveSampleLabel: "आपके वास्तविक डेटा के साथ लाइव पूर्वावलोकन"
    }
  }
};

