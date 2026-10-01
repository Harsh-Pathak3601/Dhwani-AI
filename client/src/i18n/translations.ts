export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  region: string;
  accentLabel: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  {
    code: 'en-IN',
    name: 'Indian English',
    nativeName: 'English (India)',
    region: 'Pan-India',
    accentLabel: 'Indian English / Hinglish',
  },
  {
    code: 'hi-IN',
    name: 'Hindi',
    nativeName: 'हिंदी',
    region: 'North India / Delhi',
    accentLabel: 'Hindi Accent',
  },
  {
    code: 'bn-IN',
    name: 'Bengali',
    nativeName: 'বাংলা',
    region: 'West Bengal / Kolkata',
    accentLabel: 'Bengali Accent',
  },
  {
    code: 'ta-IN',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    region: 'Tamil Nadu / Chennai',
    accentLabel: 'Tamil Accent',
  },
  {
    code: 'te-IN',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    region: 'Telangana & AP / Hyderabad',
    accentLabel: 'Telugu Accent',
  },
  {
    code: 'mr-IN',
    name: 'Marathi',
    nativeName: 'मराठी',
    region: 'Maharashtra / Mumbai',
    accentLabel: 'Marathi Accent',
  },
  {
    code: 'gu-IN',
    name: 'Gujarati',
    nativeName: 'ગુજરાતી',
    region: 'Gujarat / Ahmedabad',
    accentLabel: 'Gujarati Accent',
  },
  {
    code: 'kn-IN',
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    region: 'Karnataka / Bengaluru',
    accentLabel: 'Kannada Accent',
  },
];

export const TRANSLATIONS: Record<string, Record<string, string>> = {
  'en-IN': {
    // Navigation
    'nav.home': 'Home',
    'nav.download': 'Download',
    'nav.cockpit': 'Cockpit',
    'nav.cases': 'Cases',
    'nav.architecture': 'Architecture',
    'nav.enterprise': 'Enterprise API',
    'nav.privacy': 'Privacy',
    'nav.gateway': 'REST/gRPC Gateway',

    // Download View
    'download.badge': 'Dhwani AI for Android',
    'download.hero.title': 'Zero-Lag Acoustic Defense',
    'download.hero.serif': 'for Your Smartphone.',
    'download.hero.desc': 'Stop deepfake voice impersonation, synthesized extortion, and digital arrest traps directly on your Android device in real-time.',
    'download.btn': 'Download APK Package',
    'download.initiated': 'Download initiated! Check your Android notification drawer.',
    'download.trust.dpdp': 'DPDP Act 2023 Compliant',
    'download.trust.noroot': 'No Root Required',
    'download.trust.zeroaudio': 'Zero Audio Retention',

    // Showcase
    'showcase.badge': 'Triple-Layer Mobile Architecture',
    'showcase.title': 'Experience the Mobile Sentinel',
    'showcase.desc': 'How Dhwani AI sits invisibly in memory to guard cellular calls, VoIP streams, and financial channels.',
    'showcase.card1.title': '01. Ambient Voice Radar',
    'showcase.card1.desc': 'Continuous frequency monitoring & biometric trust score',
    'showcase.card2.title': '02. Real-Time Intervention HUD',
    'showcase.card2.desc': 'Active floating warning card with voice cloning confidence',
    'showcase.card3.title': '03. DPDP 2023 Vault',
    'showcase.card3.desc': 'Simple 1-tap overlay & mic tap configuration',

    // Features
    'feat.badge': 'Proprietary Defense Stack',
    'feat.title': 'How Dhwani AI Shields Your Calls',
    'feat.desc': 'Engineered from first acoustic principles to defeat even the most deceptive ElevenLabs and VALL-E vocal clones.',
    'feat.f1.title': 'Zero-Lag Sidecar Tap',
    'feat.f1.desc': 'Hooks into the incoming telephony audio stream via native Android 10+ capture. Adds 0ms conversational latency while analyzing acoustic harmonics in parallel.',
    'feat.f2.title': 'AASIST Neural Voting',
    'feat.f2.desc': 'Sub-400ms neural inference inspects high-frequency spectral artifacts, synthetic vocoder harmonics, and phase discontinuities to detect cloned voices.',
    'feat.f3.title': 'In-Call Floating Intervention',
    'feat.f3.desc': 'Injects a high-priority heads-up warning directly over active calls (Cellular, WhatsApp, Telegram) with instant VAS score and UPI pre-transaction hold.',
    'feat.f4.title': 'Volatile RAM Quarantine',
    'feat.f4.desc': 'Audio chunks exist strictly in volatile RAM for under 500ms and are immediately wiped. Your conversations are NEVER written to disk, cache, or external servers.',

    // Privacy Matrix
    'privacy.badge': 'Zero-Knowledge Telemetry',
    'privacy.title': 'DPDP Act 2023 Technical Safeguards',
    'privacy.desc': 'Architected so that your personal conversations can never be intercepted, stored, or leaked.',
    'privacy.col1.title': 'What Stays 100% On-Device',
    'privacy.col2.title': 'What Dhwani Never Touches',

    // Cockpit
    'cockpit.callStandby': 'Call Standby',
    'cockpit.monitoring': 'Monitoring Call',
    'cockpit.startLiveMic': 'Start Live Mic',
    'cockpit.uploadFile': 'Upload Test File',
    'cockpit.endCall': 'End Call',
    'cockpit.criticalThreat': 'CRITICAL THREAT: AI Voice Clone',
  },

  'hi-IN': {
    // Navigation
    'nav.home': 'होम',
    'nav.download': 'डाउनलोड',
    'nav.cockpit': 'कॉकपिट',
    'nav.cases': 'केस',
    'nav.architecture': 'आर्किटेक्चर',
    'nav.enterprise': 'एंटरप्राइज API',
    'nav.privacy': 'प्राइवेसी',
    'nav.gateway': 'REST/gRPC गेटवे',

    // Download View
    'download.badge': 'ध्वनि AI एंड्रॉइड ऐप',
    'download.hero.title': 'शून्य-विलंबता ध्वनि सुरक्षा',
    'download.hero.serif': 'आपके स्मार्टफोन के लिए।',
    'download.hero.desc': 'डीपफेक वॉयस क्लोनिंग, सिंथेटिक रंगदारी और डिजिटल अरेस्ट कॉल से अपने फोन को रियल-टाइम में सुरक्षित करें।',
    'download.btn': 'APK पैकेज डाउनलोड करें',
    'download.initiated': 'डाउनलोड शुरू हो गया! अपना नोटिफिकेशन बार देखें।',
    'download.trust.dpdp': 'DPDP कानून 2023 अनुपालक',
    'download.trust.noroot': 'नो रूट आवश्यक',
    'download.trust.zeroaudio': 'ऑडियो कभी सेव नहीं होता',

    // Showcase
    'showcase.badge': 'त्रि-स्तरीय मोबाइल सुरक्षा',
    'showcase.title': 'मोबाइल सेंटिनल का अनुभव करें',
    'showcase.desc': 'ध्वनि AI मेमोरी में बैकग्राउंड में रहकर कॉल और UPI चैनलों की सुरक्षा कैसे करता है।',
    'showcase.card1.title': '01. सतत वॉयस रडार',
    'showcase.card1.desc': 'रियल-टाइम फ्रीक्वेंसी निगरानी और बायोमेट्रिक सेफ्टी स्कोर',
    'showcase.card2.title': '02. इन-कॉल अलर्ट HUD',
    'showcase.card2.desc': 'वॉयस क्लोनिंग का पता चलते ही फ्लोटिंग वार्निंग कार्ड',
    'showcase.card3.title': '03. DPDP 2023 प्राइवेसी वॉल्ट',
    'showcase.card3.desc': 'आसान 1-टैप ओवरले और माइक परमिशन सेटअप',

    // Features
    'feat.badge': 'स्वदेशी सुरक्षा तकनीक',
    'feat.title': 'ध्वनि AI आपकी कॉल की सुरक्षा कैसे करता है',
    'feat.desc': 'आधुनिक AI वॉयस क्लोन (ElevenLabs, VALL-E) को कॉल के दौरान तुरंत पकड़ने के लिए निर्मित।',
    'feat.f1.title': 'जीरो-लैग ऑडियो टैप',
    'feat.f1.desc': 'एंड्रॉइड 10+ के जरिए बिना किसी देरी (0ms) के कॉल ऑडियो की समानांतर फ्रीक्वेंसी जांच करता है।',
    'feat.f2.title': 'AASIST न्यूरल जांच',
    'feat.f2.desc': '400ms से कम समय में स्पेक्ट्रल विसंगतियों और सिंथेटिक आवाज़ के नमूनों को पकड़ता है।',
    'feat.f3.title': 'कॉल पर फ्लोटिंग चेतावनी HUD',
    'feat.f3.desc': 'संदिग्ध कॉल आते ही स्क्रीन पर चेतावनी फ्लैश करता है और तुरंत UPI पेमेंट रोकने की सलाह देता है।',
    'feat.f4.title': 'अस्थायी RAM आइसोलेशन',
    'feat.f4.desc': 'ऑडियो 500ms से भी कम समय RAM में रहता है और तुरंत मिटा दिया जाता है। कोई रिकॉर्डिंग नहीं रखी जाती।',

    // Privacy Matrix
    'privacy.badge': 'जीरो-नॉलेज प्राइवेसी',
    'privacy.title': 'DPDP कानून 2023 तकनीकी गारंटी',
    'privacy.desc': 'आपकी निजी बातचीत कभी रिकॉर्ड या लीक नहीं की जा सकती।',
    'privacy.col1.title': 'जो 100% आपके फोन में रहता है',
    'privacy.col2.title': 'जिससे ध्वनि AI कभी हाथ नहीं लगाता',

    // Cockpit
    'cockpit.callStandby': 'कॉल स्टैंडबाय',
    'cockpit.monitoring': 'कॉल निगरानी सक्रिय',
    'cockpit.startLiveMic': 'लाइव माइक शुरू करें',
    'cockpit.uploadFile': 'टेस्ट ऑडियो फाइल अपलोड करें',
    'cockpit.endCall': 'कॉल समाप्त करें',
    'cockpit.criticalThreat': 'गंभीर खतरा: AI वॉयस क्लोन पकड़ा गया',
  },

  'bn-IN': {
    // Navigation
    'nav.home': 'হোম',
    'nav.download': 'ডাউনলোড',
    'nav.cockpit': 'ককপিট',
    'nav.cases': 'কেস ড্যাশবোর্ড',
    'nav.architecture': 'আর্কিটেকচার',
    'nav.enterprise': 'এন্টারপ্রাইজ API',
    'nav.privacy': 'গোপনীয়তা',
    'nav.gateway': 'REST/gRPC গেটওয়ে',

    // Download View
    'download.badge': 'ধ্বনি AI অ্যান্ড্রয়েড অ্যাপ',
    'download.hero.title': 'জিরো-ল্যাগ ভয়েস সুরক্ষা',
    'download.hero.serif': 'আপনার স্মার্টফোনের জন্য।',
    'download.hero.desc': 'ডিপফেক ভয়েস ক্লোনিং এবং ডিজিটাল অ্যারেস্ট প্রতারণা থেকে আপনার ফোনকে রিয়েল-টাইমে সুরক্ষিত রাখুন।',
    'download.btn': 'APK প্যাকেজ ডাউনলোড করুন',
    'download.initiated': 'ডাউনলোড শুরু হয়েছে! আপনার নোটিফিকেশন বার চেক করুন।',
    'download.trust.dpdp': 'DPDP আইন ২০২৩ সম্মত',
    'download.trust.noroot': 'কোনো রুট প্রয়োজন নেই',
    'download.trust.zeroaudio': 'অডিও কখনই সেভ হয় না',

    // Showcase
    'showcase.badge': 'ত্রি-স্তরীয় মোবাইল সুরক্ষা',
    'showcase.title': 'মোবাইল সেন্টিনেলের অভিজ্ঞতা নিন',
    'showcase.desc': 'ধ্বনি AI ফোনে ব্যাকগ্রাউন্ডে থেকে ইনকামিং কল এবং UPI চ্যানেলে নিরাপত্তা নিশ্চিত করে।',
    'showcase.card1.title': '০১. রিয়েল-টাইম ভয়েস রাডার',
    'showcase.card1.desc': 'ফ্রিকোয়েন্সি পর্যবেক্ষণ এবং বায়োমেট্রিক সেফটি স্কোর',
    'showcase.card2.title': '০২. ইন-কল অ্যালার্ট HUD',
    'showcase.card2.desc': 'AI ভয়েস ক্লোন ধরা পড়লেই স্ক্রিনে সতর্কবার্তা',
    'showcase.card3.title': '০৩. DPDP ২০২৩ সিকিউরিটি ভল্ট',
    'showcase.card3.desc': 'সহজ ১-ট্যাপ ওভারলে এবং মাইক্রোফোন পারমিশন',

    // Features
    'feat.badge': 'প্রতিরক্ষা আর্কিটেকচার',
    'feat.title': 'ধ্বনি AI যেভাবে আপনার কল রক্ষা করে',
    'feat.desc': 'উন্নত AI সিন্থেটিক ভয়েস স্ক্যাম প্রতিরোধে বিশেষভাবে নির্মিত।',
    'feat.f1.title': 'জিরো-ল্যাগ অডিও ট্যাপ',
    'feat.f1.desc': 'কল চলাকালীন কোনো বিলম্ব ছাড়াই লাইভ অডিও ফ্রিকোয়েন্সি বিশ্লেষণ করে।',
    'feat.f2.title': 'AASIST নিউরাল অ্যানালিসিস',
    'feat.f2.desc': '৪০০ মিলিসেকেন্ডেরও কম সময়ে সিন্থেটিক ভয়েস শনাক্ত করে।',
    'feat.f3.title': 'ইন-কল ফ্লোটিং HUD',
    'feat.f3.desc': 'সন্দেহজনক কল চলাকালীন স্ক্রিনের উপর সতর্কবার্তা দেখায় এবং টাকা না পাঠাতে পরামর্শ দেয়।',
    'feat.f4.title': 'অস্থায়ী RAM সুরক্ষা',
    'feat.f4.desc': 'অডিও ডেটা শুধুমাত্র অস্থায়ী RAM-এ ৫০০ মিলিসেকেন্ডের জন্য থাকে এবং সাথে সাথে মুছে ফেলা হয়।',

    // Privacy Matrix
    'privacy.badge': 'জিরো-নলেজ আর্কিটেকচার',
    'privacy.title': 'DPDP আইন ২০২৩ প্রযুক্তিগত গ্যারান্টি',
    'privacy.desc': 'আপনার ব্যক্তিগত কথোপকথন কখনই রেকর্ড বা আপলোড করা হয় না।',
    'privacy.col1.title': 'যা ১০০% আপনার ফোনে থাকে',
    'privacy.col2.title': 'যা ধ্বনি AI কখনই স্পর্শ করে না',

    // Cockpit
    'cockpit.callStandby': 'কল স্ট্যান্ডবাই',
    'cockpit.monitoring': 'কল পর্যবেক্ষণ চলছে',
    'cockpit.startLiveMic': 'লাইভ মাইক চালু করুন',
    'cockpit.uploadFile': 'টেস্ট ফাইল আপলোড করুন',
    'cockpit.endCall': 'কল শেষ করুন',
    'cockpit.criticalThreat': 'মারাত্মক হুমকি: AI ভয়েস ক্লোন শনাক্ত',
  },

  'ta-IN': {
    // Navigation
    'nav.home': 'முகப்பு',
    'nav.download': 'பதிவிறக்கு',
    'nav.cockpit': 'காக்பிட்',
    'nav.cases': 'வழக்குகள்',
    'nav.architecture': 'கட்டமைப்பு',
    'nav.enterprise': 'எண்டர்பிரைஸ் API',
    'nav.privacy': 'தனியுரிமை',
    'nav.gateway': 'REST/gRPC நுழைவாயில்',

    // Download View
    'download.badge': 'த்வனி AI ஆண்ட்ராய்டு ஆப்',
    'download.hero.title': 'தாமதமில்லா குரல் பாதுகாப்பு',
    'download.hero.serif': 'உங்கள் ஸ்மார்ட்போனிற்கு.',
    'download.hero.desc': 'டீப்ஃபேக் குரல் மோசடிகள் மற்றும் டிஜிட்டல் அரெஸ்ட் அச்சுறுத்தல்களிலிருந்து நிகழ்நேரத்தில் உங்கள் அழைப்புகளைப் பாதுகாக்கவும்.',
    'download.btn': 'APK பதிவிறக்கவும்',
    'download.initiated': 'பதிவிறக்கம் தொடங்கியது! அறிவிப்புப் பட்டியைப் பார்க்கவும்.',
    'download.trust.dpdp': 'DPDP சட்டம் 2023 இணக்கம்',
    'download.trust.noroot': 'ரூட் தேவையில்லை',
    'download.trust.zeroaudio': 'ஆடியோ பதிவு செய்யப்படாது',

    // Showcase
    'showcase.badge': 'மூன்று அடுக்கு மொபைல் பாதுகாப்பு',
    'showcase.title': 'மொபைல் பாதுகாப்பை உணருங்கள்',
    'showcase.desc': 'த்வனி AI உங்கள் போனில் இயங்கி அழைப்புகள் மற்றும் UPI பரிவர்த்தனைகளைப் பாதுகாக்கிறது.',
    'showcase.card1.title': '01. குரல் அலைவரிசை ரேடார்',
    'showcase.card1.desc': 'நிகழ்நேர குரல் சோதனை மற்றும் பாதுகாப்பு மதிப்பீடு',
    'showcase.card2.title': '02. அழைப்பின் போது எச்சரிக்கை HUD',
    'showcase.card2.desc': 'குரல் குளோனிங் கண்டறியப்பட்டால் உடனடி திரை எச்சரிக்கை',
    'showcase.card3.title': '03. DPDP 2023 தனியுரிமை பாதுகாப்பு',
    'showcase.card3.desc': 'எளிய 1-கிளிக் அனுமதி அமைப்பு',

    // Features
    'feat.badge': 'பிரத்யேக பாதுகாப்பு கட்டமைப்பு',
    'feat.title': 'த்வனி AI எவ்வாறு பாதுகாக்கிறது',
    'feat.desc': 'AI குரல் குளோன்களை உடனடியாக கண்டறிய வடிவமைக்கப்பட்டுள்ளது.',
    'feat.f1.title': 'ஜீரோ-லேக் ஆடியோ டேப்',
    'feat.f1.desc': 'அழைப்பில் எந்த தாமதமும் இல்லாமல் (0ms) ஆடியோ அதிர்வெண்களை பகுப்பாய்வு செய்கிறது.',
    'feat.f2.title': 'AASIST நியூரல் சோதனை',
    'feat.f2.desc': '400ms-க்குள் போலி குரல் அடையாளங்களை கண்டறிகிறது.',
    'feat.f3.title': 'திரை எச்சரிக்கை HUD',
    'feat.f3.desc': 'மோசடி அழைப்பின் போது எச்சரித்து பணம் அனுப்ப வேண்டாம் என பரிந்துரைக்கிறது.',
    'feat.f4.title': 'தற்காலிக RAM அழிப்பு',
    'feat.f4.desc': 'ஆடியோ 500ms மட்டுமே நினைவகத்தில் வைக்கப்பட்டு உடனடியாக அழிக்கப்படுகிறது.',

    // Privacy Matrix
    'privacy.badge': 'தனியுரிமை உத்தரவாதம்',
    'privacy.title': 'DPDP சட்டம் 2023 தொழில்நுட்ப உத்தரவாதம்',
    'privacy.desc': 'உங்கள் உரையாடல்கள் எப்போதும் சேமிக்கப்படாது.',
    'privacy.col1.title': 'உங்கள் போனில் மட்டுமே இருப்பது',
    'privacy.col2.title': 'த்வனி AI தொடாதவை',

    // Cockpit
    'cockpit.callStandby': 'அழைப்பு தயார்நிலை',
    'cockpit.monitoring': 'கண்காணிப்பு செயலில் உள்ளது',
    'cockpit.startLiveMic': 'மைக் தொடங்கு',
    'cockpit.uploadFile': 'ஆடியோ கோப்பை பதிவேற்றவும்',
    'cockpit.endCall': 'அழைப்பை முடிக்கவும்',
    'cockpit.criticalThreat': 'அபாயம்: AI குரல் குளோன் கண்டறியப்பட்டது',
  },

  'te-IN': {
    // Navigation
    'nav.home': 'హోమ్',
    'nav.download': 'డౌన్‌లోడ్',
    'nav.cockpit': 'కాక్‌పిట్',
    'nav.cases': 'కేసులు',
    'nav.architecture': 'ఆర్కిటెక్చర్',
    'nav.enterprise': 'ఎంటర్‌ప్రైజ్ API',
    'nav.privacy': 'గోప్యత',
    'nav.gateway': 'REST/gRPC గేట్‌వే',

    // Download View
    'download.badge': 'ధ్వని AI ఆండ్రాయిడ్ యాప్',
    'download.hero.title': 'ఆలస్యం లేని వాయిస్ రక్షణ',
    'download.hero.serif': 'మీ స్మార్ట్‌ఫోన్ కోసం.',
    'download.hero.desc': 'డీప్‌ఫేక్ వాయిస్ క్లోనింగ్ మరియు డిజిటల్ అరెస్ట్ కాల్స్ నుండి మీ ఫోన్‌ను రియల్-టైమ్‌లో రక్షించుకోండి.',
    'download.btn': 'APK ప్యాకేజీని డౌన్‌లోడ్ చేయండి',
    'download.initiated': 'డౌన్‌లోడ్ ప్రారంభమైంది! మీ నోటిఫికేషన్ బార్ చూడండి.',
    'download.trust.dpdp': 'DPDP చట్టం 2023 నిబంధనల ప్రకారం',
    'download.trust.noroot': 'రూట్ అవసరం లేదు',
    'download.trust.zeroaudio': 'ఆడియో ఎప్పుడూ సేవ్ చేయబడదు',

    // Showcase
    'showcase.badge': 'త్రిముఖ మొబైల్ రక్షణ',
    'showcase.title': 'మొబైల్ రక్షణను అనుభవించండి',
    'showcase.desc': 'ధ్వని AI మీ ఫోన్ కాల్స్ మరియు UPI లావాదేవీలను నిరంతరం ఎలా కాపాడుతుందో చూడండి.',
    'showcase.card1.title': '01. నిరంతర వాయిస్ రాడార్',
    'showcase.card1.desc': 'రియల్-టైమ్ ఫ్రీక్వెన్సీ విశ్లేషణ మరియు భద్రతా స్కోరు',
    'showcase.card2.title': '02. కాల్ సమయంలో హెచ్చరిక HUD',
    'showcase.card2.desc': 'నకిలీ వాయిస్ గుర్తించగానే స్క్రీన్‌పై హెచ్చరిక',
    'showcase.card3.title': '03. DPDP 2023 ప్రైవసీ వాల్ట్',
    'showcase.card3.desc': 'సులభమైన అనుమతుల సెటప్',

    // Features
    'feat.badge': 'రక్షణ వ్యవస్థ',
    'feat.title': 'ధ్వని AI మీ కాల్స్‌ను ఎలా రక్షిస్తుంది',
    'feat.desc': 'AI సింథటిక్ వాయిస్ మోసాలను తక్షణమే పసిగట్టడానికి రూపొందించబడింది.',
    'feat.f1.title': 'జీరో-లాగ్ ఆడియో ట్యాప్',
    'feat.f1.desc': 'ఎటువంటి ఆలస్యం లేకుండా కాల్ ఆడియోను ఏకకాలంలో విశ్లేషిస్తుంది.',
    'feat.f2.title': 'AASIST న్యూరల్ టెస్టింగ్',
    'feat.f2.desc': '400ms లోపే కృత్రిమ గొంతు లక్షణాలను గుర్తిస్తుంది.',
    'feat.f3.title': 'కాల్ పై ఫ్లోటింగ్ హెచ్చరిక HUD',
    'feat.f3.desc': 'మోసపూరిత కాల్ సమయంలో హెచ్చరిస్తూ డబ్బులు పంపవద్దని సూచిస్తుంది.',
    'feat.f4.title': 'తాత్కాలిక RAM రక్షణ',
    'feat.f4.desc': 'ఆడియో డేటా 500ms మాత్రమే ఉండి వెంటనే తొలగించబడుతుంది.',

    // Privacy Matrix
    'privacy.badge': 'జీరో-నాలెడ్జ్ గోప్యత',
    'privacy.title': 'DPDP చట్టం 2023 సాంకేతిక హామీ',
    'privacy.desc': 'మీ సంభాషణలు ఎప్పటికీ రికార్డ్ కావు.',
    'privacy.col1.title': 'మీ పరికరంలో మాత్రమే ఉండేవి',
    'privacy.col2.title': 'ధ్వని AI ఎప్పటికీ సేకరించనివి',

    // Cockpit
    'cockpit.callStandby': 'కాల్ సిద్ధంగా ఉంది',
    'cockpit.monitoring': 'కాల్ పర్యవేక్షణ చురుగ్గా ఉంది',
    'cockpit.startLiveMic': 'లైవ్ మైక్ ప్రారంభించండి',
    'cockpit.uploadFile': 'ఆడియో ఫైల్ అప్‌లోడ్ చేయండి',
    'cockpit.endCall': 'కాల్ ముగించండి',
    'cockpit.criticalThreat': 'ప్రమాదం: AI వాయిస్ క్లోన్ గుర్తించబడింది',
  },

  'mr-IN': {
    // Navigation
    'nav.home': 'होम',
    'nav.download': 'डाउनलोड',
    'nav.cockpit': 'कॉकपिट',
    'nav.cases': 'केसेस',
    'nav.architecture': 'आर्किटेक्चर',
    'nav.enterprise': 'एंटरप्राइझ API',
    'nav.privacy': 'प्रायव्हसी',
    'nav.gateway': 'REST/gRPC गेटवे',

    // Download View
    'download.badge': 'ध्वनी AI अँड्रॉइड ॲप',
    'download.hero.title': 'शून्य-विलंब व्हॉइस सुरक्षा',
    'download.hero.serif': 'तुमच्या स्मार्टफोनसाठी.',
    'download.hero.desc': 'डीपफेक व्हॉइस क्लोनिंग आणि डिजिटल अरेस्ट कॉल्सपासून तुमच्या फोनला रिअल-टाइममध्ये सुरक्षित ठेवा.',
    'download.btn': 'APK पॅकेज डाउनलोड करा',
    'download.initiated': 'डाउनलोड सुरू झाले! तुमचे नोटिफिकेशन बार तपासा.',
    'download.trust.dpdp': 'DPDP कायदा २०२३ सुसंगत',
    'download.trust.noroot': 'रूट आवश्यक नाही',
    'download.trust.zeroaudio': 'ऑडिओ कधीही सेव्ह होत नाही',

    // Showcase
    'showcase.badge': 'त्रिस्तरीय मोबाईल सुरक्षा',
    'showcase.title': 'मोबाईल संरक्षणाचा अनुभव घ्या',
    'showcase.desc': 'ध्वनी AI फोन कॉल्स आणि UPI चॅनेल्सना कसे सुरक्षित ठेवते ते पाहा.',
    'showcase.card1.title': '०१. रिअल-टाइम व्हॉइस रडार',
    'showcase.card1.desc': 'सतत फ्रिक्वेन्सी तपासणी आणि बायोमेट्रिक सेफ्टी स्कोअर',
    'showcase.card2.title': '०२. इन-कॉल अलर्ट HUD',
    'showcase.card2.desc': 'क्लोन आवाज आढळताच स्क्रीनवर त्वरित चेतावणी',
    'showcase.card3.title': '०३. DPDP २०२३ प्रायव्हसी व्हॉल्ट',
    'showcase.card3.desc': 'सोपा १-टॅप ओव्हरले आणि माइक परमिशन सेटअप',

    // Features
    'feat.badge': 'प्रगत सुरक्षा यंत्रणा',
    'feat.title': 'ध्वनी AI तुमच्या कॉल्सचे कसे संरक्षण करते',
    'feat.desc': 'आधुनिक AI व्हॉइस क्लोन स्कॅम तत्काळ ओळखण्यासाठी विकसित.',
    'feat.f1.title': 'झिरो-लॅग ऑडिओ टॅप',
    'feat.f1.desc': 'कॉलमध्ये कोणताही अडथळा न आणता ऑडिओ फ्रिक्वेन्सीचे विश्लेषण करते.',
    'feat.f2.title': 'AASIST न्यूरल तपासणी',
    'feat.f2.desc': '४०० मिलिसकंदांपेक्षा कमी वेळेत बनावट आवाज ओळखतो.',
    'feat.f3.title': 'कॉलवर फ्लोटिंग वॉर्निंग HUD',
    'feat.f3.desc': 'संशयास्पद कॉलवर चेतावणी देऊन पैसे न पाठवण्याचा इशारा देतो.',
    'feat.f4.title': 'अस्थायी RAM आयसोलेशन',
    'feat.f4.desc': 'ऑडिओ ५०० मिलिसकंदांपेक्षा कमी काळ RAM मध्ये राहतो आणि नष्ट केला जातो.',

    // Privacy Matrix
    'privacy.badge': 'झिरो-नॉलेज प्रायव्हसी',
    'privacy.title': 'DPDP कायदा २०२३ तांत्रिक हमी',
    'privacy.desc': 'तुमचे वैयक्तिक संभाषण कधीही रेकॉर्ड किंवा लीक होत नाही.',
    'privacy.col1.title': 'जे १००% तुमच्या फोनवर राहते',
    'privacy.col2.title': 'ज्याला ध्वनी AI कधीही स्पर्श करत नाही',

    // Cockpit
    'cockpit.callStandby': 'कॉल स्टँडबाय',
    'cockpit.monitoring': 'कॉल तपासणी सुरू आहे',
    'cockpit.startLiveMic': 'माइक सुरू करा',
    'cockpit.uploadFile': 'चाचणी ऑडिओ फाईल अपलोड करा',
    'cockpit.endCall': 'कॉल समाप्त करा',
    'cockpit.criticalThreat': 'गंभीर धोका: AI व्हॉइस क्लोन आढळला',
  },

  'gu-IN': {
    // Navigation
    'nav.home': 'હોમ',
    'nav.download': 'ડાઉનલોડ',
    'nav.cockpit': 'કોકપિટ',
    'nav.cases': 'કેસ ડેશબોર્ડ',
    'nav.architecture': 'આર્કિટેક્ચર',
    'nav.enterprise': 'એન્ટરપ્રાઇઝ API',
    'nav.privacy': 'ગોપનીયતા',
    'nav.gateway': 'REST/gRPC ગેટવે',

    // Download View
    'download.badge': 'ધ્વનિ AI એન્ડ્રોઇડ એપ',
    'download.hero.title': 'ઝીરો-લેગ ઓડિયો સુરક્ષા',
    'download.hero.serif': 'તમારા સ્માર્ટફોન માટે.',
    'download.hero.desc': 'ડીપફેક વોઈસ ક્લોનિંગ અને ડિજિટલ અરેસ્ટ સ્કેમથી તમારા ફોનને રિયલ-ટાઇમમાં સુરક્ષિત રાખો.',
    'download.btn': 'APK પેકેજ ડાઉનલોડ કરો',
    'download.initiated': 'ડાઉનલોડ શરૂ થયું! તમારું નોટિફિકેશન બાર તપાસો.',
    'download.trust.dpdp': 'DPDP કાયદો 2023 સુસંગત',
    'download.trust.noroot': 'રૂટ જરૂરી નથી',
    'download.trust.zeroaudio': 'ઓડિયો ક્યારેય સેવ થતો નથી',

    // Showcase
    'showcase.badge': 'ત્રિ-સ્તરીય મોબાઇલ સુરક્ષા',
    'showcase.title': 'મોબાઇલ સેન્ટિનેલનો અનુભવ કરો',
    'showcase.desc': 'ધ્વનિ AI ઇનકમિંગ કોલ્સ અને UPI ચેનલોને કેવી રીતે સુરક્ષિત રાખે છે તે જુઓ.',
    'showcase.card1.title': '01. રિયલ-ટાઇમ વોઈસ રડાર',
    'showcase.card1.desc': 'ફ્રીક્વન્સી મોનિટરિંગ અને બાયોમેટ્રિક સેફ્ટી સ્કોર',
    'showcase.card2.title': '02. ઇન-કોલ એલર્ટ HUD',
    'showcase.card2.desc': 'વોઈસ ક્લોન પકડાતા જ સ્ક્રીન પર તુરંત ચેતવણી',
    'showcase.card3.title': '03. DPDP 2023 પ્રાઇવસી વોલ્ટ',
    'showcase.card3.desc': 'સરળ 1-ક્લિક પરવાનગી સેટઅપ',

    // Features
    'feat.badge': 'સુરક્ષા ટેકનોલોજી',
    'feat.title': 'ધ્વનિ AI તમારા કોલ્સનું રક્ષણ કેવી રીતે કરે છે',
    'feat.desc': 'AI સિન્થેટિક વોઈસ સ્કેમને તુરંત પકડવા માટે ખાસ બનાવેલ.',
    'feat.f1.title': 'ઝીરો-લેગ ઓડિયો ટેપ',
    'feat.f1.desc': 'કોલ દરમિયાન કોઈ વિલંબ વગર ઓડિયો ફ્રીક્વન્સીની તપાસ કરે છે.',
    'feat.f2.title': 'AASIST ન્યુરલ તપાસ',
    'feat.f2.desc': '400ms ની અંદર નકલી અવાજ ઓળખી કાઢે છે.',
    'feat.f3.title': 'કોલ પર ફ્લોટિંગ ચેતવણી HUD',
    'feat.f3.desc': 'શંકાસ્પદ કોલ દરમિયાન ચેતવણી આપી પૈસા ન મોકલવાની સલાહ આપે છે.',
    'feat.f4.title': 'અસ્થાયી RAM સુરક્ષા',
    'feat.f4.desc': 'ઓડિયો ડેટા 500ms થી પણ ઓછા સમય માટે રહે છે અને તુરંત ભૂંસી નખાય છે.',

    // Privacy Matrix
    'privacy.badge': 'ગોપનીયતા ગેરંટી',
    'privacy.title': 'DPDP કાયદો 2023 ટેકનિકલ ગેરંટી',
    'privacy.desc': 'તમારી અંગત વાતચીત ક્યારેય રેકોર્ડ થતી નથી.',
    'privacy.col1.title': 'જે 100% તમારા ફોનમાં રહે છે',
    'privacy.col2.title': 'જેને ધ્વનિ AI ક્યારેય અડતું નથી',

    // Cockpit
    'cockpit.callStandby': 'કોલ સ્ટેન્ડબાય',
    'cockpit.monitoring': 'કોલ મોનિટરિંગ ચાલુ છે',
    'cockpit.startLiveMic': 'લાઇવ માઇક શરૂ કરો',
    'cockpit.uploadFile': 'ટેસ્ટ ઓડિયો ફાઇલ અપલોડ કરો',
    'cockpit.endCall': 'કોલ સમાપ્ત કરો',
    'cockpit.criticalThreat': 'ગંભીર ખતરો: AI વોઈસ ક્લોન પકડાયો',
  },

  'kn-IN': {
    // Navigation
    'nav.home': 'ಮುಖಪುಟ',
    'nav.download': 'ಡೌನ್‌ಲೋಡ್',
    'nav.cockpit': 'ಕಾಕ್‌ಪಿಟ್',
    'nav.cases': 'ಪ್ರಕರಣಗಳು',
    'nav.architecture': 'ಆರ್ಕಿಟೆಕ್ಚರ್',
    'nav.enterprise': 'ಎಂಟರ್‌ಪ್ರೈಸ್ API',
    'nav.privacy': 'ಗೌಪ್ಯತೆ',
    'nav.gateway': 'REST/gRPC ಗೇಟ್‌ವೇ',

    // Download View
    'download.badge': 'ಧ್ವನಿ AI ಆಂಡ್ರಾಯ್ಡ್ ಆಪ್',
    'download.hero.title': 'ವಿಳಂಬವಿಲ್ಲದ ಧ್ವನಿ ರಕ್ಷಣೆ',
    'download.hero.serif': 'ನಿಮ್ಮ ಸ್ಮಾರ್ಟ್‌ಫೋನ್‌ಗಾಗಿ.',
    'download.hero.desc': 'ಡೀಪ್‌ಫೇಕ್ ವಾಯ್ಸ್ ಕ್ಲೋನಿಂಗ್ ಮತ್ತು ಡಿಜಿಟಲ್ ಅರೆಸ್ಟ್ ಕರೆಗಳಿಂದ ನಿಮ್ಮ ಫೋನ್ ಅನ್ನು ನೈಜ ಸಮಯದಲ್ಲಿ ರಕ್ಷಿಸಿ.',
    'download.btn': 'APK ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ',
    'download.initiated': 'ಡೌನ್‌ಲೋಡ್ ಪ್ರಾರಂಭವಾಗಿದೆ! ನೋಟಿಫಿಕೇಶನ್ ಬಾರ್ ಪರಿಶೀಲಿಸಿ.',
    'download.trust.dpdp': 'DPDP ಕಾಯಿದೆ 2023 ಅನುಸರಣೆ',
    'download.trust.noroot': 'ರೂಟ್ ಅಗತ್ಯವಿಲ್ಲ',
    'download.trust.zeroaudio': 'ಆಡಿಯೋ ಎಂದಿಗೂ ಉಳಿಸುವುದಿಲ್ಲ',

    // Showcase
    'showcase.badge': 'ತ್ರಿವಿಧ ಮೊಬೈಲ್ ರಕ್ಷಣೆ',
    'showcase.title': 'ಮೊಬೈಲ್ ರಕ್ಷಣೆಯನ್ನು ಅನುಭವಿಸಿ',
    'showcase.desc': 'ಧ್ವನಿ AI ನಿಮ್ಮ ಫೋನ್ ಕರೆಗಳು ಮತ್ತು UPI ಪಾವತಿಗಳನ್ನು ಹೇಗೆ ಸುರಕ್ಷಿತವಾಗಿರಿಸುತ್ತದೆ ಎಂಬುದನ್ನು ನೋಡಿ.',
    'showcase.card1.title': '01. ವಾಯ್ಸ್ ರಾಡಾರ್',
    'showcase.card1.desc': 'ನೈಜ-ಸಮಯದ ಆವರ್ತನ ಮೇಲ್ವಿಚಾರಣೆ ಮತ್ತು ಸುರಕ್ಷತಾ ಅಂಕ',
    'showcase.card2.title': '02. ಕರೆ ಎಚ್ಚರಿಕೆ HUD',
    'showcase.card2.desc': 'ಕ್ಲೋನ್ ಧ್ವನಿ ಪತ್ತೆಯಾದ ತಕ್ಷಣ ಪರದೆಯ ಮೇಲೆ ಎಚ್ಚರಿಕೆ',
    'showcase.card3.title': '03. DPDP 2023 ಗೌಪ್ಯತೆ ವಾಲ್ಟ್',
    'showcase.card3.desc': 'ಸುಲಭವಾದ ಅನುಮತಿ ಸೆಟಪ್',

    // Features
    'feat.badge': 'ರಕ್ಷಣಾ ತಂತ್ರಜ್ಞಾನ',
    'feat.title': 'ಧ್ವನಿ AI ಕರೆಗಳನ್ನು ಹೇಗೆ ರಕ್ಷಿಸುತ್ತದೆ',
    'feat.desc': 'AI ಸಿಂಥೆಟಿಕ್ ವಾಯ್ಸ್ ವಂಚನೆಗಳನ್ನು ತಕ್ಷಣ ಗುರುತಿಸಲು ವಿನ್ಯಾಸಗೊಳಿಸಲಾಗಿದೆ.',
    'feat.f1.title': 'ಜೀರೋ-ಲ್ಯಾಗ್ ಆಡಿಯೋ ಟ್ಯಾಪ್',
    'feat.f1.desc': 'ಯಾವುದೇ ವಿಳಂಬವಿಲ್ಲದೆ ಆಡಿಯೋ ಆವರ್ತನಗಳನ್ನು ವಿಶ್ಲೇಷಿಸುತ್ತದೆ.',
    'feat.f2.title': 'AASIST ಪರೀಕ್ಷೆ',
    'feat.f2.desc': '400ms ಒಳಗೆ ನಕಲಿ ಧ್ವನಿಯನ್ನು ಪತ್ತೆ ಮಾಡುತ್ತದೆ.',
    'feat.f3.title': 'ಫ್ಲೋಟಿಂಗ್ ಎಚ್ಚರಿಕೆ HUD',
    'feat.f3.desc': 'ವಂಚನೆ ಕರೆಯ ಸಮಯದಲ್ಲಿ ಎಚ್ಚರಿಸಿ ಹಣ ಕಳುಹಿಸದಂತೆ ಸೂಚಿಸುತ್ತದೆ.',
    'feat.f4.title': 'ತಾತ್ಕಾಲಿಕ RAM ರಕ್ಷಣೆ',
    'feat.f4.desc': 'ಆಡಿಯೋ 500ms ಮಾತ್ರ ಇರುತ್ತದೆ ಮತ್ತು ತಕ್ಷಣ ಅಳಿಸಲಾಗುತ್ತದೆ.',

    // Privacy Matrix
    'privacy.badge': 'ಗೌಪ್ಯತೆ ಭರವಸೆ',
    'privacy.title': 'DPDP ಕಾಯಿದೆ 2023 ತಾಂತ್ರಿಕ ಖಾತರಿ',
    'privacy.desc': 'ನಿಮ್ಮ ಸಂಭಾಷಣೆಗಳನ್ನು ಎಂದಿಗೂ ರೆಕಾರ್ಡ್ ಮಾಡಲಾಗುವುದಿಲ್ಲ.',
    'privacy.col1.title': 'ನಿಮ್ಮ ಫೋನ್‌ನಲ್ಲಿ ಮಾತ್ರ ಉಳಿಯುವುದು',
    'privacy.col2.title': 'ಧ್ವನಿ AI ಎಂದಿಗೂ ಮುಟ್ಟದಿರುವುದು',

    // Cockpit
    'cockpit.callStandby': 'ಕರೆ ಸಿದ್ಧವಾಗಿದೆ',
    'cockpit.monitoring': 'ಕರೆ ಮೇಲ್ವಿಚಾರಣೆ ಸಕ್ರಿಯವಾಗಿದೆ',
    'cockpit.startLiveMic': 'ಲೈವ್ ಮೈಕ್ ಪ್ರಾರಂಭಿಸಿ',
    'cockpit.uploadFile': 'ಆಡಿಯೋ ಫೈಲ್ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ',
    'cockpit.endCall': 'ಕರೆ ಮುಕ್ತಾಯಗೊಳಿಸಿ',
    'cockpit.criticalThreat': 'ಅಪಾಯ: AI ವಾಯ್ಸ್ ಕ್ಲೋನ್ ಪತ್ತೆಯಾಗಿದೆ',
  },
};
