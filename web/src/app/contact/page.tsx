"use client";

import Link from "next/link";
import { useState } from "react";

import Navbar from "@/components/Navbar";

const CUSTOMER_CARE = {
  tollfree: "1800-123-4567",
  mobile1: "+91 98765-43210",
  mobile2: "+91 91234-56789",
  email: "support@realestateservice.com",
  enquiry: "enquiry@realestateservice.com",
  hours: "Mon – Sat, 9 AM – 7 PM IST",
};

const SUBJECTS = [
  "General Enquiry",
  "Property Listing Help",
  "Buying / Renting a Property",
  "Account & Subscription",
  "Billing & Payments",
  "Technical Support",
  "Partnership / Business",
  "Other",
];

type FormState = {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
};

export default function ContactPage() {
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim() || !form.email.trim() || !form.subject || !form.message.trim()) {
      setError("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to send enquiry. Please try again.");
        return;
      }

      setSuccess(true);
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(56,189,248,0.22),_transparent_40%),radial-gradient(circle_at_bottom_left,_rgba(99,102,241,0.20),_transparent_35%)]" />

      <main className="relative mx-auto max-w-6xl px-6 py-10 md:px-10">
        <Navbar />

        {/* Page header */}
        <div className="mt-10 text-center">
          <p className="mb-3 inline-flex rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs font-medium text-cyan-200">
            We&apos;re here to help
          </p>
          <h1 className="text-4xl font-bold">
            Contact{" "}
            <span className="bg-gradient-to-r from-cyan-300 to-indigo-300 bg-clip-text text-transparent">Us</span>
          </h1>
          <p className="mt-3 text-slate-400">
            Reach out with any question, feedback, or partnership enquiry and we&apos;ll get back to you soon.
          </p>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_380px]">
          {/* ── Contact form ── */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 backdrop-blur md:p-8">
            <h2 className="mb-6 text-xl font-semibold">Send us a message</h2>

            {success ? (
              <div className="flex flex-col items-center gap-4 py-10 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-4xl">
                  ✓
                </div>
                <h3 className="text-xl font-semibold text-emerald-400">Enquiry Sent!</h3>
                <p className="max-w-sm text-slate-400">
                  Thank you for reaching out. Our team will review your message and respond within 1 business day.
                </p>
                <button
                  onClick={() => setSuccess(false)}
                  className="mt-2 rounded-lg bg-cyan-500/20 px-5 py-2 text-sm font-medium text-cyan-300 transition hover:bg-cyan-500/30"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                {error && (
                  <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                    {error}
                  </div>
                )}

                <div className="grid gap-5 sm:grid-cols-2">
                  {/* Name */}
                  <div>
                    <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-slate-300">
                      Full Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      autoComplete="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="John Doe"
                      className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 transition focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-300">
                      Email Address <span className="text-rose-400">*</span>
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="john@example.com"
                      className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 transition focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  {/* Phone */}
                  <div>
                    <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-slate-300">
                      Phone / Mobile{" "}
                      <span className="text-xs text-slate-500">(optional)</span>
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="+91 98765-XXXXX"
                      className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 transition focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>

                  {/* Subject */}
                  <div>
                    <label htmlFor="subject" className="mb-1.5 block text-sm font-medium text-slate-300">
                      Subject <span className="text-rose-400">*</span>
                    </label>
                    <select
                      id="subject"
                      name="subject"
                      required
                      value={form.subject}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-slate-100 transition focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    >
                      <option value="">Select a subject…</option>
                      {SUBJECTS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label htmlFor="message" className="mb-1.5 block text-sm font-medium text-slate-300">
                    Message <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={5}
                    value={form.message}
                    onChange={handleChange}
                    placeholder="Describe your enquiry in detail…"
                    className="w-full resize-none rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 transition focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="animated-btn w-full rounded-xl bg-cyan-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "Sending…" : "Send Enquiry"}
                </button>
              </form>
            )}
          </div>

          {/* ── Contact info card ── */}
          <div className="space-y-6">
            {/* Customer Care Numbers */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 backdrop-blur">
              <h2 className="mb-5 flex items-center gap-2 text-lg font-semibold">
                <span className="text-cyan-400">📞</span> Customer Care
              </h2>
              <ul className="space-y-4 text-sm">
                <li className="flex flex-col gap-0.5">
                  <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Toll-Free</span>
                  <a
                    href={`tel:${CUSTOMER_CARE.tollfree.replace(/[^+\d]/g, "")}`}
                    className="font-semibold text-cyan-300 transition hover:text-cyan-200"
                  >
                    {CUSTOMER_CARE.tollfree}
                  </a>
                  <span className="text-xs text-slate-500">{CUSTOMER_CARE.hours}</span>
                </li>
                <li className="flex flex-col gap-0.5">
                  <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Mobile (Primary)</span>
                  <a
                    href={`tel:${CUSTOMER_CARE.mobile1.replace(/\s/g, "")}`}
                    className="font-semibold text-slate-200 transition hover:text-white"
                  >
                    {CUSTOMER_CARE.mobile1}
                  </a>
                </li>
                <li className="flex flex-col gap-0.5">
                  <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Mobile (Alternate)</span>
                  <a
                    href={`tel:${CUSTOMER_CARE.mobile2.replace(/\s/g, "")}`}
                    className="font-semibold text-slate-200 transition hover:text-white"
                  >
                    {CUSTOMER_CARE.mobile2}
                  </a>
                </li>
              </ul>
            </div>

            {/* Email */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 backdrop-blur">
              <h2 className="mb-5 flex items-center gap-2 text-lg font-semibold">
                <span className="text-indigo-400">✉️</span> Email Us
              </h2>
              <ul className="space-y-4 text-sm">
                <li className="flex flex-col gap-0.5">
                  <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Support</span>
                  <a
                    href={`mailto:${CUSTOMER_CARE.email}`}
                    className="font-semibold text-indigo-300 transition hover:text-indigo-200"
                  >
                    {CUSTOMER_CARE.email}
                  </a>
                </li>
                <li className="flex flex-col gap-0.5">
                  <span className="text-xs font-medium uppercase tracking-wider text-slate-500">General Enquiry</span>
                  <a
                    href={`mailto:${CUSTOMER_CARE.enquiry}`}
                    className="font-semibold text-indigo-300 transition hover:text-indigo-200"
                  >
                    {CUSTOMER_CARE.enquiry}
                  </a>
                </li>
              </ul>
            </div>

            {/* Quick links */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 backdrop-blur">
              <h2 className="mb-4 text-lg font-semibold">Quick Links</h2>
              <div className="space-y-2 text-sm">
                <Link
                  href="/properties"
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-slate-300 transition hover:bg-slate-800 hover:text-white"
                >
                  🏠 <span>Browse All Properties</span>
                </Link>
                <Link
                  href="/properties?featured=true"
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-slate-300 transition hover:bg-slate-800 hover:text-white"
                >
                  ⭐ <span>Featured Listings</span>
                </Link>
                <Link
                  href="/signup"
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-slate-300 transition hover:bg-slate-800 hover:text-white"
                >
                  👤 <span>Create an Account</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
