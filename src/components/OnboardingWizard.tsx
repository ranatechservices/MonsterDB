import React, { useState } from 'react';
import { Sparkles, HeartPulse, Activity, Bell, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface OnboardingWizardProps {
  onComplete: () => void;
}

export default function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState(1);
  const [age, setAge] = useState('32');
  const [height, setHeight] = useState('172');
  const [weight, setWeight] = useState('68');
  const [conditions, setConditions] = useState<string[]>(['None']);
  const [healthGoals, setHealthGoals] = useState<string[]>(['Improve Fitness', 'Better Sleep']);
  const { updateProfile } = useAuth();

  const handleFinish = () => {
    updateProfile({
      onboardingCompleted: true,
    });
    onComplete();
  };

  const toggleCondition = (cond: string) => {
    if (cond === 'None') {
      setConditions(['None']);
      return;
    }
    const filtered = conditions.filter((c) => c !== 'None');
    if (filtered.includes(cond)) {
      const next = filtered.filter((c) => c !== cond);
      setConditions(next.length ? next : ['None']);
    } else {
      setConditions([...filtered, cond]);
    }
  };

  const toggleGoal = (goal: string) => {
    if (healthGoals.includes(goal)) {
      setHealthGoals(healthGoals.filter((g) => g !== goal));
    } else {
      setHealthGoals([...healthGoals, goal]);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 p-8">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100 dark:border-slate-700">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Step {step} of 3</span>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              {step === 1 && 'Personal Health Baseline'}
              {step === 2 && 'Pre-existing Conditions'}
              {step === 3 && 'Your Primary Wellness Goals'}
            </h2>
          </div>
          <div className="flex gap-1.5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-8 h-2 rounded-full transition-colors ${
                  i <= step ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'
                }`}
              />
            ))}
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Age (Years)</label>
              <input
                id="onboarding-age-input"
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Height (cm)</label>
                <input
                  id="onboarding-height-input"
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Weight (kg)</label>
                <input
                  id="onboarding-weight-input"
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <p className="text-xs text-slate-500 dark:text-slate-400">Select any ongoing health conditions for personalized insights:</p>
            <div className="grid grid-cols-2 gap-2.5">
              {['None', 'Hypertension (BP)', 'Type 2 Diabetes', 'Thyroid', 'Asthma', 'Cholesterol', 'PCOS', 'Migraine'].map((c) => (
                <button
                  id={`cond-${c}`}
                  key={c}
                  type="button"
                  onClick={() => toggleCondition(c)}
                  className={`p-3 rounded-xl text-left text-sm font-medium border transition-all ${
                    conditions.includes(c)
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-semibold'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <p className="text-xs text-slate-500 dark:text-slate-400">Select your top health priorities:</p>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                'Improve Fitness',
                'Better Sleep',
                'Manage Blood Sugar',
                'Lower Blood Pressure',
                'Weight Optimization',
                'Medication Regularity',
                'Stress Relief',
                'Lab Tracking'
              ].map((g) => (
                <button
                  id={`goal-${g}`}
                  key={g}
                  type="button"
                  onClick={() => toggleGoal(g)}
                  className={`p-3 rounded-xl text-left text-sm font-medium border transition-all ${
                    healthGoals.includes(g)
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-semibold'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700">
          {step > 1 ? (
            <button
              id="onboarding-back-btn"
              type="button"
              onClick={() => setStep(step - 1)}
              className="px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl"
            >
              Back
            </button>
          ) : <div />}

          {step < 3 ? (
            <button
              id="onboarding-next-btn"
              type="button"
              onClick={() => setStep(step + 1)}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm flex items-center gap-2"
            >
              Next Step
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              id="onboarding-finish-btn"
              type="button"
              onClick={handleFinish}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm flex items-center gap-2 shadow-md hover:shadow-lg"
            >
              Finish & Start Care
              <CheckCircle2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
