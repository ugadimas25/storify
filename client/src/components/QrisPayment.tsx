import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  useQrisPlans,
  useCreateQrisPayment,
  useQrisPaymentStatus,
  useQrisActiveSubscription,
  useListeningStatus,
  useValidateReferralCode,
} from "@/hooks/use-subscription";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, CheckCircle, XCircle, Crown, Music, Clock, RefreshCw, QrCode, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

type PaymentState = "idle" | "pending" | "paid" | "expired" | "failed";

interface QrisPaymentProps {
  onSuccess?: () => void;
  onClose?: () => void;
}

export function QrisPayment({ onSuccess, onClose }: QrisPaymentProps) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { data: plans, isLoading: plansLoading } = useQrisPlans();
  const { data: activeSubscription } = useQrisActiveSubscription();
  const { data: listeningStatus } = useListeningStatus();
  const createPayment = useCreateQrisPayment();
  const validateReferral = useValidateReferralCode();

  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [currentTransaction, setCurrentTransaction] = useState<string | null>(null);
  const [paymentState, setPaymentState] = useState<PaymentState>("idle");
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [qrisContent, setQrisContent] = useState<string>("");
  
  // Referral code state
  const [referralCode, setReferralCode] = useState<string>("");
  const [referralValid, setReferralValid] = useState<boolean>(false);
  const [referralMessage, setReferralMessage] = useState<string>("");
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [showReferralInput, setShowReferralInput] = useState<boolean>(false);

  // Poll QRIS payment status
  const { data: paymentStatus } = useQrisPaymentStatus(
    currentTransaction,
    paymentState === "pending"
  );

  // Handle payment status changes
  useEffect(() => {
    if (!paymentStatus) return;

    if (paymentStatus.status === "paid") {
      setPaymentState("paid");
      onSuccess?.();
    } else if (paymentStatus.status === "expired") {
      setPaymentState("expired");
    } else if (paymentStatus.status === "failed") {
      setPaymentState("failed");
    }

    if (paymentStatus.expiredAt && paymentStatus.status === "pending") {
      const expiry = new Date(paymentStatus.expiredAt).getTime();
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((expiry - now) / 1000));
      setTimeLeft(remaining);
    }
  }, [paymentStatus, onSuccess]);

  // Countdown timer
  useEffect(() => {
    if (paymentState !== "pending" || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setPaymentState("expired");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [paymentState, timeLeft]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Validate referral code
  const handleValidateReferral = async () => {
    if (!referralCode.trim()) {
      setReferralMessage("Kode referral tidak boleh kosong");
      setReferralValid(false);
      return;
    }

    try {
      const result = await validateReferral.mutateAsync(referralCode);
      setReferralValid(result.valid);
      setReferralMessage(result.message);
      if (result.valid) {
        setDiscountPercent(result.discountPercent);
      } else {
        setDiscountPercent(0);
      }
    } catch (error: any) {
      setReferralMessage("Gagal memvalidasi kode referral");
      setReferralValid(false);
      setDiscountPercent(0);
    }
  };

  // Clear referral code
  const handleClearReferral = () => {
    setReferralCode("");
    setReferralValid(false);
    setReferralMessage("");
    setDiscountPercent(0);
  };

  // Handle plan selection and QRIS payment creation
  const handleSelectPlan = async (planId: number) => {
    if (!user) {
      setLocation("/auth/signin");
      return;
    }

    setSelectedPlanId(planId);

    try {
      const transaction = await createPayment.mutateAsync({
        planId,
        referralCode: referralValid ? referralCode : undefined,
      });
      setCurrentTransaction(transaction.id);
      setQrisContent(transaction.qrisContent || "");
      setPaymentState("pending");

      if (transaction.expiredAt) {
        const expiry = new Date(transaction.expiredAt).getTime();
        const now = Date.now();
        setTimeLeft(Math.max(0, Math.floor((expiry - now) / 1000)));
      } else {
        setTimeLeft(30 * 60); // Default 30 minutes
      }
    } catch (error: any) {
      console.error("QRIS payment creation failed:", error);
      alert(error.message || "Gagal membuat pembayaran QRIS");
      // Reset referral on error
      handleClearReferral();
    }
  };

  // Reset payment state
  const handleReset = () => {
    setPaymentState("idle");
    setSelectedPlanId(null);
    setCurrentTransaction(null);
    setQrisContent("");
    setTimeLeft(0);
    handleClearReferral();
  };

  // If user has active subscription
  if (activeSubscription && new Date(activeSubscription.endDate) > new Date()) {
    return (
      <Card className="w-full max-w-md mx-auto bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-800">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-yellow-100 dark:bg-yellow-900/50 rounded-full flex items-center justify-center mb-4">
            <Crown className="w-8 h-8 text-yellow-600" />
          </div>
          <CardTitle className="text-yellow-700 dark:text-yellow-400">Anda Sudah Berlangganan!</CardTitle>
          <CardDescription>
            Langganan aktif sampai:{" "}
            {new Date(activeSubscription.endDate).toLocaleDateString("id-ID", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Badge variant="secondary" className="text-lg px-4 py-2">
            <Music className="w-4 h-4 mr-2" />
            Unlimited Listening
          </Badge>
        </CardContent>
      </Card>
    );
  }

  // Loading state
  if (plansLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Payment success state
  if (paymentState === "paid") {
    return (
      <Card className="w-full max-w-md mx-auto bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
        <CardHeader className="text-center">
          <div className="mx-auto w-20 h-20 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mb-4 animate-bounce">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <CardTitle className="text-green-700 dark:text-green-400 text-2xl">
            Pembayaran Berhasil!
          </CardTitle>
          <CardDescription className="text-green-600 dark:text-green-300">
            Terima kasih telah berlangganan Storify Premium
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            Sekarang Anda dapat menikmati unlimited audiobook tanpa batasan!
          </p>
          <Button onClick={onClose} className="w-full bg-green-600 hover:bg-green-700">
            Mulai Mendengarkan
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Payment expired/failed state
  if (paymentState === "expired" || paymentState === "failed") {
    return (
      <Card className="w-full max-w-md mx-auto bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-red-200 dark:border-red-800">
        <CardHeader className="text-center">
          <div className="mx-auto w-20 h-20 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center mb-4">
            <XCircle className="w-12 h-12 text-red-600" />
          </div>
          <CardTitle className="text-red-700 dark:text-red-400 text-2xl">
            {paymentState === "expired" ? "Waktu Habis" : "Pembayaran Gagal"}
          </CardTitle>
          <CardDescription className="text-red-600 dark:text-red-300">
            {paymentState === "expired"
              ? "QR Code QRIS sudah kedaluwarsa. Silakan coba lagi."
              : "Terjadi kesalahan dalam pembayaran. Silakan coba lagi."}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button onClick={handleReset} variant="outline" className="w-full">
            <RefreshCw className="w-4 h-4 mr-2" />
            Coba Lagi
          </Button>
        </CardContent>
      </Card>
    );
  }

  // QR Code display (pending payment)
  if (paymentState === "pending" && qrisContent) {
    const selectedPlan = plans?.find((p) => p.id === selectedPlanId);
    const finalAmount = referralValid && discountPercent > 0
      ? Math.floor((selectedPlan?.price || 0) * (100 - discountPercent) / 100)
      : selectedPlan?.price || 0;
    const savedAmount = (selectedPlan?.price || 0) - finalAmount;

    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <QrCode className="w-5 h-5" />
            Scan QR Code QRIS
          </CardTitle>
          <CardDescription>
            {selectedPlan?.name}
            {referralValid && savedAmount > 0 ? (
              <div className="mt-2 space-y-1">
                <div className="text-sm line-through text-muted-foreground">
                  {formatPrice(selectedPlan?.price || 0)}
                </div>
                <div className="text-lg font-bold text-green-600">
                  {formatPrice(finalAmount)}
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  Hemat {formatPrice(savedAmount)} dengan kode referral!
                </Badge>
              </div>
            ) : (
              <div className="text-lg font-bold mt-1">
                {formatPrice(finalAmount)}
              </div>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* QR Code Display */}
          <div className="flex flex-col items-center gap-4 p-6 bg-white rounded-xl border-2 border-dashed border-primary/20">
            <div className="bg-white p-4 rounded-lg shadow-inner">
              {/* Using QR code image from API - renders qrisContent as QR */}
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrisContent)}`}
                alt="QRIS QR Code"
                className="w-[250px] h-[250px]"
                onError={(e) => {
                  // Fallback: show the qris content text
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-medium text-primary">Scan dengan aplikasi e-wallet Anda</p>
              <p className="text-xs text-muted-foreground">
                GoPay, OVO, DANA, ShopeePay, LinkAja, atau mobile banking
              </p>
            </div>
          </div>

          {/* Supported payment methods */}
          <div className="flex justify-center gap-3 flex-wrap">
            {["GoPay", "OVO", "DANA", "ShopeePay", "LinkAja"].map((method) => (
              <div
                key={method}
                className="flex items-center gap-1 px-3 py-1.5 bg-muted rounded-full text-xs font-medium"
              >
                {method}
              </div>
            ))}
          </div>

          {/* Countdown */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-lg font-medium">
              <Clock className="w-5 h-5 text-orange-500" />
              <span
                className={cn(
                  "font-mono text-xl",
                  timeLeft < 120 ? "text-red-500" : "text-orange-500"
                )}
              >
                {formatTime(timeLeft)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Selesaikan pembayaran sebelum waktu habis
            </p>
          </div>

          {/* Status indicator */}
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Menunggu pembayaran...
          </div>

          {/* Instructions */}
          <div className="bg-muted/50 p-4 rounded-lg text-sm space-y-2">
            <p className="font-medium">Cara Pembayaran:</p>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Buka aplikasi e-wallet atau mobile banking</li>
              <li>Scan QR Code di atas</li>
              <li>Konfirmasi pembayaran di aplikasi Anda</li>
              <li>Subscription aktif otomatis setelah pembayaran berhasil</li>
            </ol>
          </div>

          {/* Cancel button */}
          <Button variant="outline" onClick={handleReset} className="w-full">
            Batal
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Plan selection (idle state)
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
          <QrCode className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-primary">Pembayaran QRIS</span>
        </div>
        <h2 className="text-2xl font-bold">Pilih Paket Langganan</h2>
        <p className="text-muted-foreground">
          Bayar dengan scan QR menggunakan GoPay, OVO, DANA, dan lainnya
        </p>
        {listeningStatus && !listeningStatus.hasSubscription && (
          <Badge variant="outline" className="mt-2">
            {user
              ? `Sisa ${listeningStatus.limit! - listeningStatus.listenCount} dari ${listeningStatus.limit} buku gratis`
              : `Guest: ${listeningStatus.listenCount}/${listeningStatus.limit} buku didengarkan`}
          </Badge>
        )}
      </div>

      {/* Referral Code Section */}
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-purple-900 dark:text-purple-100">
                  Punya Kode Referral?
                </h3>
              </div>
              {!showReferralInput && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowReferralInput(true)}
                  className="text-purple-600 hover:text-purple-700"
                >
                  Masukkan Kode
                </Button>
              )}
            </div>

            {showReferralInput && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Contoh: STORIFY-ABC123"
                    value={referralCode}
                    onChange={(e) => {
                      setReferralCode(e.target.value.toUpperCase());
                      setReferralValid(false);
                      setReferralMessage("");
                    }}
                    className="flex-1"
                    disabled={referralValid}
                  />
                  {!referralValid ? (
                    <Button
                      onClick={handleValidateReferral}
                      disabled={!referralCode.trim() || validateReferral.isPending}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {validateReferral.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Validasi"
                      )}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={handleClearReferral}
                      className="border-purple-300"
                    >
                      Hapus
                    </Button>
                  )}
                </div>

                {referralMessage && (
                  <div
                    className={cn(
                      "flex items-center gap-2 p-3 rounded-lg text-sm",
                      referralValid
                        ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200"
                        : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200"
                    )}
                  >
                    {referralValid ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                    <span>{referralMessage}</span>
                  </div>
                )}

                {referralValid && discountPercent > 0 && (
                  <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-3 rounded-lg text-center">
                    <p className="font-bold text-lg">🎉 Diskon {discountPercent}% Aktif!</p>
                    <p className="text-sm opacity-90">Hemat hingga ribuan rupiah</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Plans */}
      <div className="grid gap-4 md:grid-cols-3">
        {plans?.map((plan) => {
          const isPopular = plan.name.toLowerCase().includes("bulanan");
          const pricePerDay = Math.round(plan.price / plan.durationDays);

          return (
            <Card
              key={plan.id}
              className={cn(
                "relative transition-all hover:shadow-lg cursor-pointer",
                isPopular && "border-primary ring-2 ring-primary ring-offset-2",
                selectedPlanId === plan.id && "bg-primary/5"
              )}
              onClick={() => setSelectedPlanId(plan.id)}
            >
              {isPopular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                  BEST VALUE
                </Badge>
              )}
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                <CardDescription>{plan.durationDays} hari</CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <div>
                  {referralValid && discountPercent > 0 ? (
                    <>
                      <p className="text-sm text-muted-foreground line-through">
                        {formatPrice(plan.price)}
                      </p>
                      <p className="text-3xl font-bold text-green-600">
                        {formatPrice(Math.floor(plan.price * (100 - discountPercent) / 100))}
                      </p>
                      <Badge variant="secondary" className="mt-1 bg-green-100 text-green-700">
                        Hemat {formatPrice(Math.floor(plan.price * discountPercent / 100))}
                      </Badge>
                    </>
                  ) : (
                    <>
                      <p className="text-3xl font-bold text-primary">
                        {formatPrice(plan.price)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatPrice(pricePerDay)}/hari
                      </p>
                    </>
                  )}
                </div>

                <ul className="text-sm text-left space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Unlimited audiobook
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Akses semua kategori
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Continue listening
                  </li>
                </ul>

                <Button
                  className="w-full"
                  variant={selectedPlanId === plan.id ? "default" : "outline"}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectPlan(plan.id);
                  }}
                  disabled={createPayment.isPending}
                >
                  {createPayment.isPending && selectedPlanId === plan.id ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <QrCode className="w-4 h-4 mr-2" />
                      Bayar dengan QRIS
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Powered by Pewaca */}
      <div className="text-center">
        <p className="text-xs text-muted-foreground">
          Pembayaran QRIS diproses oleh <strong>Pewaca</strong> — Payment Gateway QRIS terpercaya
        </p>
      </div>

      {/* Login prompt for guests */}
      {!user && (
        <div className="text-center p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            Anda harus login terlebih dahulu untuk berlangganan
          </p>
        </div>
      )}
    </div>
  );
}
