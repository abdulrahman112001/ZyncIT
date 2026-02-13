"use client";

import Image from "next/image";
import {
  Shield,
  Heart,
  Zap,
  Users,
  Target,
  Eye,
  Sparkles,
  ArrowRight,
  Lightbulb,
  Lock,
  Smartphone,
  Globe,
} from "lucide-react";
import AnimatedSection from "@/components/AnimatedSection";
import Link from "next/link";

const values = [
  {
    icon: Shield,
    title: "Security First",
    description:
      "End-to-end encryption protects all your data. We never compromise on security.",
    color: "text-error",
    bg: "bg-error-light",
  },
  {
    icon: Heart,
    title: "User Privacy",
    description:
      "Your data belongs to you. We don't sell, share, or monetize your personal information.",
    color: "text-primary-dark",
    bg: "bg-primary-soft",
  },
  {
    icon: Zap,
    title: "Simplicity",
    description:
      "Powerful functionality wrapped in a clean, intuitive interface that anyone can use.",
    color: "text-warning",
    bg: "bg-warning-light",
  },
  {
    icon: Globe,
    title: "Accessibility",
    description:
      "Multi-language support with English and Arabic, including full RTL layout support.",
    color: "text-info",
    bg: "bg-info-light",
  },
];

const timeline = [
  {
    year: "The Problem",
    icon: Lightbulb,
    title: "Bridging the Gap",
    description:
      "We noticed how inconvenient it was to switch between phone and computer constantly — checking messages, missing calls, losing notifications. There had to be a better way.",
  },
  {
    year: "The Solution",
    icon: Sparkles,
    title: "iRopit is Born",
    description:
      "We built iRopit as a seamless bridge between your mobile device and desktop. One account, multiple devices, complete synchronization — all encrypted.",
  },
  {
    year: "The Vision",
    icon: Target,
    title: "Connecting Everything",
    description:
      "Our vision is a world where device boundaries disappear. Access your communications from anywhere, anytime, with complete security and privacy.",
  },
];

export default function AboutContent() {
  return (
    <div className="pt-20">
      {/* Hero */}
      <section className="relative py-20 lg:py-28 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/15 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center max-w-3xl mx-auto">
            <span className="inline-block text-sm font-semibold text-primary-dark bg-primary-soft px-4 py-1.5 rounded-full mb-6">
              About Us
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-txt mb-6">
              Smart Sync for Your{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-dark to-primary">
                Digital Life
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-txt-secondary leading-relaxed max-w-2xl mx-auto">
              iRopit is a cross-platform device synchronization platform that
              brings your phone&apos;s SMS, calls, notifications, and chat to
              your computer — securely and instantly.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 lg:py-28 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <AnimatedSection direction="left">
              <span className="inline-block text-sm font-semibold text-primary-dark bg-primary-soft px-4 py-1.5 rounded-full mb-4">
                Our Mission
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-txt mb-6">
                Breaking Device Barriers
              </h2>
              <p className="text-txt-secondary leading-relaxed mb-6">
                At iRopit, we believe you should never miss an important message
                or call just because you&apos;re away from your phone. Our
                mission is to create a seamless bridge between your mobile
                devices and desktop, making communication effortless and
                uninterrupted.
              </p>
              <p className="text-txt-secondary leading-relaxed mb-8">
                Built with{" "}
                <strong className="text-txt">security at its core</strong>,
                iRopit uses end-to-end encryption to ensure your private
                conversations stay private. Our platform works across Android
                phones and Chrome browsers, with plans to expand to more
                platforms.
              </p>
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 text-sm text-txt-secondary bg-bg px-4 py-2 rounded-full">
                  <Smartphone className="w-4 h-4 text-primary-dark" />
                  <span>Android App</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-txt-secondary bg-bg px-4 py-2 rounded-full">
                  <Globe className="w-4 h-4 text-primary-dark" />
                  <span>Chrome Extension</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-txt-secondary bg-bg px-4 py-2 rounded-full">
                  <Lock className="w-4 h-4 text-primary-dark" />
                  <span>E2E Encrypted</span>
                </div>
              </div>
            </AnimatedSection>

            <AnimatedSection direction="right">
              <div className="relative">
                <div className="bg-gradient-to-br from-primary-soft to-surface rounded-[var(--radius-xl)] p-8 border border-primary-light">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="text-center p-4 bg-surface rounded-[var(--radius-lg)] shadow-sm">
                      <div className="text-3xl font-bold text-primary-dark mb-1">
                        5+
                      </div>
                      <div className="text-sm text-txt-secondary">
                        Core Features
                      </div>
                    </div>
                    <div className="text-center p-4 bg-surface rounded-[var(--radius-lg)] shadow-sm">
                      <div className="text-3xl font-bold text-primary-dark mb-1">
                        2
                      </div>
                      <div className="text-sm text-txt-secondary">
                        Platforms
                      </div>
                    </div>
                    <div className="text-center p-4 bg-surface rounded-[var(--radius-lg)] shadow-sm">
                      <div className="text-3xl font-bold text-primary-dark mb-1">
                        256
                      </div>
                      <div className="text-sm text-txt-secondary">
                        Bit Encryption
                      </div>
                    </div>
                    <div className="text-center p-4 bg-surface rounded-[var(--radius-lg)] shadow-sm">
                      <div className="text-3xl font-bold text-primary-dark mb-1">
                        24/7
                      </div>
                      <div className="text-sm text-txt-secondary">
                        Real-time Sync
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Story Timeline */}
      <section className="py-20 lg:py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-16">
            <span className="inline-block text-sm font-semibold text-primary-dark bg-primary-soft px-4 py-1.5 rounded-full mb-4">
              Our Story
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-txt mb-4">
              How iRopit Came to Be
            </h2>
          </AnimatedSection>

          <div className="space-y-12">
            {timeline.map((item, i) => (
              <AnimatedSection
                key={item.year}
                delay={i * 0.15}
                direction={i % 2 === 0 ? "left" : "right"}
              >
                <div className="flex gap-6">
                  <div className="flex flex-col items-center">
                    <div className="w-14 h-14 bg-primary-soft border-2 border-primary-light rounded-2xl flex items-center justify-center shrink-0">
                      <item.icon className="w-7 h-7 text-primary-dark" />
                    </div>
                    {i < timeline.length - 1 && (
                      <div className="w-0.5 flex-1 bg-primary-light mt-4" />
                    )}
                  </div>
                  <div className="pb-8">
                    <span className="inline-block text-xs font-semibold text-primary-dark bg-primary-soft px-3 py-1 rounded-full mb-2">
                      {item.year}
                    </span>
                    <h3 className="text-xl font-semibold text-txt mb-2">
                      {item.title}
                    </h3>
                    <p className="text-txt-secondary leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 lg:py-28 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-16">
            <span className="inline-block text-sm font-semibold text-primary-dark bg-primary-soft px-4 py-1.5 rounded-full mb-4">
              Our Values
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-txt mb-4">
              What We Stand For
            </h2>
            <p className="text-lg text-txt-secondary max-w-2xl mx-auto">
              Every decision we make is guided by these core principles.
            </p>
          </AnimatedSection>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, i) => (
              <AnimatedSection key={value.title} delay={i * 0.1}>
                <div className="text-center p-6 lg:p-8 bg-bg rounded-[var(--radius-lg)] border border-border hover:border-primary-light transition-all hover:shadow-md hover:-translate-y-1">
                  <div
                    className={`w-14 h-14 ${value.bg} rounded-2xl flex items-center justify-center mx-auto mb-4`}
                  >
                    <value.icon className={`w-7 h-7 ${value.color}`} />
                  </div>
                  <h3 className="text-lg font-semibold text-txt mb-2">
                    {value.title}
                  </h3>
                  <p className="text-sm text-txt-secondary leading-relaxed">
                    {value.description}
                  </p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 lg:py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AnimatedSection>
            <h2 className="text-3xl sm:text-4xl font-bold text-txt mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-lg text-txt-secondary mb-8 max-w-xl mx-auto">
              Join us and experience the future of device synchronization.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/#download"
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-txt-inverse px-6 py-3 rounded-[var(--radius)] font-semibold transition-all hover:scale-105"
              >
                Download Now
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 bg-surface border border-border hover:border-primary text-txt px-6 py-3 rounded-[var(--radius)] font-semibold transition-colors"
              >
                Contact Us
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
}
