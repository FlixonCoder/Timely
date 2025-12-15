// src/components/Footer.jsx
import React, { useState } from "react";
import { Github, Linkedin, Instagram, Twitter, Mail, Send } from "lucide-react";

const Footer = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    message: "",
  });

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();

    // TODO: replace with your real email
    const to = "saqibjunaid3@gmail.com";

    const subject = "New message from Time Manager";
    const body = `Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`;

    window.location.href = `mailto:${encodeURIComponent(
      to
    )}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-6 py-10 grid gap-10 md:grid-cols-[minmax(0,2fr)_minmax(0,1.6fr)]">
        {/* Left: about + socials */}
        <div>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            Time Manager
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-md">
            Plan your days, stay ahead of deadlines, and keep your projects
            under control with a simple schedule‑first task manager.
          </p>

          <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
            Built by{" "}
            <span className="font-semibold">
              Mohammed Saqib Junaid Khan
            </span>
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            {/* LinkedIn */}
            <a
              href="https://www.linkedin.com/in/your-profile"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-200 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 dark:hover:border-indigo-500 transition-colors text-xs font-medium"
            >
              <Linkedin size={16} />
              <span>LinkedIn</span>
            </a>

            {/* GitHub */}
            <a
              href="https://github.com/your-username"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-200 hover:bg-slate-900 hover:text-white hover:border-slate-900 dark:hover:border-slate-500 transition-colors text-xs font-medium"
            >
              <Github size={16} />
              <span>GitHub</span>
            </a>

            {/* Instagram */}
            <a
              href="https://www.instagram.com/your-handle"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-200 hover:bg-pink-600 hover:text-white hover:border-pink-600 dark:hover:border-pink-500 transition-colors text-xs font-medium"
            >
              <Instagram size={16} />
              <span>Instagram</span>
            </a>

            {/* X (Twitter) */}
            <a
              href="https://x.com/your-handle"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-200 hover:bg-slate-900 hover:text-white hover:border-slate-900 dark:hover:border-slate-500 transition-colors text-xs font-medium"
            >
              <Twitter size={16} />
              <span>X</span>
            </a>
          </div>
        </div>

        {/* Right: mini contact form */}
        <div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Mail size={16} />
            Contact
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Have feedback, ideas, or collaboration in mind? Drop a quick message
            and I’ll get back to you.
          </p>

          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Your name"
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">
                Message
              </label>
              <textarea
                name="message"
                required
                rows={3}
                value={form.message}
                onChange={handleChange}
                placeholder="How can I help?"
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 resize-none"
              />
            </div>

            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium shadow-sm shadow-indigo-200/70 dark:shadow-indigo-950/40 transition-all active:scale-95"
            >
              <Send size={16} />
              <span>Send message</span>
            </button>

            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              This opens your default email app with a pre‑filled message. Update
              the email address in the footer code to your own.
            </p>
          </form>
        </div>
      </div>

      <div className="border-t border-slate-100 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400 dark:text-slate-500">
          <span>
            © {new Date().getFullYear()} Time Manager. All rights reserved.
          </span>
          <span>Built with React & Tailwind CSS.</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;