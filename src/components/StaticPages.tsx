import React from 'react';
import { ShieldCheck, FileText, HeartPulse, Lock, Info, Mail } from 'lucide-react';

export function PrivacyPolicyPage({ onBack }: { onBack?: () => void }) {
  return (
    <div className="max-w-4xl mx-auto p-6 md:p-10 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 my-8 shadow-sm">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-700">
        <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Privacy Policy & Health Data Protection</h1>
          <p className="text-xs text-slate-500">Effective Date: January 2026 | ABDM & HIPAA Aligned</p>
        </div>
      </div>

      <div className="space-y-6 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
        <section>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">1. Your Health Data Privacy Guarantee</h3>
          <p>
            At DHealora, your personal health records, vitals, lab reports, and doctor discussions are encrypted both in-transit and at-rest using AES-256 standards. We strictly never sell your personal identifiable health information to third-party advertisers.
          </p>
        </section>

        <section>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">2. How AI is Used for Clinical Insights</h3>
          <p>
            Our AI analysis functions as an assistive companion to summarize complex medical lab reports and suggest timely health habits. AI outputs are intended for educational and support purposes and do not substitute for in-person licensed medical diagnosis.
          </p>
        </section>

        <section>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">3. Data Retention & Deletion Rights</h3>
          <p>
            You retain absolute ownership of all stored health entries. You may export or permanently delete your health records at any time from your Settings panel.
          </p>
        </section>
      </div>

      {onBack && (
        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700">
          <button
            onClick={onBack}
            className="px-6 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-800 dark:text-white text-sm font-semibold rounded-xl"
          >
            Back to Application
          </button>
        </div>
      )}
    </div>
  );
}

export function TermsOfServicePage({ onBack }: { onBack?: () => void }) {
  return (
    <div className="max-w-4xl mx-auto p-6 md:p-10 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 my-8 shadow-sm">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-700">
        <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center">
          <FileText className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Terms of Service</h1>
          <p className="text-xs text-slate-500">Last updated: 2026</p>
        </div>
      </div>

      <div className="space-y-6 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
        <section>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">1. Acceptance of Terms</h3>
          <p>
            By accessing or using the DHealora platform, you agree to comply with these terms. If you are experiencing a life-threatening medical emergency, call 112 / 911 or your local emergency services immediately.
          </p>
        </section>

        <section>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">2. Medical Disclaimer</h3>
          <p>
            DHealora provides personalized health organization, tracking, and AI insights. Consultations with verified healthcare practitioners booked via the platform are governed by their respective professional medical boards.
          </p>
        </section>
      </div>

      {onBack && (
        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700">
          <button
            onClick={onBack}
            className="px-6 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-800 dark:text-white text-sm font-semibold rounded-xl"
          >
            Back to Application
          </button>
        </div>
      )}
    </div>
  );
}
