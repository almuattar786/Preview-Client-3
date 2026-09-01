import React, { useState } from 'react';
import { Mail, Phone, MapPin, Clock, Send, CheckCircle2, HelpCircle } from 'lucide-react';
import { SEO } from '../components/SEO';
import { apiFetch } from '../lib/api';
import { useCart } from '../context/CartContext';

interface ContactPageProps {
  onShowToast: (msg: string, type?: 'success' | 'error') => void;
}

export const ContactPage: React.FC<ContactPageProps> = ({ onShowToast }) => {
  const { storeSettings } = useCart();
  const storeName = storeSettings?.storeName || "Al-Mu'attar";
  const supportEmail = storeSettings?.supportEmail || storeSettings?.contactEmail || 'info@almuattar.com';
  const contactPhone = storeSettings?.contactPhone || '+92 300 1234567';
  const storeAddress = storeSettings?.storeAddress || '104 Mall Road, Gulberg III, Lahore, Pakistan';

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('General Inquiry');
  const [message, setMessage] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !message.trim()) {
      onShowToast('Please fill in your name, email, and inquiry message.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch('/api/contact', {
        method: 'POST',
        body: JSON.stringify({ fullName, email, phone, subject, message })
      });

      if (res.success) {
        onShowToast('Thank you! Your message has been received by our concierge.', 'success');
        setSubmittedSuccess(true);
        setFullName('');
        setEmail('');
        setPhone('');
        setMessage('');
      } else {
        onShowToast(res.message || 'Failed to send message.', 'error');
      }
    } catch (err: any) {
      onShowToast(err.message || 'Error submitting message.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const faqs = [
    {
      q: 'How long does Cash on Delivery (COD) shipping take?',
      a: 'Orders are processed within 24 hours. Delivery takes 2 to 3 working days in Lahore, Islamabad, and Karachi, and 3 to 4 days across rest of Pakistan.'
    },
    {
      q: 'Are all your Oud and Attar oils pure?',
      a: `Yes! ${storeName} offers 100% pure Cambodian and Assam Oud oils as well as alcohol-free concentrated attars.`
    },
    {
      q: 'Can I inspect my package before paying COD?',
      a: 'Yes, our courier partners allow physical verification of the sealed outer parcel upon payment.'
    }
  ];

  return (
    <div className="bg-[#f8f6f0] dark:bg-[#0a0a0a] text-stone-900 dark:text-[#f5f5f1] min-h-screen py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-16 transition-colors">
      <SEO
        title={`Contact Concierge & Showrooms | ${storeName}`}
        description={`Contact ${storeName} Haute Parfumerie. Inquire about custom orders, bespoke scents, bridal fragrance sets, or visit our Lahore showroom.`}
        canonicalPath="/contact"
        ogType="website"
      />
      {/* Page Title */}
      <div className="text-center space-y-3 max-w-xl mx-auto">
        <span className="text-xs font-mono text-[#9a7229] dark:text-[#c5a059] font-semibold uppercase tracking-[0.25em]">Concierge Service</span>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-stone-900 dark:text-[#f5f5f1]">Contact {storeName}</h1>
        <p className="text-xs text-stone-600 dark:text-zinc-400 font-light">
          Have questions about a fragrance note, custom gift box, or tracking an existing order? We are at your service.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Contact Information Panel */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#1a1a1a] border border-stone-200 dark:border-[#c5a059]/20 rounded-2xl p-6 space-y-6 shadow-md dark:shadow-lg">
            <h2 className="text-lg font-serif font-semibold text-stone-900 dark:text-[#f5f5f1] border-b border-stone-200 dark:border-[#c5a059]/20 pb-3">
              Maison Headquarters
            </h2>

            <div className="space-y-4 text-xs font-light text-stone-700 dark:text-zinc-300">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-[#9a7229] dark:text-[#c5a059] shrink-0 mt-1" />
                <div>
                  <strong className="text-stone-900 dark:text-[#f5f5f1] font-medium block">Showroom & Studio</strong>
                  <span>{storeAddress}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-[#9a7229] dark:text-[#c5a059] shrink-0" />
                <div>
                  <strong className="text-stone-900 dark:text-[#f5f5f1] font-medium block">Phone / WhatsApp</strong>
                  <span className="font-mono">{contactPhone}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-[#9a7229] dark:text-[#c5a059] shrink-0" />
                <div>
                  <strong className="text-stone-900 dark:text-[#f5f5f1] font-medium block">Customer Service Email</strong>
                  <span>{supportEmail}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-[#9a7229] dark:text-[#c5a059] shrink-0" />
                <div>
                  <strong className="text-stone-900 dark:text-[#f5f5f1] font-medium block">Operational Hours</strong>
                  <span>Mon - Sat: 11:00 AM - 9:00 PM PKT</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-[#1a1a1a] border border-stone-200 dark:border-[#c5a059]/20 rounded-2xl p-6 sm:p-8 space-y-6 shadow-md dark:shadow-lg">
            <h2 className="text-xl font-serif font-semibold text-stone-900 dark:text-[#f5f5f1] border-b border-stone-200 dark:border-[#c5a059]/20 pb-3">
              Send a Concierge Message
            </h2>

            {submittedSuccess ? (
              <div className="bg-[#9a7229]/10 dark:bg-[#c5a059]/10 border border-[#9a7229]/30 dark:border-[#c5a059]/30 p-6 rounded-2xl text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-[#9a7229] dark:text-[#c5a059] mx-auto" />
                <h3 className="text-lg font-serif font-semibold text-[#9a7229] dark:text-[#c5a059]">Message Received!</h3>
                <p className="text-xs text-stone-700 dark:text-zinc-300">
                  Thank you for writing to us. One of our perfume consultants will respond via email/WhatsApp within 24 hours.
                </p>
                <button
                  onClick={() => setSubmittedSuccess(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-[#0a0a0a] text-xs text-[#9a7229] dark:text-[#c5a059] border border-[#9a7229]/30 dark:border-[#c5a059]/30 hover:bg-[#9a7229]/10 dark:hover:bg-[#c5a059]/10"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 uppercase tracking-wider">
                      Your Name <span className="text-[#9a7229] dark:text-[#c5a059]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Zainab Ahmed"
                      className="w-full bg-stone-50 dark:bg-[#0a0a0a] border border-stone-300 dark:border-[#c5a059]/30 rounded-xl p-3 text-xs text-stone-900 dark:text-[#f5f5f1] placeholder-stone-400 dark:placeholder-zinc-600 focus:outline-none focus:border-[#9a7229] dark:focus:border-[#c5a059]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 uppercase tracking-wider">
                      Email Address <span className="text-[#9a7229] dark:text-[#c5a059]">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. zainab@example.com"
                      className="w-full bg-stone-50 dark:bg-[#0a0a0a] border border-stone-300 dark:border-[#c5a059]/30 rounded-xl p-3 text-xs text-stone-900 dark:text-[#f5f5f1] placeholder-stone-400 dark:placeholder-zinc-600 focus:outline-none focus:border-[#9a7229] dark:focus:border-[#c5a059]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 uppercase tracking-wider">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 0321 9876543"
                      className="w-full bg-stone-50 dark:bg-[#0a0a0a] border border-stone-300 dark:border-[#c5a059]/30 rounded-xl p-3 text-xs text-stone-900 dark:text-[#f5f5f1] placeholder-stone-400 dark:placeholder-zinc-600 focus:outline-none focus:border-[#9a7229] dark:focus:border-[#c5a059] font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 uppercase tracking-wider">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="e.g. Custom Wedding Favors"
                      className="w-full bg-stone-50 dark:bg-[#0a0a0a] border border-stone-300 dark:border-[#c5a059]/30 rounded-xl p-3 text-xs text-stone-900 dark:text-[#f5f5f1] placeholder-stone-400 dark:placeholder-zinc-600 focus:outline-none focus:border-[#9a7229] dark:focus:border-[#c5a059]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 uppercase tracking-wider">
                    Message <span className="text-[#9a7229] dark:text-[#c5a059]">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="How can we assist you with your fragrance selection?"
                    className="w-full bg-stone-50 dark:bg-[#0a0a0a] border border-stone-300 dark:border-[#c5a059]/30 rounded-xl p-3 text-xs text-stone-900 dark:text-[#f5f5f1] placeholder-stone-400 dark:placeholder-zinc-600 focus:outline-none focus:border-[#9a7229] dark:focus:border-[#c5a059]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 rounded-xl bg-[#9a7229] dark:bg-[#c5a059] text-white dark:text-[#0a0a0a] font-bold text-xs uppercase tracking-wider hover:bg-[#7a581d] dark:hover:bg-[#d4af37] transition-colors shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{submitting ? 'Sending Message...' : 'Submit Message'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Frequently Asked Questions */}
      <div className="space-y-6 pt-6 border-t border-[#9a7229]/20 dark:border-[#c5a059]/20">
        <h2 className="text-2xl font-serif font-semibold text-stone-900 dark:text-[#f5f5f1] flex items-center gap-2">
          <HelpCircle className="w-6 h-6 text-[#9a7229] dark:text-[#c5a059]" />
          <span>Frequently Asked Questions</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {faqs.map((f, i) => (
            <div key={i} className="p-5 rounded-2xl bg-white dark:bg-[#1a1a1a] border border-stone-200 dark:border-[#c5a059]/20 space-y-2 shadow-sm dark:shadow-md">
              <h4 className="text-sm font-semibold text-[#9a7229] dark:text-[#c5a059]">{f.q}</h4>
              <p className="text-xs text-stone-600 dark:text-zinc-400 font-light leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
