'use client';

import { Check, Globe, Sparkles, Users, Shield } from 'lucide-react';

export default function UpgradeToPro() {
  const handleWhatsApp = () => {
    const phone = '919632301231';
    const msg = encodeURIComponent(
      "Hi Admit55 team, I'd like to upgrade to Pro. Please share the next steps and payment details."
    );
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        
        {/* Header Badge */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-4 py-2 text-sm font-medium text-teal-700 border border-teal-200">
            <Globe className="h-4 w-4" />
            Available for applicants worldwide
          </div>
        </div>

        {/* Main Title */}
        <div className="text-center mb-6">
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
            Upgrade to Pro (Global Access)
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Get full access to all AI agents, advanced insights, and personalized guidance.
            <br />
            Works seamlessly for applicants from India and abroad.
          </p>
        </div>

        {/* Pro Plan Card */}
        <div className="mt-12 rounded-3xl bg-gradient-to-br from-teal-600 via-teal-600 to-teal-700 p-10 shadow-2xl">
          
          {/* Header */}
          <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Pro Plan</h2>
              <p className="text-teal-100">One-time payment, lifetime access</p>
            </div>
            <div className="text-right">
              <div className="text-5xl font-bold text-white">₹1,999</div>
              <div className="text-teal-100 text-sm mt-1">INR</div>
            </div>
          </div>

          {/* Feature Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            
            {/* 30 AI Runs */}
            <div className="rounded-2xl bg-white/10 backdrop-blur-sm p-6 border border-white/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="rounded-lg bg-white/20 p-2">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">30 AI Runs</h3>
              </div>
              <p className="text-teal-50 text-sm">6x more runs than the free plan</p>
            </div>

            {/* 2 Alum Sessions */}
            <div className="rounded-2xl bg-white/10 backdrop-blur-sm p-6 border border-white/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="rounded-lg bg-white/20 p-2">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">2 Alum Sessions</h3>
              </div>
              <p className="text-teal-50 text-sm">1-on-1 strategy calls with MBA alumni</p>
            </div>
          </div>

          {/* Features List */}
          <div className="space-y-3 mb-8">
            <div className="flex items-center gap-3 text-white">
              <div className="rounded-full bg-white/20 p-1">
                <Check className="h-4 w-4" />
              </div>
              <span className="text-base">Profile Review AI</span>
            </div>
            <div className="flex items-center gap-3 text-white">
              <div className="rounded-full bg-white/20 p-1">
                <Check className="h-4 w-4" />
              </div>
              <span className="text-base">B-School Match AI</span>
            </div>
            <div className="flex items-center gap-3 text-white">
              <div className="rounded-full bg-white/20 p-1">
                <Check className="h-4 w-4" />
              </div>
              <span className="text-base">Essay Lab (coming soon)</span>
            </div>
            <div className="flex items-center gap-3 text-white">
              <div className="rounded-full bg-white/20 p-1">
                <Check className="h-4 w-4" />
              </div>
              <span className="text-base">Interview Ready (coming soon)</span>
            </div>
            <div className="flex items-center gap-3 text-white">
              <div className="rounded-full bg-white/20 p-1">
                <Check className="h-4 w-4" />
              </div>
              <span className="text-base">Smart Resume (coming soon)</span>
            </div>
            <div className="flex items-center gap-3 text-white">
              <div className="rounded-full bg-white/20 p-1">
                <Check className="h-4 w-4" />
              </div>
              <span className="text-base">Priority support</span>
            </div>
          </div>
        </div>

        {/* How to Upgrade Section */}
        <div className="mt-16 bg-white rounded-3xl p-10 shadow-lg border border-slate-200">
          <h2 className="text-3xl font-bold text-slate-900 mb-10">How to Upgrade</h2>

          {/* Step 1 */}
          <div className="flex gap-6 mb-10">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-teal-100 text-teal-700 font-bold text-lg">
                1
              </div>
            </div>
            <div className="flex-grow">
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Reach Out on WhatsApp
              </h3>
              <p className="text-slate-600 mb-4">
                Contact us on WhatsApp to request a Pro upgrade.
              </p>
              <button
                onClick={handleWhatsApp}
                className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-6 py-3 text-base font-semibold text-white hover:bg-teal-700 transition-colors shadow-md hover:shadow-lg"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                WhatsApp Us
              </button>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-6 mb-10">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-teal-100 text-teal-700 font-bold text-lg">
                2
              </div>
            </div>
            <div className="flex-grow">
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Submit Your Request & Make Payment
              </h3>
              <p className="text-slate-600 mb-2">
                Share your registered email and preferred payment method.
                <br />
                We support both Indian and international candidates.
              </p>
              <p className="text-sm text-slate-500 italic">
                Payment options may include UPI, international transfer, or other supported methods shared on WhatsApp.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-6">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-teal-100 text-teal-700 font-bold text-lg">
                3
              </div>
            </div>
            <div className="flex-grow">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xl font-bold text-slate-900">
                  Get Upgraded Within 2 Hours
                </h3>
                <Check className="h-6 w-6 text-teal-600" />
              </div>
              <p className="text-slate-600">
                Your Pro account will be activated within 2 hours, and you'll be notified on email and WhatsApp.
              </p>
            </div>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-10 flex items-center justify-center gap-8 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span>Secure activation</span>
          </div>
          <div className="hidden sm:block w-px h-4 bg-slate-300"></div>
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4" />
            <span>Human-verified</span>
          </div>
          <div className="hidden sm:block w-px h-4 bg-slate-300"></div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            <span>Fast turnaround</span>
          </div>
        </div>
      </div>
    </div>
  );
}