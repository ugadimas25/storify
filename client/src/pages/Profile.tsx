import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "@/hooks/use-i18n";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, User, Settings, Shield, HelpCircle, Globe, Handshake, Moon, Sun, ChevronDown, ChevronUp, Mail, Lock, Trash2, Info, MessageCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";
import { useTheme } from "@/hooks/use-theme";
import { useState } from "react";

export default function Profile() {
  const { user, logout, isLoggingOut, isLoading } = useAuth();
  const { t, locale, setLocale } = useTranslation();
  const [, setLocation] = useLocation();
  const { isDark, setTheme } = useTheme();
  const [openSection, setOpenSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen p-6 pt-20 flex flex-col items-center space-y-6">
        <Skeleton className="w-24 h-24 rounded-full" />
        <Skeleton className="h-8 w-48" />
        <div className="w-full space-y-4 mt-8">
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-background">
        <h1 className="text-2xl font-display font-bold mb-2">{t("profile.welcome")}</h1>
        <p className="text-muted-foreground mb-8">{t("profile.welcomeMsg")}</p>
        <Button asChild size="lg" className="w-full max-w-xs">
          <a href="/auth/signin">{t("profile.signinSignup")}</a>
        </Button>
      </div>
    );
  }

  const menuItems = [
    { icon: Settings, label: t("profile.accountSettings"), key: "account" },
    { icon: Shield, label: t("profile.privacy"), key: "privacy" },
    { icon: HelpCircle, label: t("profile.help"), key: "help" },
  ];

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md px-6 lg:px-8 py-4 lg:py-6 border-b border-border/50">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold">{t("profile.title")}</h1>
        </div>
      </div>

      <div className="flex flex-col items-center pt-8 lg:pt-12 pb-12 px-6 max-w-3xl mx-auto">
        <Avatar className="w-24 h-24 md:w-32 md:h-32 mb-4 ring-4 ring-background shadow-xl">
          <AvatarImage src={user.profileImageUrl || undefined} />
          <AvatarFallback className="bg-primary/10 text-primary text-2xl md:text-4xl font-bold">
            {user.firstName?.[0] || user.email?.[0] || "U"}
          </AvatarFallback>
        </Avatar>
        
        <h2 className="text-xl md:text-2xl lg:text-3xl font-bold">{user.firstName} {user.lastName}</h2>
        <p className="text-muted-foreground md:text-lg">{user.email}</p>
        
        <div className="w-full max-w-md mt-12 space-y-3 md:space-y-4">
          {/* Partner Button */}
          <Button
            variant="outline"
            className="w-full justify-start h-14 md:h-16 text-base md:text-lg font-normal rounded-xl bg-gradient-to-r from-primary/5 to-primary/10 hover:from-primary/10 hover:to-primary/15 border-primary/20 transition-all hover:scale-[1.01] hover:shadow-sm"
            onClick={() => setLocation("/partner")}
          >
            <Handshake className="w-5 h-5 md:w-6 md:h-6 mr-3 text-primary" />
            Partner Program
          </Button>

          {menuItems.map((item) => (
            <div key={item.key} className="space-y-0">
              <Button
                variant="outline"
                className="w-full justify-between h-14 md:h-16 text-base md:text-lg font-normal rounded-xl bg-card hover:bg-muted/50 border-border/50 transition-all hover:scale-[1.01] hover:shadow-sm"
                onClick={() => toggleSection(item.key)}
              >
                <span className="flex items-center">
                  <item.icon className="w-5 h-5 md:w-6 md:h-6 mr-3 text-muted-foreground" />
                  {item.label}
                </span>
                {openSection === item.key ? (
                  <ChevronUp className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                )}
              </Button>

              {/* Account Settings Panel */}
              {item.key === "account" && openSection === "account" && (
                <div className="mt-2 p-5 rounded-xl bg-card border border-border/50 space-y-5 animate-in slide-in-from-top-2 duration-200">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1.5 block">{t("profile.editName")}</label>
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="text-foreground">{user.firstName} {user.lastName}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1.5 block">{t("profile.email")}</label>
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="text-foreground">{user.email}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1.5 block">{t("profile.changePassword")}</label>
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                      <Lock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground text-sm">••••••••</span>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-border/50">
                    <button className="flex items-center gap-2 text-sm text-destructive hover:text-destructive/80 transition-colors">
                      <Trash2 className="w-4 h-4" />
                      {t("profile.deleteAccount")}
                    </button>
                    <p className="text-xs text-muted-foreground mt-1">{t("profile.deleteAccountWarning")}</p>
                  </div>
                </div>
              )}

              {/* Privacy Panel */}
              {item.key === "privacy" && openSection === "privacy" && (
                <div className="mt-2 p-5 rounded-xl bg-card border border-border/50 space-y-4 animate-in slide-in-from-top-2 duration-200">
                  <p className="text-sm text-muted-foreground">{t("profile.privacyDesc")}</p>
                  {[
                    { title: t("profile.dataCollected"), desc: t("profile.dataCollectedDesc") },
                    { title: t("profile.dataSecurity"), desc: t("profile.dataSecurityDesc") },
                    { title: t("profile.dataControl"), desc: t("profile.dataControlDesc") },
                  ].map((item, i) => (
                    <div key={i} className="p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2 mb-1">
                        <Info className="w-4 h-4 text-primary" />
                        <span className="text-sm font-semibold">{item.title}</span>
                      </div>
                      <p className="text-xs text-muted-foreground ml-6">{item.desc}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Help Panel */}
              {item.key === "help" && openSection === "help" && (
                <div className="mt-2 p-5 rounded-xl bg-card border border-border/50 space-y-4 animate-in slide-in-from-top-2 duration-200">
                  <h4 className="text-sm font-semibold">{t("profile.faq")}</h4>
                  {[
                    { q: t("profile.faq1q"), a: t("profile.faq1a") },
                    { q: t("profile.faq2q"), a: t("profile.faq2a") },
                    { q: t("profile.faq3q"), a: t("profile.faq3a") },
                  ].map((faq, i) => (
                    <div key={i} className="p-3 rounded-lg bg-muted/50">
                      <p className="text-sm font-medium mb-1">{faq.q}</p>
                      <p className="text-xs text-muted-foreground">{faq.a}</p>
                    </div>
                  ))}
                  <div className="pt-3 border-t border-border/50">
                    <h4 className="text-sm font-semibold mb-2">{t("profile.contactSupport")}</h4>
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                      <MessageCircle className="w-4 h-4 text-primary" />
                      <span className="text-sm text-muted-foreground">{t("profile.contactEmail")}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Language Toggle */}
          <Button
            variant="outline"
            className="w-full justify-between h-14 md:h-16 text-base md:text-lg font-normal rounded-xl bg-card hover:bg-muted/50 border-border/50 transition-all hover:scale-[1.01] hover:shadow-sm"
            onClick={() => setLocale(locale === "id" ? "en" : "id")}
          >
            <span className="flex items-center">
              <Globe className="w-5 h-5 md:w-6 md:h-6 mr-3 text-muted-foreground" />
              {t("profile.language")}
            </span>
            <span className="text-sm font-semibold bg-primary/10 text-primary px-3 py-1 rounded-full">
              {locale === "id" ? "ID 🇮🇩" : "EN 🇬🇧"}
            </span>
          </Button>
          {/* Dark Mode Toggle */}
          <Button
            variant="outline"
            className="w-full justify-between h-14 md:h-16 text-base md:text-lg font-normal rounded-xl bg-card hover:bg-muted/50 border-border/50 transition-all hover:scale-[1.01] hover:shadow-sm"
            onClick={() => setTheme(isDark ? "light" : "dark")}
          >
            <span className="flex items-center">
              {isDark ? (
                <Moon className="w-5 h-5 md:w-6 md:h-6 mr-3 text-muted-foreground" />
              ) : (
                <Sun className="w-5 h-5 md:w-6 md:h-6 mr-3 text-muted-foreground" />
              )}
              {t("profile.darkMode")}
            </span>
            <span className="text-sm font-semibold bg-primary/10 text-primary px-3 py-1 rounded-full">
              {isDark ? "ON" : "OFF"}
            </span>
          </Button>
          <div className="pt-8">
            <Button 
              variant="destructive" 
              className="w-full h-14 md:h-16 rounded-xl text-base md:text-lg"
              onClick={() => logout()}
              disabled={isLoggingOut}
            >
              <LogOut className="w-5 h-5 md:w-6 md:h-6 mr-2" />
              {isLoggingOut ? t("profile.signingOut") : t("profile.signout")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
