import { useEffect, useState } from "react";

const WA_URL = import.meta.env.VITE_WA_URL || "https://chat.whatsapp.com/";

function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
  return null;
}

function trackClick() {
  const params = new URLSearchParams(window.location.search);
  const fbclid = params.get("fbclid");
  const utmSource = params.get("utm_source");
  const utmMedium = params.get("utm_medium");
  const utmCampaign = params.get("utm_campaign");
  const utmContent = params.get("utm_content");
  const utmTerm = params.get("utm_term");

  if (fbclid) localStorage.setItem("fbclid", fbclid);
  if (utmSource) localStorage.setItem("utm_source", utmSource);
  if (utmMedium) localStorage.setItem("utm_medium", utmMedium);
  if (utmCampaign) localStorage.setItem("utm_campaign", utmCampaign);
  if (utmContent) localStorage.setItem("utm_content", utmContent);
  if (utmTerm) localStorage.setItem("utm_term", utmTerm);
  if (!localStorage.getItem("click_id")) {
    localStorage.setItem("click_id", crypto.randomUUID());
  }

  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3002/api";
  const payload = {
    utmSource: utmSource || localStorage.getItem("utm_source") || undefined,
    utmMedium: utmMedium || localStorage.getItem("utm_medium") || undefined,
    utmCampaign: utmCampaign || localStorage.getItem("utm_campaign") || undefined,
    utmContent: utmContent || localStorage.getItem("utm_content") || undefined,
    utmTerm: utmTerm || localStorage.getItem("utm_term") || undefined,
    fbclid: fbclid || localStorage.getItem("fbclid") || undefined,
    fbc: getCookie("_fbc") || undefined,
    fbp: getCookie("_fbp") || undefined,
    clickId: localStorage.getItem("click_id") || undefined,
  };

  fetch(`${apiUrl}/track/click`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {});
}

const Redirect = () => {
  const [countdown, setCountdown] = useState(1);

  useEffect(() => {
    trackClick();

    const timer = setTimeout(() => {
      window.location.href = WA_URL;
    }, 1500);

    const tick = setInterval(() => {
      setCountdown((c) => Math.max(0, c - 1));
    }, 1000);

    return () => {
      clearTimeout(timer);
      clearInterval(tick);
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#0f0f0f] text-white">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-green-500 border-t-transparent" />
        <p className="text-lg font-medium text-gray-300">
          Redirecionando para o WhatsApp...
        </p>
        {countdown > 0 && (
          <p className="text-sm text-gray-500">em {countdown} segundo{countdown !== 1 ? "s" : ""}</p>
        )}
      </div>
      <a
        href={WA_URL}
        className="mt-4 text-sm text-green-400 underline underline-offset-4"
      >
        Clique aqui se não for redirecionado automaticamente
      </a>
    </div>
  );
};

export default Redirect;
