
export type Language = 'en' | 'hi' | 'kn';

export const languageNames: Record<Language, string> = {
  en: 'English',
  hi: 'हिन्दी',
  kn: 'ಕನ್ನಡ',
};

export const translations = {
  // ==========================================
  // ENGLISH
  // ==========================================
  en: {
    // Navigation
    dashboard: 'Dashboard',
    testSample: 'Test a sample',
    samples: 'Samples',
    farmers: 'Farmers',
    hotspotMap: 'Hotspot map',
    settings: 'Settings',
    logout: 'Logout',

    // User roles
    cooperativeAdmin: 'Cooperative admin',
    centreOperator: 'Centre operator',
    foodSafetyOfficer: 'Food safety officer',

    // Authentication
    signIn: 'Sign in',
    email: 'Email',
    password: 'Password',
    role: 'Role',
    fullName: 'Full name',
    profile: 'Profile',

    // Settings
    language: 'Language',
    saveChanges: 'Save changes',
    connection: 'Connection',
    dataSource: 'Data source',
    liveApi: 'Live API',
    welcome: 'Welcome back',
    chooseLanguage: 'Choose your preferred language.',
    languageSaved: 'Language preference saved.',

    // Milk testing
    milkTesting: 'Milk sample testing',
    uploadImage: 'Upload sample image',
    analyzeSample: 'Analyze sample',
    sampleHistory: 'Sample history',
    farmerRecords: 'Farmer records',

    // Milk test results
    pure: 'Pure',
    suspicious: 'Suspicious',
    adulterated: 'Adulterated',

    // Model status
    simulatedResult: 'Demo result — not scientifically validated.',
    validatedResult: 'Validated result',
    demoMode: 'Demo mode',

    // Dashboard
    dashboardGreeting: 'Welcome to DoodhDrishti',
    dashboardSubtitle: 'Monitor milk quality and testing activities',
    samplesToday: 'Samples Today',
    adulteratedPercent: 'Adulterated Percentage',
    averageWater: 'Average Water Content',
    activeCentres: 'Active Centres',
    samplesTrend: 'Samples Trend',
    dailyCounts: 'Daily Counts',
    waterByCentre: 'Water Content by Centre',
    waterLimit: 'Water Limit',
    recentTests: 'Recent Tests',
    latestSamples: 'Latest Samples',
    viewAll: 'View All',

    // Farmers
    farmersTitle: 'Farmers',
    farmersSubtitle: 'Manage and monitor registered farmers',
    searchFarmers: 'Search Farmers',
    sort: 'Sort By',
    pureLowest: 'Lowest Pure Percentage',
    mostSamples: 'Most Samples',
    recentlyTested: 'Recently Tested',
    nameAZ: 'Name A-Z',
    noFarmers: 'No Farmers Found',
    farmer: 'Farmer',
    centre: 'Centre',
    lastTest: 'Last Test',
    waterTrend: 'Water Trend',

    // Hotspot Map
    lowRisk: 'Low Risk',
    elevatedRisk: 'Elevated Risk',
    hotspotRisk: 'High Risk',
    hotspotTitle: 'Milk Quality Hotspot Map',
    hotspotSubtitle: 'Monitor milk quality risks across centres',
    loadingCentres: 'Loading Centres...',
    district: 'District',
    averageWaterShort: 'Average Water',
    viewSamples: 'View Samples',
    adulterationRate: 'Adulteration Rate',
    sizeSamples: 'Number of Samples',
    centresByRisk: 'Centres by Risk',
    tapCentre: 'Tap a centre to view details',

    // Samples
    samplesTitle: 'Milk Samples',
    samplesMatch: 'samples match',
    allTestedSamples: 'All tested milk samples',
    exportCSV: 'Export CSV',
    exportFailed: 'Export failed',
    searchFarmer: 'Search Farmer',
    nameOrId: 'Name or ID',
    from: 'From',
    to: 'To',
    allCentres: 'All Centres',
    verdict: 'Verdict',
    allVerdicts: 'All Verdicts',
    clear: 'Clear',
    noSamples: 'No samples found',
    widenDateRange: 'Try widening the date range',
    page: 'Page',
    of: 'of',
    previous: 'Previous',
    next: 'Next',
    sampleDetail: 'Sample Details',

    // General
    loading: 'Loading...',
    error: 'Something went wrong.',

    // Branding
    tagline: 'Seeing purity in every drop',
    teamProject: 'A Team Nexora project',
  },

  // ==========================================
  // HINDI
  // ==========================================
  hi: {
    // Navigation
    dashboard: 'डैशबोर्ड',
    testSample: 'नमूने की जाँच करें',
    samples: 'नमूने',
    farmers: 'किसान',
    hotspotMap: 'हॉटस्पॉट मानचित्र',
    settings: 'सेटिंग्स',
    logout: 'लॉग आउट',

    // User roles
    cooperativeAdmin: 'सहकारी प्रशासक',
    centreOperator: 'केंद्र संचालक',
    foodSafetyOfficer: 'खाद्य सुरक्षा अधिकारी',

    // Authentication
    signIn: 'साइन इन करें',
    email: 'ईमेल',
    password: 'पासवर्ड',
    role: 'भूमिका',
    fullName: 'पूरा नाम',
    profile: 'प्रोफ़ाइल',

    // Settings
    language: 'भाषा',
    saveChanges: 'बदलाव सहेजें',
    connection: 'कनेक्शन',
    dataSource: 'डेटा स्रोत',
    liveApi: 'लाइव API',
    welcome: 'वापसी पर स्वागत है',
    chooseLanguage: 'अपनी पसंदीदा भाषा चुनें।',
    languageSaved: 'भाषा की पसंद सहेज ली गई है।',

    // Milk testing
    milkTesting: 'दूध के नमूने की जाँच',
    uploadImage: 'नमूने की तस्वीर अपलोड करें',
    analyzeSample: 'नमूने का विश्लेषण करें',
    sampleHistory: 'नमूनों का इतिहास',
    farmerRecords: 'किसानों का रिकॉर्ड',

    // Milk test results
    pure: 'शुद्ध',
    suspicious: 'संदिग्ध',
    adulterated: 'मिलावटी',

    // Model status
    simulatedResult: 'डेमो परिणाम — वैज्ञानिक रूप से सत्यापित नहीं।',
    validatedResult: 'सत्यापित परिणाम',
    demoMode: 'डेमो मोड',

    // Dashboard
    dashboardGreeting: 'डूडधृष्टि में आपका स्वागत है',
    dashboardSubtitle: 'दूध की गुणवत्ता और परीक्षण गतिविधियों की निगरानी करें',
    samplesToday: 'आज के नमूने',
    adulteratedPercent: 'मिलावटी प्रतिशत',
    averageWater: 'औसत पानी की मात्रा',
    activeCentres: 'सक्रिय केंद्र',
    samplesTrend: 'नमूनों का रुझान',
    dailyCounts: 'दैनिक संख्या',
    waterByCentre: 'केंद्र के अनुसार पानी की मात्रा',
    waterLimit: 'पानी की सीमा',
    recentTests: 'हाल के परीक्षण',
    latestSamples: 'नवीनतम नमूने',
    viewAll: 'सभी देखें',

    // Farmers
    farmersTitle: 'किसान',
    farmersSubtitle: 'पंजीकृत किसानों का प्रबंधन और निगरानी करें',
    searchFarmers: 'किसानों को खोजें',
    sort: 'क्रमबद्ध करें',
    pureLowest: 'सबसे कम शुद्ध प्रतिशत',
    mostSamples: 'सबसे अधिक नमूने',
    recentlyTested: 'हाल ही में परीक्षण किए गए',
    nameAZ: 'नाम A-Z',
    noFarmers: 'कोई किसान नहीं मिला',
    farmer: 'किसान',
    centre: 'केंद्र',
    lastTest: 'अंतिम परीक्षण',
    waterTrend: 'पानी का रुझान',

    // Hotspot Map
    lowRisk: 'कम जोखिम',
    elevatedRisk: 'बढ़ा हुआ जोखिम',
    hotspotRisk: 'उच्च जोखिम',
    hotspotTitle: 'दूध गुणवत्ता जोखिम मानचित्र',
    hotspotSubtitle: 'केंद्रों में दूध की गुणवत्ता के जोखिम की निगरानी करें',
    loadingCentres: 'केंद्र लोड हो रहे हैं...',
    district: 'जिला',
    averageWaterShort: 'औसत पानी',
    viewSamples: 'नमूने देखें',
    adulterationRate: 'मिलावट दर',
    sizeSamples: 'नमूनों की संख्या',
    centresByRisk: 'जोखिम के अनुसार केंद्र',
    tapCentre: 'विवरण देखने के लिए केंद्र पर टैप करें',

    // Samples
    samplesTitle: 'दूध के नमूने',
    samplesMatch: 'नमूने मिले',
    allTestedSamples: 'सभी परीक्षण किए गए दूध के नमूने',
    exportCSV: 'CSV निर्यात करें',
    exportFailed: 'निर्यात विफल हुआ',
    searchFarmer: 'किसान खोजें',
    nameOrId: 'नाम या ID',
    from: 'से',
    to: 'तक',
    allCentres: 'सभी केंद्र',
    verdict: 'परिणाम',
    allVerdicts: 'सभी परिणाम',
    clear: 'साफ़ करें',
    noSamples: 'कोई नमूना नहीं मिला',
    widenDateRange: 'तारीख की सीमा बढ़ाकर देखें',
    page: 'पृष्ठ',
    of: 'में से',
    previous: 'पिछला',
    next: 'अगला',
    sampleDetail: 'नमूने का विवरण',

    // General
    loading: 'लोड हो रहा है...',
    error: 'कुछ गलत हो गया।',

    // Branding
    tagline: 'हर बूंद में शुद्धता की पहचान',
    teamProject: 'टीम नेक्सोरा की परियोजना',
  },

  // ==========================================
  // KANNADA
  // ==========================================
  kn: {
    // Navigation
    dashboard: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
    testSample: 'ಮಾದರಿಯನ್ನು ಪರೀಕ್ಷಿಸಿ',
    samples: 'ಮಾದರಿಗಳು',
    farmers: 'ರೈತರು',
    hotspotMap: 'ಹಾಟ್‌ಸ್ಪಾಟ್ ನಕ್ಷೆ',
    settings: 'ಸೆಟ್ಟಿಂಗ್‌ಗಳು',
    logout: 'ಲಾಗ್‌ಔಟ್',

    // User roles
    cooperativeAdmin: 'ಸಹಕಾರಿ ನಿರ್ವಾಹಕರು',
    centreOperator: 'ಕೇಂದ್ರ ನಿರ್ವಾಹಕರು',
    foodSafetyOfficer: 'ಆಹಾರ ಸುರಕ್ಷತಾ ಅಧಿಕಾರಿ',

    // Authentication
    signIn: 'ಸೈನ್ ಇನ್',
    email: 'ಇಮೇಲ್',
    password: 'ಪಾಸ್‌ವರ್ಡ್',
    role: 'ಪಾತ್ರ',
    fullName: 'ಪೂರ್ಣ ಹೆಸರು',
    profile: 'ಪ್ರೊಫೈಲ್',

    // Settings
    language: 'ಭಾಷೆ',
    saveChanges: 'ಬದಲಾವಣೆಗಳನ್ನು ಉಳಿಸಿ',
    connection: 'ಸಂಪರ್ಕ',
    dataSource: 'ಡೇಟಾ ಮೂಲ',
    liveApi: 'ಲೈವ್ API',
    welcome: 'ಮತ್ತೆ ಸ್ವಾಗತ',
    chooseLanguage: 'ನಿಮ್ಮ ಇಷ್ಟದ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ.',
    languageSaved: 'ಭಾಷೆಯ ಆಯ್ಕೆಯನ್ನು ಉಳಿಸಲಾಗಿದೆ.',

    // Milk testing
    milkTesting: 'ಹಾಲಿನ ಮಾದರಿ ಪರೀಕ್ಷೆ',
    uploadImage: 'ಮಾದರಿಯ ಚಿತ್ರವನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ',
    analyzeSample: 'ಮಾದರಿಯನ್ನು ವಿಶ್ಲೇಷಿಸಿ',
    sampleHistory: 'ಮಾದರಿಗಳ ಇತಿಹಾಸ',
    farmerRecords: 'ರೈತರ ದಾಖಲೆಗಳು',

    // Milk test results
    pure: 'ಶುದ್ಧ',
    suspicious: 'ಸಂದೇಹಾಸ್ಪದ',
    adulterated: 'ಕಲಬೆರಕೆ',

    // Model status
    simulatedResult: 'ಡೆಮೊ ಫಲಿತಾಂಶ — ವೈಜ್ಞಾನಿಕವಾಗಿ ದೃಢೀಕರಿಸಲಾಗಿಲ್ಲ.',
    validatedResult: 'ದೃಢೀಕರಿಸಿದ ಫಲಿತಾಂಶ',
    demoMode: 'ಡೆಮೊ ಮೋಡ್',

    // Dashboard
    dashboardGreeting: 'ಡೂಧ್ ದೃಷ್ಟಿಗೆ ಸ್ವಾಗತ',
    dashboardSubtitle: 'ಹಾಲಿನ ಗುಣಮಟ್ಟ ಮತ್ತು ಪರೀಕ್ಷಾ ಚಟುವಟಿಕೆಗಳನ್ನು ಮೇಲ್ವಿಚಾರಣೆ ಮಾಡಿ',
    samplesToday: 'ಇಂದಿನ ಮಾದರಿಗಳು',
    adulteratedPercent: 'ಕಲಬೆರಕೆ ಶೇಕಡಾವಾರು',
    averageWater: 'ಸರಾಸರಿ ನೀರಿನ ಅಂಶ',
    activeCentres: 'ಸಕ್ರಿಯ ಕೇಂದ್ರಗಳು',
    samplesTrend: 'ಮಾದರಿಗಳ ಪ್ರವೃತ್ತಿ',
    dailyCounts: 'ದೈನಂದಿನ ಎಣಿಕೆ',
    waterByCentre: 'ಕೇಂದ್ರದ ಪ್ರಕಾರ ನೀರಿನ ಅಂಶ',
    waterLimit: 'ನೀರಿನ ಮಿತಿ',
    recentTests: 'ಇತ್ತೀಚಿನ ಪರೀಕ್ಷೆಗಳು',
    latestSamples: 'ಇತ್ತೀಚಿನ ಮಾದರಿಗಳು',
    viewAll: 'ಎಲ್ಲವನ್ನೂ ವೀಕ್ಷಿಸಿ',

    // Farmers
    farmersTitle: 'ರೈತರು',
    farmersSubtitle: 'ನೋಂದಾಯಿತ ರೈತರ ನಿರ್ವಹಣೆ ಮತ್ತು ಮೇಲ್ವಿಚಾರಣೆ',
    searchFarmers: 'ರೈತರನ್ನು ಹುಡುಕಿ',
    sort: 'ವಿಂಗಡಿಸಿ',
    pureLowest: 'ಕಡಿಮೆ ಶುದ್ಧತೆಯ ಶೇಕಡಾವಾರು',
    mostSamples: 'ಹೆಚ್ಚಿನ ಮಾದರಿಗಳು',
    recentlyTested: 'ಇತ್ತೀಚೆಗೆ ಪರೀಕ್ಷಿಸಿದವರು',
    nameAZ: 'ಹೆಸರು A-Z',
    noFarmers: 'ಯಾವುದೇ ರೈತರು ಕಂಡುಬಂದಿಲ್ಲ',
    farmer: 'ರೈತ',
    centre: 'ಕೇಂದ್ರ',
    lastTest: 'ಕೊನೆಯ ಪರೀಕ್ಷೆ',
    waterTrend: 'ನೀರಿನ ಪ್ರವೃತ್ತಿ',

    // Hotspot Map
    lowRisk: 'ಕಡಿಮೆ ಅಪಾಯ',
    elevatedRisk: 'ಹೆಚ್ಚಿದ ಅಪಾಯ',
    hotspotRisk: 'ಹೆಚ್ಚಿನ ಅಪಾಯ',
    hotspotTitle: 'ಹಾಲಿನ ಗುಣಮಟ್ಟದ ಅಪಾಯದ ನಕ್ಷೆ',
    hotspotSubtitle: 'ಕೇಂದ್ರಗಳಲ್ಲಿನ ಹಾಲಿನ ಗುಣಮಟ್ಟದ ಅಪಾಯಗಳನ್ನು ಮೇಲ್ವಿಚಾರಣೆ ಮಾಡಿ',
    loadingCentres: 'ಕೇಂದ್ರಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...',
    district: 'ಜಿಲ್ಲೆ',
    averageWaterShort: 'ಸರಾಸರಿ ನೀರು',
    viewSamples: 'ಮಾದರಿಗಳನ್ನು ವೀಕ್ಷಿಸಿ',
    adulterationRate: 'ಕಲಬೆರಕೆ ಪ್ರಮಾಣ',
    sizeSamples: 'ಮಾದರಿಗಳ ಸಂಖ್ಯೆ',
    centresByRisk: 'ಅಪಾಯದ ಪ್ರಕಾರ ಕೇಂದ್ರಗಳು',
    tapCentre: 'ವಿವರಗಳನ್ನು ನೋಡಲು ಕೇಂದ್ರವನ್ನು ಟ್ಯಾಪ್ ಮಾಡಿ',

    // Samples
    samplesTitle: 'ಹಾಲಿನ ಮಾದರಿಗಳು',
    samplesMatch: 'ಮಾದರಿಗಳು ಹೊಂದಿಕೆಯಾಗಿವೆ',
    allTestedSamples: 'ಪರೀಕ್ಷಿಸಿದ ಎಲ್ಲಾ ಹಾಲಿನ ಮಾದರಿಗಳು',
    exportCSV: 'CSV ರಫ್ತು ಮಾಡಿ',
    exportFailed: 'ರಫ್ತು ವಿಫಲವಾಗಿದೆ',
    searchFarmer: 'ರೈತರನ್ನು ಹುಡುಕಿ',
    nameOrId: 'ಹೆಸರು ಅಥವಾ ID',
    from: 'ಇಂದ',
    to: 'ವರೆಗೆ',
    allCentres: 'ಎಲ್ಲಾ ಕೇಂದ್ರಗಳು',
    verdict: 'ಫಲಿತಾಂಶ',
    allVerdicts: 'ಎಲ್ಲಾ ಫಲಿತಾಂಶಗಳು',
    clear: 'ತೆರವುಗೊಳಿಸಿ',
    noSamples: 'ಯಾವುದೇ ಮಾದರಿಗಳು ಕಂಡುಬಂದಿಲ್ಲ',
    widenDateRange: 'ದಿನಾಂಕದ ವ್ಯಾಪ್ತಿಯನ್ನು ಹೆಚ್ಚಿಸಿ',
    page: 'ಪುಟ',
    of: 'ರಲ್ಲಿ',
    previous: 'ಹಿಂದಿನ',
    next: 'ಮುಂದಿನ',
    sampleDetail: 'ಮಾದರಿಯ ವಿವರಗಳು',

    // General
    loading: 'ಲೋಡ್ ಆಗುತ್ತಿದೆ...',
    error: 'ಏನೋ ತಪ್ಪಾಗಿದೆ.',

    // Branding
    tagline: 'ಪ್ರತಿ ಹನಿಯಲ್ಲೂ ಶುದ್ಧತೆಯ ಗುರುತು',
    teamProject: 'ತಂಡ ನೆಕ್ಸೋರಾದ ಯೋಜನೆ',
  },
} as const;

// Automatically generate valid translation keys from English.
export type TranslationKey = keyof typeof translations.en;
