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

export function ListeningLimitModal() {
  const { listeningError, clearListeningError } = useAudio();
  const { user } = useAuth();
  const [, setLocation] = useLocation();

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
            Batas Mendengarkan Tercapai
          </DialogTitle>
          <DialogDescription className="text-center">
            {listeningError}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {!user ? (
            <>
              <p className="text-sm text-muted-foreground text-center">
                Login untuk mendapatkan akses lebih banyak audiobook, atau berlangganan untuk akses unlimited!
              </p>
              <div className="grid gap-3">
                <Button onClick={handleLogin} variant="outline" className="w-full">
                  <User className="w-4 h-4 mr-2" />
                  Login (3 Buku Gratis)
                </Button>
                <Button onClick={handleSubscribe} className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600">
                  <Crown className="w-4 h-4 mr-2" />
                  Berlangganan Premium
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground text-center">
                Upgrade ke Premium untuk menikmati unlimited audiobook tanpa batasan!
              </p>
              <Button onClick={handleSubscribe} className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600">
                <Crown className="w-4 h-4 mr-2" />
                Berlangganan Premium
              </Button>
            </>
          )}
        </div>

        <DialogFooter className="sm:justify-center">
          <Button variant="ghost" onClick={clearListeningError}>
            Nanti saja
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
