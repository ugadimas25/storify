import { useState } from "react";
import { DokuPayment } from "@/components/DokuPayment";
import { QrisPayment } from "@/components/QrisPayment";
import { useActiveSubscription, useListeningStatus } from "@/hooks/use-subscription";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Crown, Music, Headphones, Clock, CheckCircle, AlertCircle, QrCode, CreditCard, AlertTriangle, LogIn, UserPlus, Lock } from "lucide-react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/use-i18n";

type PaymentTab = "qris" | "doku";

export default function Subscription() {
  const { user } = useAuth();
  const { data: listeningStatus } = useListeningStatus();
  const { data: activeSubscription } = useActiveSubscription();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<PaymentTab>("qris");
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container max-w-4xl mx-auto px-4 py-8 pb-24 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full">
            <Crown className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl font-bold">{t("sub.title")}</h1>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            {t("sub.subtitle")}
          </p>
        </div>

        {/* Current Status Card */}
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Headphones className="w-5 h-5" />
              {t("sub.status")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {listeningStatus && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t("sub.statusLabel")}</span>
                  <Badge variant={listeningStatus.hasSubscription ? "default" : "secondary"}>
                    {listeningStatus.hasSubscription ? t("sub.premium") : user ? t("sub.free") : t("sub.guest")}
                  </Badge>
                </div>
                
                {!listeningStatus.hasSubscription && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t("sub.booksListened")}</span>
                    <span className="font-medium">
                      {listeningStatus.listenCount} / {listeningStatus.limit ?? "∞"}
                    </span>
                  </div>
                )}

                {listeningStatus.hasSubscription && listeningStatus.subscriptionEndsAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t("sub.validUntil")}</span>
                    <span className="font-medium">
                      {new Date(listeningStatus.subscriptionEndsAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric"
                      })}
                    </span>
                  </div>
                )}

                {!listeningStatus.canListen && !listeningStatus.hasSubscription && (
                  <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">{listeningStatus.reason}</span>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <Music className="w-8 h-8 mx-auto text-primary mb-2" />
              <h3 className="font-semibold">{t("sub.unlimitedAudiobook")}</h3>
              <p className="text-sm text-muted-foreground">
                {t("sub.unlimitedDesc")}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6 text-center">
              <Clock className="w-8 h-8 mx-auto text-primary mb-2" />
              <h3 className="font-semibold">{t("sub.continueListen")}</h3>
              <p className="text-sm text-muted-foreground">
                {t("sub.continueDesc")}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6 text-center">
              <CheckCircle className="w-8 h-8 mx-auto text-primary mb-2" />
              <h3 className="font-semibold">{t("sub.allCategories")}</h3>
              <p className="text-sm text-muted-foreground">
                {t("sub.allCategoriesDesc")}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Payment Method Tabs — requires login */}
        {!user ? (
          <Card className="border-2 border-dashed border-primary/30 bg-primary/5">
            <CardContent className="pt-8 pb-8 text-center space-y-6">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Lock className="w-8 h-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">{t("sub.loginToSubscribe")}</h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  {t("sub.loginToSubscribeMsg")}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={() => setLocation("/auth/signin")}
                  className="gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  {t("sub.signin")}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setLocation("/auth/signup")}
                  className="gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  {t("sub.signup")}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
        <div className="space-y-4">
          {/* Tab Selector */}
          <div className="flex bg-muted rounded-xl p-1.5 gap-1">
            <button
              onClick={() => setActiveTab("qris")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all",
                activeTab === "qris"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <QrCode className="w-4 h-4" />
              QRIS
              <Badge variant="default" className="text-[10px] px-1.5 py-0 bg-green-500 hover:bg-green-500">
                {t("sub.active")}
              </Badge>
            </button>
            <button
              onClick={() => setActiveTab("doku")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all",
                activeTab === "doku"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <CreditCard className="w-4 h-4" />
              DOKU
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-400 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="w-2.5 h-2.5 mr-0.5" />
                {t("sub.maintenance")}
              </Badge>
            </button>
          </div>

          {/* Tab Content */}
          <div>
            {activeTab === "qris" ? (
              <QrisPayment
                onSuccess={() => {}}
                onClose={() => {
                  setLocation("/explore");
                }}
              />
            ) : (
              <DokuPayment
                onSuccess={() => {}}
                onClose={() => {
                  setLocation("/explore");
                }}
              />
            )}
          </div>
        </div>
        )}

        {/* Comparison Table */}
        <Card>
          <CardHeader>
            <CardTitle>{t("sub.comparison")}</CardTitle>
            <CardDescription>
              {t("sub.comparisonDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2">{t("sub.feature")}</th>
                    <th className="text-center py-3 px-2">Guest</th>
                    <th className="text-center py-3 px-2">Free</th>
                    <th className="text-center py-3 px-2 bg-primary/5">Premium</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-3 px-2">{t("sub.bookLimit")}</td>
                    <td className="text-center py-3 px-2">{t("sub.1book")}</td>
                    <td className="text-center py-3 px-2">{t("sub.3books")}</td>
                    <td className="text-center py-3 px-2 bg-primary/5 font-semibold text-primary">
                      {t("sub.unlimited")}
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-2">Continue Listening</td>
                    <td className="text-center py-3 px-2">✗</td>
                    <td className="text-center py-3 px-2">✓</td>
                    <td className="text-center py-3 px-2 bg-primary/5">✓</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-2">Favorites</td>
                    <td className="text-center py-3 px-2">✗</td>
                    <td className="text-center py-3 px-2">✓</td>
                    <td className="text-center py-3 px-2 bg-primary/5">✓</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-2">{t("sub.allCategories")}</td>
                    <td className="text-center py-3 px-2">✓</td>
                    <td className="text-center py-3 px-2">✓</td>
                    <td className="text-center py-3 px-2 bg-primary/5">✓</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-2">{t("sub.skipSeconds")}</td>
                    <td className="text-center py-3 px-2">✓</td>
                    <td className="text-center py-3 px-2">✓</td>
                    <td className="text-center py-3 px-2 bg-primary/5">✓</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* FAQ */}
        <Card>
          <CardHeader>
            <CardTitle>{t("sub.faq")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium">{t("sub.faq1q")}</h4>
              <p className="text-sm text-muted-foreground">
                {t("sub.faq1a")}
              </p>
            </div>
            <div>
              <h4 className="font-medium">{t("sub.faq2q")}</h4>
              <p className="text-sm text-muted-foreground">
                {t("sub.faq2a")}
              </p>
            </div>
            <div>
              <h4 className="font-medium">{t("sub.faq3q")}</h4>
              <p className="text-sm text-muted-foreground">
                {t("sub.faq3a")}
              </p>
            </div>
            <div>
              <h4 className="font-medium">{t("sub.faq4q")}</h4>
              <p className="text-sm text-muted-foreground">
                {t("sub.faq4a")}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
