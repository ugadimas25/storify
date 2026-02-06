import https from "https";

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || "dimas.perceka@storify.asia";
const FROM_NAME = process.env.FROM_NAME || "Storify Insights";

if (!BREVO_API_KEY) {
  console.warn("WARNING: BREVO_API_KEY is not set. Email sending will fail.");
}

interface SendEmailOptions {
  to: string;
  toName?: string;
  subject: string;
  htmlContent: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  const payload = JSON.stringify({
    sender: { name: FROM_NAME, email: FROM_EMAIL },
    to: [{ email: options.to, name: options.toName || options.to }],
    subject: options.subject,
    htmlContent: options.htmlContent,
  });

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: "api.brevo.com",
        path: "/v3/smtp/email",
        method: "POST",
        headers: {
          "accept": "application/json",
          "api-key": BREVO_API_KEY,
          "content-type": "application/json",
          "content-length": Buffer.byteLength(payload),
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            console.log("Email sent successfully to:", options.to);
            resolve(true);
          } else {
            console.error("Brevo API error:", res.statusCode, data);
            resolve(false);
          }
        });
      }
    );

    req.on("error", (err) => {
      console.error("Email send error:", err);
      resolve(false);
    });

    req.write(payload);
    req.end();
  });
}

export async function sendVerificationEmail(
  email: string,
  name: string,
  token: string
): Promise<boolean> {
  const baseUrl = process.env.APP_URL || "https://storify.asia";
  const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${token}`;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f0ff;font-family:'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:480px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(88,28,135,0.08);">
    
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#7c3aed,#4f46e5,#2563eb);padding:32px 24px;text-align:center;">
      <div style="display:inline-block;background:rgba(255,255,255,0.15);border-radius:50%;padding:16px;margin-bottom:12px;">
        <span style="font-size:32px;">🎧</span>
      </div>
      <h1 style="color:#ffffff;font-size:22px;margin:0;font-weight:700;">Storify Insights</h1>
      <p style="color:rgba(255,255,255,0.8);font-size:13px;margin:4px 0 0;">Audiobook Summaries</p>
    </div>
    
    <!-- Body -->
    <div style="padding:32px 24px;">
      <h2 style="color:#1e1b4b;font-size:20px;margin:0 0 8px;">Halo ${name}! 👋</h2>
      <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 24px;">
        Terima kasih telah mendaftar di Storify Insights. Klik tombol di bawah untuk memverifikasi alamat email Anda.
      </p>
      
      <div style="text-align:center;margin:32px 0;">
        <a href="${verifyUrl}" 
           style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#ffffff;text-decoration:none;padding:14px 40px;border-radius:12px;font-size:15px;font-weight:600;box-shadow:0 4px 16px rgba(79,70,229,0.3);">
          ✓ Verifikasi Email
        </a>
      </div>
      
      <p style="color:#9ca3af;font-size:12px;line-height:1.5;margin:24px 0 0;text-align:center;">
        Link ini berlaku selama 24 jam.<br>
        Jika Anda tidak mendaftar, abaikan email ini.
      </p>
    </div>
    
    <!-- Footer -->
    <div style="background:#f9fafb;padding:16px 24px;text-align:center;border-top:1px solid #f3f4f6;">
      <p style="color:#9ca3af;font-size:11px;margin:0;">
        © ${new Date().getFullYear()} Storify Insights. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>`;

  return sendEmail({
    to: email,
    toName: name,
    subject: "Verifikasi Email - Storify Insights",
    htmlContent,
  });
}
