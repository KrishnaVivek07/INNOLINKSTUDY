import React from 'react';
import { Cpu, ShieldCheck, Mail, MapPin, Phone } from 'lucide-react';
import { useBranding } from '../context/BrandingContext';

interface FooterProps {
  onNavigate?: (tab: string, param?: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const { branding } = useBranding();

  return (
    <footer className="relative mt-auto border-t border-[var(--footer-border)] bg-[var(--footer-background)] text-[var(--footer-text)] transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5">
              {branding.logoUrl ? (
                <img
                  src={branding.logoUrl}
                  alt={branding.platformName}
                  className="h-8 w-auto max-w-[140px] object-contain"
                />
              ) : (
                <div
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-white shadow-xs"
                  style={{ backgroundColor: branding.primaryAccent || '#10B981' }}
                >
                  <Cpu className="w-4 h-4 text-white" />
                </div>
              )}
              <div>
                <span className="text-base font-bold tracking-tight text-[var(--footer-heading)]">
                  {branding.platformName}
                </span>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-[var(--footer-text)] max-w-md leading-relaxed">
              {branding.brandDescription}
            </p>
            <div className="flex items-center gap-2 pt-1 text-xs" style={{ color: branding.primaryAccent || '#10B981' }}>
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span className="font-medium">Certified Electronics Mentorship & Hardware Verification</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--footer-heading)] mb-3">
              Curriculum & Labs
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-[var(--footer-link)]">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate?.('courses')}
                  className="hover:text-[var(--footer-heading)] hover:underline transition cursor-pointer text-left"
                >
                  Electronics Fundamentals
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate?.('coding_lab')}
                  className="hover:text-[var(--footer-heading)] hover:underline transition cursor-pointer text-left"
                >
                  ESP32 & Arduino Lab
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate?.('coding_lab')}
                  className="hover:text-[var(--footer-heading)] hover:underline transition cursor-pointer text-left"
                >
                  Raspberry Pi Pico Workspace
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate?.('marketplace')}
                  className="hover:text-[var(--footer-heading)] hover:underline transition cursor-pointer text-left"
                >
                  STEM Kit Marketplace
                </button>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--footer-heading)] mb-3">
              Contact & Support
            </h4>
            <div className="space-y-2 text-xs text-[var(--footer-text)]">
              <div className="flex items-start gap-2">
                <Mail className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: branding.primaryAccent || '#10B981' }} />
                <a
                  href={`mailto:${branding.contactEmail}`}
                  className="hover:text-[var(--footer-heading)] transition text-[var(--footer-link)]"
                >
                  {branding.contactEmail}
                </a>
              </div>
              <div className="flex items-start gap-2">
                <Phone className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: branding.primaryAccent || '#10B981' }} />
                <a
                  href={`tel:${branding.contactPhone.replace(/\s+/g, '')}`}
                  className="hover:text-[var(--footer-heading)] transition text-[var(--footer-link)]"
                >
                  {branding.contactPhone}
                </a>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: branding.primaryAccent || '#10B981' }} />
                <span className="text-[var(--footer-text)] leading-snug">
                  {branding.address}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Mandatory Footer Text as per User Requirement */}
        <div className="pt-6 border-t border-[var(--footer-border)] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--footer-text)]">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-center sm:text-left">
            <span className="font-semibold text-[var(--footer-heading)]">
              Powered by {branding.poweredBy || 'MK Solutions'}
            </span>
            <span className="hidden sm:inline opacity-40">•</span>
            <span className="font-medium text-[var(--footer-heading)]">
              {branding.footerCompanyName || branding.platformName}
            </span>
          </div>

          <div className="text-center sm:text-right text-[var(--footer-text)]">
            {branding.footerCopyright || `Copyright © ${branding.platformName}. All Rights Reserved.`}
          </div>
        </div>
      </div>
    </footer>
  );
};
