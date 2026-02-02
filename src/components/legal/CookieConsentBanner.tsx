import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings, Cookie } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface CookiePreferences {
  essential: boolean; // Always true
  analytics: boolean;
  marketing: boolean;
  timestamp: number;
}

const COOKIE_CONSENT_KEY = 'thittam1hub-cookie-consent';
const CONSENT_EXPIRY_DAYS = 365;

function getStoredConsent(): CookiePreferences | null {
  try {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!stored) return null;
    
    const preferences = JSON.parse(stored) as CookiePreferences;
    
    // Check if consent has expired (1 year)
    const expiryMs = CONSENT_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
    if (Date.now() - preferences.timestamp > expiryMs) {
      localStorage.removeItem(COOKIE_CONSENT_KEY);
      return null;
    }
    
    return preferences;
  } catch {
    return null;
  }
}

function saveConsent(preferences: Omit<CookiePreferences, 'timestamp'>) {
  const fullPreferences: CookiePreferences = {
    ...preferences,
    essential: true, // Always true
    timestamp: Date.now(),
  };
  localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(fullPreferences));
}

interface CookieConsentBannerProps {
  /** Callback when preferences are saved */
  onConsentChange?: (preferences: CookiePreferences) => void;
}

export function CookieConsentBanner({ onConsentChange }: CookieConsentBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState({
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    const stored = getStoredConsent();
    if (!stored) {
      // Show banner after a short delay for better UX
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
    
    // Apply stored preferences
    onConsentChange?.(stored);
    return undefined;
  }, [onConsentChange]);

  const handleAcceptAll = useCallback(() => {
    const fullPreferences = {
      essential: true,
      analytics: true,
      marketing: true,
    };
    saveConsent(fullPreferences);
    setIsVisible(false);
    onConsentChange?.({ ...fullPreferences, timestamp: Date.now() });
  }, [onConsentChange]);

  const handleAcceptEssential = useCallback(() => {
    const essentialOnly = {
      essential: true,
      analytics: false,
      marketing: false,
    };
    saveConsent(essentialOnly);
    setIsVisible(false);
    onConsentChange?.({ ...essentialOnly, timestamp: Date.now() });
  }, [onConsentChange]);

  const handleSavePreferences = useCallback(() => {
    const fullPreferences = {
      essential: true,
      analytics: preferences.analytics,
      marketing: preferences.marketing,
    };
    saveConsent(fullPreferences);
    setIsVisible(false);
    setShowSettings(false);
    onConsentChange?.({ ...fullPreferences, timestamp: Date.now() });
  }, [preferences, onConsentChange]);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-[100] p-4 md:p-6"
        role="dialog"
        aria-labelledby="cookie-banner-title"
        aria-describedby="cookie-banner-description"
      >
        <div className="container max-w-4xl">
          <div className="relative rounded-2xl border border-border/60 bg-card/95 backdrop-blur-xl shadow-2xl p-6">
            {/* Close button */}
            <button
              onClick={handleAcceptEssential}
              aria-label="Close and accept essential cookies only"
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>

            {!showSettings ? (
              <>
                {/* Main banner content */}
                <div className="flex items-start gap-4 mb-6">
                  <div className="p-2 rounded-full bg-primary/10 text-primary shrink-0">
                    <Cookie className="w-5 h-5" />
                  </div>
                  <div>
                    <h2
                      id="cookie-banner-title"
                      className="text-lg font-semibold text-foreground mb-1"
                    >
                      We value your privacy
                    </h2>
                    <p
                      id="cookie-banner-description"
                      className="text-sm text-muted-foreground"
                    >
                      We use cookies to enhance your browsing experience, serve personalized content,
                      and analyze our traffic. By clicking "Accept All", you consent to our use of cookies.
                    </p>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    onClick={handleAcceptAll}
                    className="rounded-full px-6"
                  >
                    Accept All
                  </Button>
                  <Button
                    onClick={handleAcceptEssential}
                    variant="outline"
                    className="rounded-full px-6"
                  >
                    Essential Only
                  </Button>
                  <Button
                    onClick={() => setShowSettings(true)}
                    variant="ghost"
                    className="rounded-full px-6 gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    Customize
                  </Button>
                </div>
              </>
            ) : (
              <>
                {/* Settings panel */}
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-foreground mb-1">
                    Cookie Preferences
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Choose which cookies you'd like to accept. Essential cookies are always enabled.
                  </p>
                </div>

                <div className="space-y-4 mb-6">
                  {/* Essential cookies (always on) */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border/40">
                    <div>
                      <Label className="text-sm font-medium">Essential Cookies</Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Required for the website to function. Cannot be disabled.
                      </p>
                    </div>
                    <Switch checked={true} disabled aria-label="Essential cookies (always enabled)" />
                  </div>

                  {/* Analytics cookies */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border/40">
                    <div>
                      <Label htmlFor="analytics-toggle" className="text-sm font-medium">
                        Analytics Cookies
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Help us understand how visitors interact with our website.
                      </p>
                    </div>
                    <Switch
                      id="analytics-toggle"
                      checked={preferences.analytics}
                      onCheckedChange={(checked) =>
                        setPreferences((prev) => ({ ...prev, analytics: checked }))
                      }
                      aria-label="Toggle analytics cookies"
                    />
                  </div>

                  {/* Marketing cookies */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border/40">
                    <div>
                      <Label htmlFor="marketing-toggle" className="text-sm font-medium">
                        Marketing Cookies
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Used to deliver personalized advertisements.
                      </p>
                    </div>
                    <Switch
                      id="marketing-toggle"
                      checked={preferences.marketing}
                      onCheckedChange={(checked) =>
                        setPreferences((prev) => ({ ...prev, marketing: checked }))
                      }
                      aria-label="Toggle marketing cookies"
                    />
                  </div>
                </div>

                {/* Settings action buttons */}
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    onClick={handleSavePreferences}
                    className="rounded-full px-6"
                  >
                    Save Preferences
                  </Button>
                  <Button
                    onClick={() => setShowSettings(false)}
                    variant="outline"
                    className="rounded-full px-6"
                  >
                    Back
                  </Button>
                </div>
              </>
            )}

            {/* Privacy policy link */}
            <p className="mt-4 text-xs text-muted-foreground">
              Learn more in our{' '}
              <a href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </a>
              .
            </p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default CookieConsentBanner;
