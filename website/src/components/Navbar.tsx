"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/services", label: "Services" },
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/contact", label: "Contact" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-surface/90 backdrop-blur-md shadow-sm border-b border-border"
          : "bg-transparent dark:bg-bg/50 dark:backdrop-blur-sm"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-[var(--radius-sm)] bg-primary flex items-center justify-center overflow-hidden">
              <Image
                src="/logo.png"
                alt="iRopit"
                width={28}
                height={28}
                className="object-contain"
              />
            </div>
            <span className="text-xl font-bold text-txt group-hover:text-primary transition-colors">
              iRopit
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-[var(--radius-sm)] text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? "text-primary bg-primary-soft"
                    : "text-txt-secondary hover:text-txt hover:bg-surface-secondary"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="#download"
              className="bg-primary hover:bg-primary-dark text-txt-inverse px-5 py-2.5 rounded-[var(--radius)] text-sm font-semibold transition-all hover:scale-105"
            >
              Download App
            </Link>
          </div>

          {/* Mobile Toggle */}
          <div className="flex items-center gap-2 lg:hidden">
            <ThemeToggle />
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="w-9 h-9 flex items-center justify-center rounded-[var(--radius-sm)] hover:bg-surface-secondary transition-colors"
              aria-label="Toggle menu"
            >
              {isOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`lg:hidden overflow-hidden transition-all duration-300 ${
          isOpen ? "max-h-96 border-b border-border" : "max-h-0"
        }`}
      >
        <div className="bg-surface/95 backdrop-blur-md px-4 py-4 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`block px-4 py-3 rounded-[var(--radius-sm)] text-sm font-medium transition-colors ${
                pathname === link.href
                  ? "text-primary bg-primary-soft"
                  : "text-txt-secondary hover:text-txt hover:bg-surface-secondary"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="#download"
            className="block text-center bg-primary hover:bg-primary-dark text-txt-inverse px-5 py-3 rounded-[var(--radius)] text-sm font-semibold transition-colors mt-3"
          >
            Download App
          </Link>
        </div>
      </div>
    </nav>
  );
}
