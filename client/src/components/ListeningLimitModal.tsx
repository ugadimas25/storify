import { useAudio } from "@/context/AudioContext";
import { useLocation } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, Music, User } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "@/hooks/use-i18n";

export function ListeningLimitModal() {
  const { listeningError, clearListeningError } = useAudio();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { t } = useTranslation();

  const handleSubscribe = () => {
    clearListeningError();
    setLocation("/subscription");
  };

  const handleLogin = () => {
    clearListeningError();
    // Trigger login flow - this depends on your auth implementation
    // For now, navigate to profile where login might be available
    setLocation("/profile");
  };

  return (
    <Dialog open={!!listeningError} onOpenChange={(open) => !open && clearListeningError()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mb-2">
            <Music className="w-8 h-8 text-orange-600" />
          </div>
          <DialogTitle className="text-center text-xl">
            {t("limit.title")}
          </DialogTitle>
          <DialogDescription className="text-center">
            {listeningError}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {!user ? (
            <>
              <p className="text-sm text-muted-foreground text-center">
                {t("limit.loginMsg")}
              </p>
              <div className="grid gap-3">
                <Button onClick={handleLogin} variant="outline" className="w-full">
                  <User className="w-4 h-4 mr-2" />
                  {t("limit.loginBtn")}
                </Button>
                <Button onClick={handleSubscribe} className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600">
                  <Crown className="w-4 h-4 mr-2" />
                  {t("limit.subscribeBtn")}
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground text-center">
                {t("limit.upgradeMsg")}
              </p>
              <Button onClick={handleSubscribe} className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600">
                <Crown className="w-4 h-4 mr-2" />
                {t("limit.subscribeBtn")}
              </Button>
            </>
          )}
        </div>

        <DialogFooter className="sm:justify-center">
          <Button variant="ghost" onClick={clearListeningError}>
            {t("limit.later")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
