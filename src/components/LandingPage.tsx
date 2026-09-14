import React, { useState } from 'react';
import {
  HeartPulse,
  Activity,
  FileText,
  ShieldCheck,
  Stethoscope,
  Users,
  Building2,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Lock,
  ChevronDown,
  ChevronUp,
  Globe,
  Zap,
  Clock,
  PhoneCall,
  TrendingUp,
  Award
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../localization/language_context';

interface LandingPageProps {
  onOpenAuth: (initialMode?: 'login' | 'signup') => void;
  onOpenStatic?: (page: 'privacy' | 'terms') => void;
}

export default function LandingPage({ onOpenAuth, onOpenStatic }: LandingPageProps) {
  const { loginAsDemo } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'vitals' | 'reports' | 'twin' | 'circle'>('reports');

  const faqs = [
    {
      q: 'How does DHealora AI analyze medical lab reports?',
      qHi: 'DHealora AI मेडिकल लैब रिपोर्ट का विश्लेषण कैसे करता है?',
      a: 'DHealora uses high-precision clinical vision and natural language processing to extract biomarkers (such as HbA1c, Lipid profile, CBC, Thyroid panel), compare them against standard reference ranges, and provide structured insights in simple English and Hindi alongside clinical follow-up recommendations.',
      aHi: 'DHealora उच्च-सटीकता क्लिनिकल AI का उपयोग करके बायोमार्कर्स (जैसे HbA1c, लिपिड, सीबीसी) को निकालता है, सामान्य संदर्भ सीमाओं से तुलना करता है और सरल भाषा में सारांश व सलाह प्रदान करता है।'
    },
    {
      q: 'Is my health and personal data secure and private?',
      qHi: 'क्या मेरा स्वास्थ्य डेटा सुरक्षित और निजी है?',
      a: 'Yes, absolutely. DHealora complies with ABDM (Ayushman Bharat Digital Mission) standards and HIPAA protocols. All records and telemetry data are encrypted with 256-bit AES encryption at rest and TLS 1.3 in transit. We never sell your data.',
      aHi: 'हाँ, बिल्कुल। DHealora ABDM और HIPAA मानकों के अनुरूप 256-बिट एन्क्रिप्शन के साथ पूरी तरह सुरक्षित है। आपका व्यक्तिगत डेटा कभी भी किसी तीसरे पक्ष को नहीं बेचा जाता।'
    },
    {
      q: 'Can I monitor health vitals for my parents or family members?',
      qHi: 'क्या मैं अपने माता-पिता या परिवार के सदस्यों के वाइटल्स मॉनिटर कर सकता हूँ?',
      a: 'Yes! The Family Care Circle feature allows you to connect dependent accounts, receive automatic emergency alerts if vitals breach critical thresholds, and maintain shared medication schedules.',
      aHi: 'हाँ! फैमिली केयर सर्कल के माध्यम से आप बुजुर्गों और परिवार के सदस्यों के स्वास्थ्य मेट्रिक्स देख सकते हैं और आपातकालीन स्थिति में तुरंत अलर्ट प्राप्त कर सकते हैं।'
    },
    {
      q: 'Does DHealora replace in-person doctor visits?',
      qHi: 'क्या DHealora डॉक्टर के क्लिनिक जाने का विकल्प है?',
      a: 'No. DHealora AI acts as an assistive clinical companion to help you organize data, track longitudinal trends, and prepare for appointments. We offer direct teleconsultation with licensed specialists when medical interventions or prescriptions are required.',
      aHi: 'नहीं। DHealora एक सहायक स्वास्थ्य साथी है जो डेटा समझने में मदद करता है। किसी भी चिकित्सीय सलाह या दवा के लिए हमारे प्लेटफॉर्म पर सत्यापित विशेषज्ञ डॉक्टरों से परामर्श लिया जा सकता है।'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200 selection:bg-emerald-500 selection:text-white">
      {/* 1. TOP ANNOUNCEMENT / TRUST BAR */}
      <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-semibold text-center flex items-center justify-center gap-2 flex-wrap shadow-sm">
        <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px] tracking-wider uppercase font-bold">
          ABDM Ready
        </span>
        <span>
          {language === 'hi'
            ? 'भारत का प्रमुख AI-संचालित डिजिटल स्वास्थ्य एवं क्लिनिकल रिकॉर्ड प्लेटफॉर्म'
            : 'Next-Gen Clinical AI Diagnostic, Longitudinal Health Records & Care Ecosystem'}
        </span>
      </div>

      {/* 2. NAVBAR */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-11 h-11 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-2xl flex items-center justify-center text-white shadow-md shadow-emerald-500/20 ring-4 ring-emerald-50 dark:ring-emerald-950/40">
              <HeartPulse className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                  DHealora<span className="text-emerald-600">.</span>
                </span>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 rounded-md tracking-wider">
                  Health AI
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
                Clinical Intelligence & Health Continuity
              </p>
            </div>
          </div>

          {/* Nav Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-semibold text-slate-600 dark:text-slate-300">
            <a href="#features" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition">
              {language === 'hi' ? 'विशेषताएं' : 'Platform Features'}
            </a>
            <a href="#diagnostics" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition">
              {language === 'hi' ? 'AI डायग्नोस्टिक्स' : 'AI Diagnostics'}
            </a>
            <a href="#caregivers" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition">
              {language === 'hi' ? 'फैमिली केयर' : 'Care Circle'}
            </a>
            <a href="#security" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition">
              {language === 'hi' ? 'सुरक्षा व गोपनीयता' : 'Security & Privacy'}
            </a>
            <a href="#faq" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition">
              {language === 'hi' ? 'अक्सर पूछे जाने वाले सवाल' : 'FAQ'}
            </a>
          </nav>

          {/* Action CTAs & Language Switcher */}
          <div className="flex items-center gap-3">
            {/* Language Switch */}
            <button
              id="landing-lang-toggle"
              onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition cursor-pointer"
              title="Change Language"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{language === 'en' ? 'हिन्दी' : 'English'}</span>
            </button>

            {/* Sign In Button */}
            <button
              id="landing-signin-btn"
              onClick={() => onOpenAuth('login')}
              className="px-4 py-2 text-sm font-bold text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition cursor-pointer"
            >
              {language === 'hi' ? 'लॉग इन' : 'Sign In'}
            </button>

            {/* Get Started Button */}
            <button
              id="landing-getstarted-btn"
              onClick={() => onOpenAuth('signup')}
              className="px-5 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] rounded-xl shadow-md shadow-emerald-600/25 transition flex items-center gap-2 cursor-pointer"
            >
              <span>{language === 'hi' ? 'शुरू करें' : 'Get Started'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* 3. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Column: Value Proposition */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100/80 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold shadow-xs">
                <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>
                  {language === 'hi'
                    ? 'अत्याधुनिक AI डायग्नोस्टिक्स एवं हेल्थ ट्रैकर'
                    : 'Intelligent Healthcare & Predictive Clinical Companion'}
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.12]">
                {language === 'hi' ? (
                  <>
                    आपकी सम्पूर्ण सेहत का <span className="text-emerald-600">स्मार्ट सुरक्षा कवच</span>
                  </>
                ) : (
                  <>
                    One Platform for Your <span className="text-emerald-600">Lifelong Health</span> & Clinical Intelligence.
                  </>
                )}
              </h1>

              <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 font-normal leading-relaxed max-w-2xl mx-auto lg:mx-0">
                {language === 'hi'
                  ? 'AI लैब रिपोर्ट विश्लेषक, लाइव वाइटल्स मॉनिटरिंग, डिजिटल हेल्थ ट्विन, ईएमआर निरंतरता हब और विशेषज्ञ डॉक्टरों से 24/7 सुरक्षित परामर्श — सब एक जगह।'
                  : 'Transforming medical telemetry into actionable insights. Analyze lab reports with instant biomarker decoding, monitor vitals in real-time, predict wellness trajectories, and connect seamlessly with certified doctors.'}
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <button
                  id="hero-create-account-btn"
                  onClick={() => onOpenAuth('signup')}
                  className="w-full sm:w-auto px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base rounded-2xl shadow-lg shadow-emerald-600/30 hover:shadow-xl hover:shadow-emerald-600/40 transition-all active:scale-[0.98] flex items-center justify-center gap-3 cursor-pointer"
                >
                  <span>{language === 'hi' ? 'मुफ्त अकाउंट बनाएं' : 'Create Free Account'}</span>
                  <ArrowRight className="w-5 h-5" />
                </button>

                <button
                  id="hero-demo-login-btn"
                  onClick={() => loginAsDemo('patient')}
                  className="w-full sm:w-auto px-7 py-4 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold text-base rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm transition active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Zap className="w-5 h-5 text-amber-500" />
                  <span>{language === 'hi' ? 'डेमो अकाउंट एक्सप्लोर करें' : 'Explore Live Demo'}</span>
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-slate-500 dark:text-slate-400 font-medium">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>{language === 'hi' ? '100% नि:शुल्क रोगी पोर्टल' : 'Free Patient Portal'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>{language === 'hi' ? 'ABDM एवं HIPAA सुरक्षा' : 'ABDM & HIPAA Compliant'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-emerald-500" />
                  <span>{language === 'hi' ? '256-बिट एंड-टू-एंड एन्क्रिप्शन' : '256-bit AES Encryption'}</span>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Clinical Snapshot Preview Card */}
            <div className="lg:col-span-5">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                {/* Decorative background glow */}
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-3xl blur-xl opacity-20 dark:opacity-30"></div>

                <div className="relative bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700/80 shadow-2xl p-6 sm:p-7 space-y-6">
                  {/* Card Header with Live Simulation */}
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700/60">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black">
                        <Activity className="w-5 h-5 animate-pulse" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-900 dark:text-white">
                          Clinical Telemetry Engine
                        </h4>
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block"></span>
                          Live Telemetry Sync Active
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-1 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300">
                      Sample Patient
                    </span>
                  </div>

                  {/* Vitals Telemetry Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                        <span>Heart Rate</span>
                        <span className="text-rose-500 font-bold">BPM</span>
                      </div>
                      <div className="text-2xl font-black text-slate-900 dark:text-white">
                        72 <span className="text-xs font-normal text-emerald-600">Normal</span>
                      </div>
                    </div>

                    <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                        <span>Blood Pressure</span>
                        <span className="text-blue-500 font-bold">mmHg</span>
                      </div>
                      <div className="text-2xl font-black text-slate-900 dark:text-white">
                        118/78 <span className="text-xs font-normal text-emerald-600">Optimal</span>
                      </div>
                    </div>

                    <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                        <span>Blood Glucose</span>
                        <span className="text-amber-500 font-bold">mg/dL</span>
                      </div>
                      <div className="text-2xl font-black text-slate-900 dark:text-white">
                        94 <span className="text-xs font-normal text-emerald-600">Fasting</span>
                      </div>
                    </div>

                    <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                        <span>Blood Oxygen</span>
                        <span className="text-teal-500 font-bold">SpO2</span>
                      </div>
                      <div className="text-2xl font-black text-slate-900 dark:text-white">
                        99% <span className="text-xs font-normal text-emerald-600">High</span>
                      </div>
                    </div>
                  </div>

                  {/* AI Clinical Diagnostic Banner */}
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200/70 dark:border-emerald-900/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        AI Lab Interpretation Snapshot
                      </span>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-emerald-200/70 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 rounded">
                        HbA1c & Lipid Panel
                      </span>
                    </div>
                    <p className="text-xs text-emerald-950 dark:text-emerald-100 leading-relaxed font-medium">
                      "HbA1c of 5.4% indicates normal glycemic control. Lipid ratio improved by 12% following personalized 30-day regimen."
                    </p>
                  </div>

                  {/* Quick Card Action */}
                  <button
                    onClick={() => onOpenAuth('signup')}
                    className="w-full py-3 bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    <span>{language === 'hi' ? 'अपना व्यक्तिगत हेल्थ रिकॉर्ड बनाएं' : 'Build Your Personal Health Record'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SIX PILLARS OF CLINICAL CARE (FEATURES) */}
      <section id="features" className="py-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <span className="text-xs font-black tracking-widest text-emerald-600 uppercase">
              {language === 'hi' ? 'व्यापक स्वास्थ्य मंच' : 'Comprehensive Clinical Architecture'}
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              {language === 'hi'
                ? 'बेहतर स्वास्थ्य के लिए 6 शक्तिशाली टूल्स'
                : 'Engineered for Complete Precision Healthcare'}
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-base">
              {language === 'hi'
                ? 'डायग्नोस्टिक रिपोर्ट विश्लेषण से लेकर टेलीकंसल्टेशन और आपातकालीन SOS तक, आपकी हर मेडिकल आवश्यकता का समाधान।'
                : 'Seamlessly bridging the gap between patient vitals, clinical diagnostic analysis, longitudinal records, and caregiver intervention.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1: AI Diagnostic Report Analyzer */}
            <div className="p-8 bg-slate-50 dark:bg-slate-800/80 rounded-3xl border border-slate-200/80 dark:border-slate-700/60 hover:shadow-xl transition-all duration-300 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {language === 'hi' ? 'AI लैब रिपोर्ट विश्लेषक' : 'AI Diagnostic Report Analyzer'}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {language === 'hi'
                  ? 'अपनी ब्लड टेस्ट और इमेजिंग रिपोर्ट अपलोड करें। हमारा AI सभी बायोमार्कर्स को सेकंडों में प्रोसेस करके स्पष्ट सारांश और डॉक्टर के लिए प्रश्न तैयार करता है।'
                  : 'Upload lab PDFs or photos. Instant biomarker parsing, reference range comparison, critical value alerts, and personalized clinical questions.'}
              </p>
            </div>

            {/* Feature 2: Continuous Vitals & IoT */}
            <div className="p-8 bg-slate-50 dark:bg-slate-800/80 rounded-3xl border border-slate-200/80 dark:border-slate-700/60 hover:shadow-xl transition-all duration-300 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {language === 'hi' ? 'वाइटल्स ट्रैकिंग व टेलीमेट्री' : 'Vitals Tracker & Telemetry'}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {language === 'hi'
                  ? 'हृदय गति, रक्तचाप, ब्लड शुगर और ऑक्सीजन स्तर को ट्रैक करें। असामान्य उतार-चढ़ाव पर तुरंत चेतावनी प्राप्त करें।'
                  : 'Log and analyze blood pressure, heart rate, fasting/PP blood glucose, and SpO2 with longitudinal interactive charts and anomaly flags.'}
              </p>
            </div>

            {/* Feature 3: Digital Health Twin */}
            <div className="p-8 bg-slate-50 dark:bg-slate-800/80 rounded-3xl border border-slate-200/80 dark:border-slate-700/60 hover:shadow-xl transition-all duration-300 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-black">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {language === 'hi' ? 'डिजिटल हेल्थ ट्विन' : 'Digital Health Twin & Risk Models'}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {language === 'hi'
                  ? 'आपके बायोमेट्रिक डेटा पर आधारित डिजिटल सिमुलेशन जो आगामी 5 वर्षों के स्वास्थ्य जोखिमों और जीवनशैली सुधार का आकलन करता है।'
                  : 'Predictive 5-year cardiovascular, metabolic, and lifestyle risk trajectory modeling based on your physiological parameters.'}
              </p>
            </div>

            {/* Feature 4: Health Continuity Hub */}
            <div className="p-8 bg-slate-50 dark:bg-slate-800/80 rounded-3xl border border-slate-200/80 dark:border-slate-700/60 hover:shadow-xl transition-all duration-300 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {language === 'hi' ? 'हेल्थ निरंतरता हब (EMR)' : 'Health Continuity Hub (EMR)'}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {language === 'hi'
                  ? 'जीवनभर का कालक्रमानुसार मेडिकल इतिहास। पुराने पर्चे, टेस्ट, दवाइयां और डॉक्टर नोट्स एक क्लिक में उपलब्ध।'
                  : 'Consolidated lifetime medical timeline. Seamless continuity between past treatments, specialist notes, prescription logs, and follow-ups.'}
              </p>
            </div>

            {/* Feature 5: Family Care Circle */}
            <div className="p-8 bg-slate-50 dark:bg-slate-800/80 rounded-3xl border border-slate-200/80 dark:border-slate-700/60 hover:shadow-xl transition-all duration-300 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center font-black">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {language === 'hi' ? 'फैमिली केयर सर्कल व SOS' : 'Care Circle & Emergency SOS'}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {language === 'hi'
                  ? 'माता-पिता और बच्चों की दूर से देखभाल करें। आपातकालीन स्थिति में 112 और नामांकित संपर्कों को तुरंत जीपीएस अलर्ट।'
                  : 'Remote caregiver dashboard for elderly parents, synchronized medication adherence reminders, and instant emergency 112 dispatch.'}
              </p>
            </div>

            {/* Feature 6: Doctor Consultation Booking */}
            <div className="p-8 bg-slate-50 dark:bg-slate-800/80 rounded-3xl border border-slate-200/80 dark:border-slate-700/60 hover:shadow-xl transition-all duration-300 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center font-black">
                <Stethoscope className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {language === 'hi' ? 'सत्यापित डॉक्टर टेलीकंसल्टेशन' : 'Teleconsultation & Specialist Network'}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {language === 'hi'
                  ? 'कार्डियोलॉजिस्ट, डायबिटोलॉजिस्ट और सामान्य चिकित्सकों से वीडियो या क्लिनिक अपॉइंटमेंट बुक करें।'
                  : 'Direct video consultations and in-clinic bookings with licensed physicians and multi-speciality hospital networks.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. HOW IT WORKS (3 SIMPLE STEPS) */}
      <section className="py-20 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-black tracking-widest text-emerald-600 uppercase">
              {language === 'hi' ? 'उपयोग का तरीका' : 'Intuitive Workflow'}
            </span>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white">
              {language === 'hi' ? '3 आसान चरणों में शुरू करें' : 'How DHealora Works in 3 Simple Steps'}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-emerald-600 text-white font-black text-lg flex items-center justify-center mx-auto shadow-md">
                1
              </div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                {language === 'hi' ? 'डेटा अपलोड व सिंक करें' : 'Connect & Upload'}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {language === 'hi'
                  ? 'अपनी पिछली लैब रिपोर्ट अपलोड करें या ब्लूटूथ/मैनुअल माध्यम से रोज़ाना वाइटल्स रिकॉर्ड करें।'
                  : 'Upload your diagnostic reports or record daily vitals, symptoms, and current medication logs.'}
              </p>
            </div>

            <div className="p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-emerald-600 text-white font-black text-lg flex items-center justify-center mx-auto shadow-md">
                2
              </div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                {language === 'hi' ? 'AI क्लिनिकल एनालिसिस' : 'AI Analysis & Insights'}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {language === 'hi'
                  ? 'हमारा AI इंजन बायोमार्कर्स की व्याख्या करता है, असामान्यताएं पहचानता है और स्वास्थ्य सलाह तैयार करता है।'
                  : 'Our clinical AI interprets biomarker trends, correlates vitals, and computes preventive wellness scores.'}
              </p>
            </div>

            <div className="p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-emerald-600 text-white font-black text-lg flex items-center justify-center mx-auto shadow-md">
                3
              </div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                {language === 'hi' ? 'निरंतर देखभाल व परामर्श' : 'Care Plan & Doctor Continuity'}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {language === 'hi'
                  ? 'अपनी समरी डॉक्टर के साथ शेयर करें, वीडियो कंसल्टेशन करें और परिवार के साथ सुरक्षित रहें।'
                  : 'Share structured summaries with your doctor, book consultations, and keep family caregivers in the loop.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FREQUENTLY ASKED QUESTIONS (FAQ) */}
      <section id="faq" className="py-20 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 space-y-3">
            <span className="text-xs font-black tracking-widest text-emerald-600 uppercase">
              {language === 'hi' ? 'सहायता केंद्र' : 'Frequently Asked Questions'}
            </span>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white">
              {language === 'hi' ? 'अक्सर पूछे जाने वाले सवाल' : 'Got Questions? We Have Answers.'}
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div
                  key={idx}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transition shadow-xs"
                >
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-base text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 transition cursor-pointer"
                  >
                    <span>{language === 'hi' ? faq.qHi : faq.q}</span>
                    {isOpen ? <ChevronUp className="w-5 h-5 shrink-0" /> : <ChevronDown className="w-5 h-5 shrink-0" />}
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-sm text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800/60 pt-3">
                      {language === 'hi' ? faq.aHi : faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 8. CALL TO ACTION BANNER */}
      <section className="py-20 bg-emerald-600 text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
            {language === 'hi'
              ? 'आज ही अपने स्वास्थ्य की बागडोर संभालें'
              : 'Take Charge of Your Health Today'}
          </h2>
          <p className="text-emerald-100 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            {language === 'hi'
              ? 'DHealora के साथ अपने और अपने परिवार के स्वास्थ्य को स्मार्ट और सुरक्षित बनाएं। नि:शुल्क खाता बनाकर शुरू करें।'
              : 'Join thousands of individuals and families utilizing next-generation clinical intelligence and telemetry monitoring.'}
          </p>
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => onOpenAuth('signup')}
              className="w-full sm:w-auto px-8 py-4 bg-white text-emerald-700 hover:bg-emerald-50 font-black text-base rounded-2xl shadow-xl transition-all active:scale-[0.98] cursor-pointer"
            >
              {language === 'hi' ? 'निशुल्क रजिस्टर करें' : 'Get Started for Free'}
            </button>
            <button
              onClick={() => onOpenAuth('login')}
              className="w-full sm:w-auto px-8 py-4 bg-emerald-700/60 hover:bg-emerald-700 text-white font-bold text-base rounded-2xl border border-emerald-400/40 transition active:scale-[0.98] cursor-pointer"
            >
              {language === 'hi' ? 'मौजूदा सदस्य लॉगिन' : 'Existing Member Sign In'}
            </button>
          </div>
        </div>
      </section>

      {/* 9. FOOTER */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-slate-800">
            {/* Col 1: Brand */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-white">
                <HeartPulse className="w-6 h-6 text-emerald-500" />
                <span className="text-xl font-black">DHealora</span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                Next-generation clinical AI intelligence, biomarker telemetry, and comprehensive healthcare continuity.
              </p>
              <p className="text-[11px] text-slate-500">
                ABDM Compliant • HIPAA Aligned
              </p>
            </div>

            {/* Col 2: Capabilities */}
            <div className="space-y-2">
              <h5 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">Platform</h5>
              <ul className="space-y-1.5">
                <li><a href="#features" className="hover:text-emerald-400 transition">AI Diagnostic Analyzer</a></li>
                <li><a href="#features" className="hover:text-emerald-400 transition">Vitals & Telemetry</a></li>
                <li><a href="#features" className="hover:text-emerald-400 transition">Digital Health Twin</a></li>
                <li><a href="#features" className="hover:text-emerald-400 transition">Health Continuity Hub</a></li>
              </ul>
            </div>

            {/* Col 3: Legal & Security */}
            <div className="space-y-2">
              <h5 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">Privacy & Trust</h5>
              <ul className="space-y-1.5">
                <li>
                  <button
                    onClick={() => onOpenStatic?.('privacy')}
                    className="hover:text-emerald-400 transition text-left cursor-pointer"
                  >
                    Privacy Policy (गोपनीयता नीति)
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onOpenStatic?.('terms')}
                    className="hover:text-emerald-400 transition text-left cursor-pointer"
                  >
                    Terms of Service (सेवा की शर्तें)
                  </button>
                </li>
                <li><span className="text-slate-500">256-bit AES Encryption</span></li>
                <li><span className="text-slate-500">Data Ownership Guarantee</span></li>
              </ul>
            </div>

            {/* Col 4: Quick Sign In */}
            <div className="space-y-3">
              <h5 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">Access</h5>
              <button
                onClick={() => onOpenAuth('login')}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition cursor-pointer text-center"
              >
                Sign In to Patient Portal
              </button>
              <button
                onClick={() => loginAsDemo('super_admin')}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl transition cursor-pointer text-center border border-slate-700 text-[11px]"
              >
                Administrator Portal
              </button>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
            <p>© 2026 DHealora Healthcare Intelligence Inc. All rights reserved.</p>
            <p>Clinical AI companion is designed for preventive wellness & record management.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
