'use client';

import { Mail, MessageCircle } from 'lucide-react';
import { useState } from 'react';

export default function Guidance() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleWhatsApp = () => {
    const phone = '919632301231';
    const msg = encodeURIComponent(
      "Hi Admit55 team, I need personalized guidance for my MBA application. Please connect with me."
    );
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
  };

  const handleEmail = () => {
    window.location.href = 'mailto:crew@admit55.com?subject=Need Personalized Guidance';
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    // Simulate form submission (replace with actual API call)
    try {
      // Replace this with your actual API endpoint
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // On success
      setSubmitStatus('success');
      setFormData({ name: '', email: '', phone: '' });
      
      // Reset success message after 3 seconds
      setTimeout(() => setSubmitStatus('idle'), 3000);
    } catch (error) {
      setSubmitStatus('error');
      setTimeout(() => setSubmitStatus('idle'), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="w-full bg-gradient-to-b from-white to-slate-50 py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
            Need personalized guidance?
          </h2>
          <p className="text-slate-600 text-lg">
            For custom mentoring, strategy calls, and 1-on-1 coaching with alumni.
          </p>
        </div>

        {/* Contact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 max-w-3xl mx-auto">
          
          {/* WhatsApp Card */}
          <button
            onClick={handleWhatsApp}
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-500 to-green-600 p-8 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            <div className="relative z-10">
              <div className="flex justify-center mb-4">
                <div className="rounded-full bg-white/20 p-4 backdrop-blur-sm">
                  <MessageCircle className="h-10 w-10" />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-2">WhatsApp Us</h3>
              <p className="text-green-50 text-sm">Get instant support</p>
            </div>
            
            {/* Hover effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-green-600 to-green-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </button>

          {/* Email Card */}
          <button
            onClick={handleEmail}
            className="group relative overflow-hidden rounded-2xl bg-white border-2 border-slate-200 p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 hover:border-teal-300"
          >
            <div className="relative z-10">
              <div className="flex justify-center mb-4">
                <div className="rounded-full bg-slate-100 p-4 group-hover:bg-teal-50 transition-colors duration-300">
                  <Mail className="h-10 w-10 text-slate-700 group-hover:text-teal-600 transition-colors duration-300" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Email Us</h3>
              <p className="text-slate-600 text-sm">crew@admit55.com</p>
            </div>
          </button>
        </div>

        {/* Contact Form */}
        <div className="max-w-2xl mx-auto">
          <div className="rounded-3xl bg-white p-8 sm:p-10 shadow-xl border border-slate-200">
            <h3 className="text-2xl font-bold text-slate-900 mb-6">
              Or send us a message
            </h3>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Input */}
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-slate-700 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Your name"
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-3.5 text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all"
                />
              </div>

              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="your@email.com"
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-3.5 text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all"
                />
              </div>

              {/* Phone Input */}
              <div>
                <label htmlFor="phone" className="block text-sm font-semibold text-slate-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+91 98765 43210"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3.5 text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full rounded-xl py-4 text-base font-semibold text-white shadow-lg transition-all duration-200 ${
                  isSubmitting
                    ? 'bg-teal-400 cursor-not-allowed'
                    : 'bg-teal-600 hover:bg-teal-700 hover:shadow-xl'
                }`}
              >
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </button>

              {/* Status Messages */}
              {submitStatus === 'success' && (
                <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-center">
                  <p className="text-green-800 font-medium">
                    Message sent successfully! We'll get back to you soon.
                  </p>
                </div>
              )}

              {submitStatus === 'error' && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-center">
                  <p className="text-red-800 font-medium">
                    Something went wrong. Please try again or contact us directly.
                  </p>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}