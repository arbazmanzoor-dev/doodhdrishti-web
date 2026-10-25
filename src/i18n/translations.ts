
export type Language = 'en' | 'hi' | 'kn';

export const languageNames: Record<Language, string> = {
  en: 'English',
  hi: 'हिन्दी',
  kn: 'ಕನ್ನಡ',
};

export const translations = {
  en: {
    dashboard: 'Dashboard',
    testSample: 'Test a sample',
    samples: 'Samples',
    farmers: 'Farmers',
    hotspotMap: 'Hotspot map',
    settings: 'Settings',
    logout: 'Logout',

    cooperativeAdmin: 'Cooperative admin',
    centreOperator: 'Centre operator',
    foodSafetyOfficer: 'Food safety officer',

    signIn: 'Sign in',
    email: 'Email',
    password: 'Password',
    role: 'Role',
    fullName: 'Full name',
    profile: 'Profile',
    language: 'Language',
    saveChanges: 'Save changes',
    connection: 'Connection',
    dataSource: 'Data source',
    liveApi: 'Live API',
    welcome: 'Welcome back',
    chooseLanguage: 'Choose your preferred language.',
    languageSaved: 'Language preference saved.',

    milkTesting: 'Milk sample testing',
    uploadImage: 'Upload sample image',
    analyzeSample: 'Analyze sample',
    sampleHistory: 'Sample history',
    farmerRecords: 'Farmer records',

    pure: 'Pure',
    suspicious: 'Suspicious',
    adulterated: 'Adulterated',

    simulatedResult: 'Demo result — not scientifically validated.',
    validatedResult: 'Validated result',
    demoMode: 'Demo mode',

    loading: 'Loading...',
    error: 'Something went wrong.',

    tagline: 'Seeing purity in every drop',
    teamProject: 'A Team Nexora project',
  },

  hi: {
    dashboard: 'डैशबोर्ड',
    testSample: 'नमूने की जाँच करें',
    samples: 'नमूने',
    farmers: 'किसान',
    hotspotMap: 'हॉटस्पॉट मानचित्र',
    settings: 'सेटिंग्स',
    logout: 'लॉग आउट',

    cooperativeAdmin: 'सहकारी प्रशासक',
    centreOperator: 'केंद्र संचालक',
    foodSafetyOfficer: 'खाद्य सुरक्षा अधिकारी',

    signIn: 'साइन इन करें',
    email: 'ईमेल',
    password: 'पासवर्ड',
    role: 'भूमिका',
    fullName: 'पूरा नाम',
    profile: 'प्रोफ़ाइल',
    language: 'भाषा',
    saveChanges: 'बदलाव सहेजें',
    connection: 'कनेक्शन',
    dataSource: 'डेटा स्रोत',
    liveApi: 'लाइव API',
    welcome: 'वापसी पर स्वागत है',
    chooseLanguage: 'अपनी पसंदीदा भाषा चुनें।',
    languageSaved: 'भाषा की पसंद सहेज ली गई है।',

    milkTesting: 'दूध के नमूने की जाँच',
    uploadImage: 'नमूने की तस्वीर अपलोड करें',
    analyzeSample: 'नमूने का विश्लेषण करें',
    sampleHistory: 'नमूनों का इतिहास',
    farmerRecords: 'किसानों का रिकॉर्ड',

    pure: 'शुद्ध',
    suspicious: 'संदिग्ध',
    adulterated: 'मिलावटी',

    simulatedResult: 'डेमो परिणाम — वैज्ञानिक रूप से सत्यापित नहीं।',
    validatedResult: 'सत्यापित परिणाम',
    demoMode: 'डेमो मोड',

    loading: 'लोड हो रहा है...',
    error: 'कुछ गलत हो गया।',

    tagline: 'हर बूंद में शुद्धता की पहचान',
    teamProject: 'टीम नेक्सोरा की परियोजना',
  },

  kn: {
    dashboard: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
    testSample: 'ಮಾದರಿಯನ್ನು ಪರೀಕ್ಷಿಸಿ',
    samples: 'ಮಾದರಿಗಳು',
    farmers: 'ರೈತರು',
    hotspotMap: 'ಹಾಟ್‌ಸ್ಪಾಟ್ ನಕ್ಷೆ',
    settings: 'ಸೆಟ್ಟಿಂಗ್‌ಗಳು',
    logout: 'ಲಾಗ್‌ಔಟ್',

    cooperativeAdmin: 'ಸಹಕಾರಿ ನಿರ್ವಾಹಕರು',
    centreOperator: 'ಕೇಂದ್ರ ನಿರ್ವಾಹಕರು',
    foodSafetyOfficer: 'ಆಹಾರ ಸುರಕ್ಷತಾ ಅಧಿಕಾರಿ',

    signIn: 'ಸೈನ್ ಇನ್',
    email: 'ಇಮೇಲ್',
    password: 'ಪಾಸ್‌ವರ್ಡ್',
    role: 'ಪಾತ್ರ',
    fullName: 'ಪೂರ್ಣ ಹೆಸರು',
    profile: 'ಪ್ರೊಫೈಲ್',
    language: 'ಭಾಷೆ',
    saveChanges: 'ಬದಲಾವಣೆಗಳನ್ನು ಉಳಿಸಿ',
    connection: 'ಸಂಪರ್ಕ',
    dataSource: 'ಡೇಟಾ ಮೂಲ',
    liveApi: 'ಲೈವ್ API',
    welcome: 'ಮತ್ತೆ ಸ್ವಾಗತ',
    chooseLanguage: 'ನಿಮ್ಮ ಇಷ್ಟದ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ.',
    languageSaved: 'ಭಾಷೆಯ ಆಯ್ಕೆಯನ್ನು ಉಳಿಸಲಾಗಿದೆ.',

    milkTesting: 'ಹಾಲಿನ ಮಾದರಿ ಪರೀಕ್ಷೆ',
    uploadImage: 'ಮಾದರಿಯ ಚಿತ್ರವನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ',
    analyzeSample: 'ಮಾದರಿಯನ್ನು ವಿಶ್ಲೇಷಿಸಿ',
    sampleHistory: 'ಮಾದರಿಗಳ ಇತಿಹಾಸ',
    farmerRecords: 'ರೈತರ ದಾಖಲೆಗಳು',

    pure: 'ಶುದ್ಧ',
    suspicious: 'ಸಂದೇಹಾಸ್ಪದ',
    adulterated: 'ಕಲಬೆರಕೆ',

    simulatedResult: 'ಡೆಮೊ ಫಲಿತಾಂಶ — ವೈಜ್ಞಾನಿಕವಾಗಿ ದೃಢೀಕರಿಸಲಾಗಿಲ್ಲ.',
    validatedResult: 'ದೃಢೀಕರಿಸಿದ ಫಲಿತಾಂಶ',
    demoMode: 'ಡೆಮೊ ಮೋಡ್',

    loading: 'ಲೋಡ್ ಆಗುತ್ತಿದೆ...',
    error: 'ಏನೋ ತಪ್ಪಾಗಿದೆ.',

    tagline: 'ಪ್ರತಿ ಹನಿಯಲ್ಲೂ ಶುದ್ಧತೆಯ ಗುರುತು',
    teamProject: 'ತಂಡ ನೆಕ್ಸೋರಾದ ಯೋಜನೆ',
  },
} as const;

export type TranslationKey = keyof typeof translations.en;
