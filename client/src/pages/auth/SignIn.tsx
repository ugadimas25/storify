import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { GoogleLogin } from "@react-oauth/google";
import { apiUrl } from "@/lib/api-config";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Mail, RefreshCw } from "lucide-react";
import { useTranslation } from "@/hooks/use-i18n";

export default function SignIn() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [requiresVerification, setRequiresVerification] = useState(false);
  const [resending, setResending] = useState(false);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setRequiresVerification(false);

    try {
      const response = await fetch(apiUrl("/api/auth/signin"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.status === 403 && data.requiresVerification) {
        setRequiresVerification(true);
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || "Sign in failed");
      }

      // Invalidate auth cache so UI updates (buttons disappear)
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });

      toast({
        title: t("toast.success"),
        description: t("toast.signedIn"),
      });

      setLocation("/");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Something went wrong",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      const response = await fetch(apiUrl("/api/auth/resend-verification"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      toast({
        title: t("toast.success"),
        description: data.message,
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: t("toast.resendFailed"),
      });
    } finally {
      setResending(false);
    }
  };

  // Google Login Handler
  const handleGoogleSuccess = async (credentialResponse: any) => {
    setIsLoading(true);

    try {
      const response = await fetch(apiUrl("/api/auth/google"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          credential: credentialResponse.credential,
        }),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Google login failed");
      }

      const data = await response.json();

      // Invalidate auth cache so UI updates
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });

      toast({
        title: t("toast.success"),
        description: `${t("toast.welcome")}${data.user.name ? ", " + data.user.name : ""}!`,
      });

      setTimeout(() => {
        setLocation("/");
      }, 500);
    } catch (error: any) {
      console.error("Google login error:", error);
      toast({
      title: t("toast.loginFailed"),
      description: error.message || t("toast.googleFailed"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = () => {
    console.error("Google login failed");
    toast({
      title: t("toast.loginFailed"),
      description: t("toast.googleFailed"),
      variant: "destructive",
    });
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #dce9f8 0%, #ecf5fc 50%, #cfe3f4 100%)' }}
    >
      {/* Decorative ribbon background */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none select-none"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMaxYMid slice"
      >
        <defs>
          <linearGradient id="rg1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9"/>
            <stop offset="100%" stopColor="#9bbdd9" stopOpacity="0.3"/>
          </linearGradient>
          <linearGradient id="rg2" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#b5d3ec" stopOpacity="0.7"/>
            <stop offset="100%" stopColor="#e0eef8" stopOpacity="0.2"/>
          </linearGradient>
          <linearGradient id="rg3" x1="0.5" y1="0" x2="0.5" y2="1">
            <stop offset="0%" stopColor="#dceefa" stopOpacity="0.8"/>
            <stop offset="100%" stopColor="#88b8d8" stopOpacity="0.35"/>
          </linearGradient>
        </defs>
        {/* Outer ribbon loop */}
        <path d="M1100,0 C1380,-80 1560,160 1520,400 C1480,640 1280,820 1060,800 C840,780 680,620 700,420 C720,220 940,80 1100,0 Z" fill="url(#rg1)"/>
        {/* Mid ribbon */}
        <path d="M1150,60 C1380,0 1520,200 1490,420 C1460,640 1280,790 1070,775 C860,760 710,610 730,430 C750,260 970,110 1150,60 Z" fill="url(#rg2)"/>
        {/* Inner highlight */}
        <path d="M1050,150 C1230,90 1380,250 1360,430 C1340,610 1180,730 1000,718 C820,706 690,580 708,430 C726,290 910,200 1050,150 Z" fill="url(#rg3)" opacity="0.7"/>
        {/* Bottom extension */}
        <path d="M900,450 C1080,400 1260,480 1290,630 C1320,780 1180,880 1010,890 C840,900 700,820 680,700 C660,580 760,490 900,450 Z" fill="url(#rg1)" opacity="0.6"/>
        {/* Top-right accent */}
        <path d="M1300,0 C1460,0 1560,100 1540,240 C1520,360 1400,420 1300,400 C1200,380 1140,300 1160,200 C1180,100 1240,0 1300,0 Z" fill="url(#rg2)" opacity="0.5"/>
      </svg>
      <Card className="w-full max-w-md relative z-10 shadow-xl bg-white/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>{t("auth.signIn")}</CardTitle>
          <CardDescription>{t("auth.signInDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          {requiresVerification && (
            <div className="mb-4 p-4 rounded-lg bg-amber-50 border border-amber-200">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="w-5 h-5 text-amber-600" />
                <p className="text-sm font-medium text-amber-800">{t("auth.emailNotVerified")}</p>
              </div>
              <p className="text-xs text-amber-700 mb-3">
                {t("auth.checkEmailVerify")}
              </p>
              <Button size="sm" variant="outline" onClick={handleResend} disabled={resending} className="w-full">
                <RefreshCw className={`w-3 h-3 mr-1 ${resending ? "animate-spin" : ""}`} />
                {resending ? t("auth.sending") : t("auth.resendVerification")}
              </Button>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@contoh.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("auth.password")}</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full bg-gradient-to-r from-[#253494] to-[#2c7fb8] hover:from-[#253494]/90 hover:to-[#2c7fb8]/90" disabled={isLoading}>
              {isLoading ? t("auth.processing") : t("auth.signIn")}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                {t("auth.orSignInWith")}
              </span>
            </div>
          </div>

          {/* Google Login Button */}
          <div className="flex justify-center">
            {import.meta.env.VITE_GOOGLE_CLIENT_ID ? (
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                useOneTap={false}
                theme="outline"
                size="large"
                text="signin_with"
                shape="rectangular"
                width="100%"
              />
            ) : (
              <p className="text-xs text-muted-foreground text-center">
                {t("auth.googleNotConfigured")}
              </p>
            )}
          </div>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            {t("auth.noAccount")}{" "}
            <Link href="/auth/signup" className="text-primary hover:underline font-medium">
              {t("auth.register")}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
