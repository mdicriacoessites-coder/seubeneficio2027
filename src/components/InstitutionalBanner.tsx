import logoBolsaFamilia from "@/assets/logo-bolsa-familia.png";
import { Sparkles, ShieldCheck, CheckCircle2 } from "lucide-react";

interface InstitutionalBannerProps {
  compact?: boolean;
}

export function InstitutionalBanner({ compact = false }: InstitutionalBannerProps) {
  return (
    <div className="relative mb-6 overflow-hidden rounded-2xl border border-[#E5E5E5] bg-white p-4 shadow-soft sm:p-5">
      {/* Detalhe sutil de borda superior em vermelho */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#C8102E] via-[#A50D24] to-[#C8102E]" />

      <div className="flex flex-col-reverse items-center justify-between gap-4 sm:flex-row sm:items-stretch">
        {/* Conteúdo Institucional */}
        <div className="flex-1 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#FCEBED] px-3 py-1 text-[11px] font-bold text-[#A50D24]">
            <Sparkles className="size-3.5 text-[#C8102E]" />
            PROGRAMA BOLSA FAMÍLIA
          </div>

          <h2 className="mt-2 text-lg font-black tracking-tight text-[#202020] sm:text-xl">
            Apoio e Regularização Cadastral para Famílias Brasileiras
          </h2>

          <p className="mt-1 text-xs sm:text-sm text-[#555555] leading-relaxed">
            Verifique as condições do seu benefício social em poucos minutos. Organize seus dados para evitar pendências no CadÚnico e garantir seus repasses mensais em 2027.
          </p>

          {!compact && (
            <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 sm:justify-start text-[11px] font-semibold text-[#202020]">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="size-3.5 text-[#C8102E]" /> Triagem rápida e simplificada
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="size-3.5 text-[#C8102E]" /> Consulta baseada no CadÚnico
              </span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="size-3.5 text-[#C8102E]" /> Confirmação digital imediata
              </span>
            </div>
          )}
        </div>

        {/* Local enviado pelo usuário: Card com a logo do Programa Bolsa Família */}
        <div className="flex shrink-0 items-center justify-center">
          <div className="group relative flex items-center justify-center rounded-2xl border border-[#E5E5E5] bg-white p-3 shadow-xs transition hover:border-[#C8102E]/30 min-w-[150px] min-h-[90px] sm:min-w-[180px] sm:min-h-[110px]">
            <img
              src={logoBolsaFamilia}
              alt="Programa Bolsa Família"
              className="h-16 sm:h-20 w-auto max-w-[160px] sm:max-w-[200px] object-contain drop-shadow-xs transition-transform duration-300 group-hover:scale-[1.02]"
              loading="eager"
              onError={(e) => {
                if (e.currentTarget.src !== "/logo-bolsa-familia.png") {
                  e.currentTarget.src = "/logo-bolsa-familia.png";
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
