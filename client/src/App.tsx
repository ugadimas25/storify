import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AudioProvider } from "@/context/AudioContext";
import { BottomNav } from "@/components/Navigation";
import { GlobalAudioPlayer } from "@/components/AudioPlayer";
import { ListeningLimitModal } from "@/components/ListeningLimitModal";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Explore from "@/pages/Explore";
import BookDetail from "@/pages/BookDetail";
import Favorites from "@/pages/Favorites";
import Profile from "@/pages/Profile";
import Subscription from "@/pages/Subscription";
import SignIn from "@/pages/auth/SignIn";
import SignUp from "@/pages/auth/SignUp";
import { usePageViewTracker } from "@/hooks/use-activity";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/explore" component={Explore} />
      <Route path="/book/:id" component={BookDetail} />
      <Route path="/favorites" component={Favorites} />
      <Route path="/profile" component={Profile} />
      <Route path="/subscription" component={Subscription} />
      <Route path="/auth/signin" component={SignIn} />
      <Route path="/auth/signup" component={SignUp} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  usePageViewTracker();

  return (
    <AudioProvider>
      <Router />
      <GlobalAudioPlayer />
      <ListeningLimitModal />
      <BottomNav />
      <Toaster />
    </AudioProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;
