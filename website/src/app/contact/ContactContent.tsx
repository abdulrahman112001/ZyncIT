"use client";

import { useState, FormEvent } from "react";
import {
  Mail,
  Globe,
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  MessageSquare,
  MapPin,
} from "lucide-react";
import AnimatedSection from "@/components/AnimatedSection";

const contactInfo = [
  {
    icon: Mail,
    title: "Email",
    value: "iropitapp@gmail.com",
    href: "mailto:iropitapp@gmail.com",
    color: "text-info",
    bg: "bg-info-light",
  },
  {
    icon: Mail,
    title: "Privacy Inquiries",
    value: "privacy@iropit.com",
    href: "mailto:privacy@iropit.com",
    color: "text-warning",
    bg: "bg-warning-light",
  },
  {
    icon: Globe,
    title: "Website",
    value: "www.iropit.com",
    href: "https://www.iropit.com",
    color: "text-success",
    bg: "bg-success-light",
  },
];

export default function ContactContent() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send message");
      }

      setStatus("success");
      setFormData({ name: "", email: "", subject: "", message: "" });

      setTimeout(() => setStatus("idle"), 5000);
    } catch (err: unknown) {
      setStatus("error");
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    }
  };

  return (
    <div className="pt-20">
      {/* Hero */}
      <section className="relative py-16 lg:py-20 bg-surface overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/15 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AnimatedSection>
            <span className="inline-block text-sm font-semibold text-primary-dark bg-primary-soft px-4 py-1.5 rounded-full mb-6">
              Contact
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold text-txt mb-4">
              Get in Touch
            </h1>
            <p className="text-lg text-txt-secondary max-w-xl mx-auto">
              Have a question, suggestion, or need support? We&apos;d love to
              hear from you.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-5 gap-12 lg:gap-16">
            {/* Contact Info */}
            <div className="lg:col-span-2">
              <AnimatedSection direction="left">
                <h2 className="text-2xl font-bold text-txt mb-2">
                  Contact Information
                </h2>
                <p className="text-txt-secondary mb-8">
                  Reach out to us through any of these channels. We typically
                  respond within 24 hours.
                </p>

                <div className="space-y-4">
                  {contactInfo.map((item) => (
                    <a
                      key={item.title}
                      href={item.href}
                      className="flex items-center gap-4 p-4 bg-surface rounded-[var(--radius-lg)] border border-border hover:border-primary-light transition-all hover:shadow-sm group"
                    >
                      <div
                        className={`w-12 h-12 ${item.bg} rounded-[var(--radius)] flex items-center justify-center shrink-0`}
                      >
                        <item.icon className={`w-5 h-5 ${item.color}`} />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-txt group-hover:text-primary-dark transition-colors">
                          {item.title}
                        </div>
                        <div className="text-sm text-txt-secondary">
                          {item.value}
                        </div>
                      </div>
                    </a>
                  ))}
                </div>

                {/* FAQ hint */}
                <div className="mt-8 p-5 bg-primary-soft rounded-[var(--radius-lg)] border border-primary-light">
                  <div className="flex items-start gap-3">
                    <MessageSquare className="w-5 h-5 text-primary-dark mt-0.5" />
                    <div>
                      <h3 className="text-sm font-semibold text-txt mb-1">
                        Quick Support
                      </h3>
                      <p className="text-xs text-txt-secondary m-0 leading-relaxed">
                        For privacy-related inquiries, please email{" "}
                        <strong>privacy@iropit.com</strong>. For general
                        support, use the contact form or email us directly.
                      </p>
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-3">
              <AnimatedSection direction="right">
                <div className="bg-surface rounded-[var(--radius-xl)] border border-border p-6 sm:p-8 lg:p-10">
                  <h2 className="text-2xl font-bold text-txt mb-6">
                    Send Us a Message
                  </h2>

                  {status === "success" && (
                    <div className="mb-6 flex items-center gap-3 bg-success-light border border-success/20 text-success rounded-[var(--radius)] px-4 py-3">
                      <CheckCircle2 className="w-5 h-5 shrink-0" />
                      <p className="text-sm m-0">
                        Your message has been sent successfully! We&apos;ll get
                        back to you soon.
                      </p>
                    </div>
                  )}

                  {status === "error" && (
                    <div className="mb-6 flex items-center gap-3 bg-error-light border border-error/20 text-error rounded-[var(--radius)] px-4 py-3">
                      <AlertCircle className="w-5 h-5 shrink-0" />
                      <p className="text-sm m-0">{errorMsg}</p>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid sm:grid-cols-2 gap-5">
                      <div>
                        <label
                          htmlFor="name"
                          className="block text-sm font-medium text-txt mb-1.5"
                        >
                          Full Name <span className="text-error">*</span>
                        </label>
                        <input
                          id="name"
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          className="w-full px-4 py-3 rounded-[var(--radius)] border border-border bg-bg dark:bg-surface-tertiary text-txt placeholder:text-txt-tertiary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                          placeholder="Your name"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="email"
                          className="block text-sm font-medium text-txt mb-1.5"
                        >
                          Email Address <span className="text-error">*</span>
                        </label>
                        <input
                          id="email"
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                          className="w-full px-4 py-3 rounded-[var(--radius)] border border-border bg-bg dark:bg-surface-tertiary text-txt placeholder:text-txt-tertiary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                          placeholder="your@email.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="subject"
                        className="block text-sm font-medium text-txt mb-1.5"
                      >
                        Subject <span className="text-error">*</span>
                      </label>
                      <input
                        id="subject"
                        type="text"
                        required
                        value={formData.subject}
                        onChange={(e) =>
                          setFormData({ ...formData, subject: e.target.value })
                        }
                        className="w-full px-4 py-3 rounded-[var(--radius)] border border-border bg-bg dark:bg-surface-tertiary text-txt placeholder:text-txt-tertiary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                        placeholder="How can we help?"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="message"
                        className="block text-sm font-medium text-txt mb-1.5"
                      >
                        Message <span className="text-error">*</span>
                      </label>
                      <textarea
                        id="message"
                        required
                        rows={5}
                        value={formData.message}
                        onChange={(e) =>
                          setFormData({ ...formData, message: e.target.value })
                        }
                        className="w-full px-4 py-3 rounded-[var(--radius)] border border-border bg-bg dark:bg-surface-tertiary text-txt placeholder:text-txt-tertiary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors resize-none"
                        placeholder="Tell us more about your inquiry..."
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={status === "loading"}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-txt-inverse px-8 py-3 rounded-[var(--radius)] font-semibold transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer"
                    >
                      {status === "loading" ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Send Message
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </AnimatedSection>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
