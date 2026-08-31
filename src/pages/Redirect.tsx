import { useEffect, useState } from "react";

const WA_URL = import.meta.env.VITE_WA_URL || "https://chat.whatsapp.com/";

const Redirect = () => {
  const [countdown, setCountdown] = useState(1);

  // Rastreamento de clique (/api/track/click) removido desta rota — ela
  // escrevia na MESMA fila FIFO usada pelo quiz (TrackingService), e qualquer
  // acesso a "/" (bot de preview do Meta, link antigo, teste manual) podia
  // "furar a fila" na frente de uma resposta real do quiz, fazendo o
  // GroupJoinService atribuir o clique errado a quem entrasse no grupo em
  // seguida. Rota fica só com o redirect — sem campanha ativa apontando pra
  // cá, não precisa mais competir pela fila do quiz.
  useEffect(() => {
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
