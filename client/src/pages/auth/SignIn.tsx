import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Mail, RefreshCw } from "lucide-react";

export default function SignIn() {
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
      const response = await fetch("/api/auth/signin", {
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
        title: "Berhasil!",
        description: "Anda telah berhasil masuk.",
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
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      toast({
        title: "Berhasil",
        description: data.message,
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Gagal mengirim ulang email verifikasi",
      });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#a1dab4]/20 via-white to-[#41b6c4]/10 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Masuk</CardTitle>
          <CardDescription>Masuk ke akun Storify Insights Anda</CardDescription>
        </CardHeader>
        <CardContent>
          {requiresVerification && (
            <div className="mb-4 p-4 rounded-lg bg-amber-50 border border-amber-200">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="w-5 h-5 text-amber-600" />
                <p className="text-sm font-medium text-amber-800">Email belum diverifikasi</p>
              </div>
              <p className="text-xs text-amber-700 mb-3">
                Silakan cek email Anda dan klik link verifikasi terlebih dahulu.
              </p>
              <Button size="sm" variant="outline" onClick={handleResend} disabled={resending} className="w-full">
                <RefreshCw className={`w-3 h-3 mr-1 ${resending ? "animate-spin" : ""}`} />
                {resending ? "Mengirim..." : "Kirim Ulang Email Verifikasi"}
              </Button>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
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
              <Label htmlFor="password">Password</Label>
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
              {isLoading ? "Memproses..." : "Masuk"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Belum punya akun?{" "}
            <Link href="/auth/signup" className="text-primary hover:underline font-medium">
              Daftar
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
