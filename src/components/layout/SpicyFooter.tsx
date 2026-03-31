"use client";
import React from "react";
import {
  Mail,
  Share2,
  Video,
  Radio,
  Play,
  Trophy,
  Zap,
} from "lucide-react";
import { FooterBackgroundGradient, TextHoverEffect } from "@/components/ui/hover-footer";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";

function SpicyFooter() {
  const tf = useTranslations("Footer");
  
  const footerLinks: { title: string, links: { label: string, href: string, pulse?: boolean }[] }[] = [
    {
      title: tf("platform"),
      links: [
        { label: tf("tournaments"), href: "/tournaments" },
        { label: tf("hall_of_fame"), href: "/winners" },
        { label: tf("home"), href: "/" },
      ],
    },
    {
      title: tf("community"),
      links: [
        { label: "Discord", href: "#" },
        { label: "Reddit", href: "#" },
        { label: tf("live_chat"), href: "#", pulse: true },
      ],
    },
  ];

  const contactInfo = [
    {
      icon: <Mail size={16} className="text-[#ffaa00]" />,
      text: "contact@spicycommunity.gg",
      href: "mailto:contact@spicycommunity.gg",
    },
  ];

  const socialLinks = [
    { icon: <Share2 size={18} />, label: "Twitter / X", href: "#" },
    { icon: <Radio size={18} />, label: "Discord", href: "#" },
    { icon: <Video size={18} />, label: "YouTube", href: "#" },
    { icon: <Play size={18} />, label: "Twitch", href: "#" },
  ];

  return (
    <footer className="bg-black/80 text-white/60 relative rounded-t-3xl overflow-hidden mt-16 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-8 md:px-14 pt-14 pb-6 z-40 relative">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 md:gap-8 lg:gap-16 pb-12">

          {/* Brand */}
          <div className="flex flex-col space-y-4">
            <div className="flex items-center gap-2">
              <Zap size={22} className="text-[#ffaa00]" fill="#ffaa00" />
              <span className="text-white text-xl font-black uppercase tracking-tight">
                Spicy <span className="text-[#ffaa00]">Community</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed text-white/40">
              {tf("engine_desc")}
            </p>
            {/* Social icons */}
            <div className="flex gap-4 text-white/30 pt-2">
              {socialLinks.map(({ icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="hover:text-[#ffaa00] transition-colors"
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* Link sections */}
          {footerLinks.map((section) => (
            <div key={section.title}>
              <h4 className="text-white text-sm font-black uppercase tracking-widest mb-6">
                {section.title}
              </h4>
              <ul className="space-y-3 text-sm">
                {section.links.map((link) => (
                  <li key={link.label} className="relative w-fit">
                    <Link
                      href={link.href as any}
                      className="hover:text-[#ffaa00] transition-colors"
                    >
                      {link.label}
                    </Link>
                    {link.pulse && (
                      <span className="absolute top-0.5 -right-3 w-1.5 h-1.5 rounded-full bg-[#ffaa00] animate-pulse" />
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact */}
          <div>
            <h4 className="text-white text-sm font-black uppercase tracking-widest mb-6">
              {tf("contact")}
            </h4>
            <ul className="space-y-4 text-sm">
              {contactInfo.map((item, i) => (
                <li key={i} className="flex items-center gap-3">
                  {item.icon}
                  {item.href ? (
                    <a href={item.href} className="hover:text-[#ffaa00] transition-colors">
                      {item.text}
                    </a>
                  ) : (
                    <span>{item.text}</span>
                  )}
                </li>
              ))}
              <li className="flex items-center gap-3">
                <Trophy size={16} className="text-[#ffaa00]" />
                <span className="text-white/40 text-xs uppercase font-black tracking-widest">
                  UNO Tournament Engine
                </span>
              </li>
            </ul>
          </div>
        </div>

        <hr className="border-t border-white/5 my-6" />

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row justify-between items-center text-xs text-white/20 gap-4">
          <p>
            &copy; {new Date().getFullYear()} Spicy Community. {tf("all_rights_reserved")}
          </p>
          <p className="uppercase font-black tracking-widest text-[8px]">
            {tf.rich("built_for", {
              icon: () => <span className="inline-block align-middle pb-0.5">⚡</span>
            })}
          </p>
        </div>
      </div>

      {/* Big hover text */}
      <div className="lg:flex hidden h-[28rem] -mt-48 -mb-32 pointer-events-none select-none">
        <TextHoverEffect text="SPICY" className="z-50 pointer-events-auto" />
      </div>

      <FooterBackgroundGradient />
    </footer>
  );
}

export default SpicyFooter;
