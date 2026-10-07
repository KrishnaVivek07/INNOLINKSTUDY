import React, { createContext, useContext, useState, useEffect } from 'react';

export interface BrandingConfig {
  platformName: string;
  shortName: string;
  logoUrl: string;
  faviconUrl: string;
  brandDescription: string;
  primaryAccent: string; // Hex color code e.g. #10b981
  secondaryAccent: string;
  footerCompanyName: string;
  footerCopyright: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  poweredBy: string;
}

export const DEFAULT_BRANDING: BrandingConfig = {
  platformName: 'InnoLink Technologies',
  shortName: 'InnoLink',
  logoUrl: '',
  faviconUrl: '',
  brandDescription:
    'Premier electronics and technology learning management system, Coding & Hardware Laboratory, and STEM Marketplace. Learn, build, test, and innovate.',
  primaryAccent: '#10B981', // Emerald
  secondaryAccent: '#0F172A',
  footerCompanyName: 'InnoLink Technologies',
  footerCopyright: 'Copyright © InnoLink Technologies. All Rights Reserved.',
  contactEmail: 'contact@innolink.tech',
  contactPhone: '+91 99665 95709',
  address: 'V Savaram, 2-75, Ramalayam Street, Backside Shivalayam',
  poweredBy: 'MK Solutions',
};

interface BrandingContextType {
  branding: BrandingConfig;
  updateBranding: (newConfig: Partial<BrandingConfig>) => void;
  resetBranding: () => void;
}

const BrandingContext = createContext<BrandingContextType | null>(null);

const STORAGE_KEY = 'innolink_platform_branding_v1';

export const BrandingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [branding, setBranding] = useState<BrandingConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_BRANDING, ...parsed };
      }
    } catch {
      // Fallback
    }
    return DEFAULT_BRANDING;
  });

  const updateBranding = (newConfig: Partial<BrandingConfig>) => {
    setBranding((prev) => {
      const updated = { ...prev, ...newConfig };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // storage quota fallback
      }
      return updated;
    });
  };

  const resetBranding = () => {
    setBranding(DEFAULT_BRANDING);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // fallback
    }
  };

  // Sync document title and favicon
  useEffect(() => {
    if (branding.platformName) {
      document.title = `${branding.platformName} — Electronics Curriculum, Labs & STEM Kits`;
    }
    if (branding.faviconUrl) {
      let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = branding.faviconUrl;
    }
  }, [branding.platformName, branding.faviconUrl]);

  return (
    <BrandingContext.Provider value={{ branding, updateBranding, resetBranding }}>
      {children}
    </BrandingContext.Provider>
  );
};

export const useBranding = () => {
  const context = useContext(BrandingContext);
  if (!context) {
    throw new Error('useBranding must be used within a BrandingProvider');
  }
  return context;
};
