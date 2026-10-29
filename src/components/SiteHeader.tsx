import { Link, useLocation } from "@tanstack/react-router";
import { ArrowLeft, Clock, Menu, ShieldCheck, X, HelpCircle, FileCheck, Lock } from "lucide-react";
import { useEffect, useState } from "react";
import logoBolsaFamilia from "@/assets/logo-bolsa-familia.png";

interface SiteHeaderProps {
  onBack?: (() => void) | undefined;
  canBack?: boolean | undefined;
  step?: number | undefined;
  totalSteps?: number | undefined;
  timeRemaining?: number | undefined;
  stepLabel?: string | undefined;
  showProgress?: boolean | undefined;
  progressPercent?: number | undefined;
}

export function SiteHeader({
  onBack,
  canBack = false,
  step,
  totalSteps = 4,
  timeRemaining,
  stepLabel,
  showProgress = false,
  progressPercent = 0,
}: SiteHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  // Fecha o menu ao trocar de tela/rota
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  return (
    <>
      {/* Overlay invisível para fechar menu ao clicar fora */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-20"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}
      <header className="sticky top-0 z-30 border-b border-[#A50D24] bg-[#C8102E] text-white shadow-md">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-2.5 sm:py-3">
        {/* Lado Esquerdo: Voltar + Logo do Projeto */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {canBack && onBack ? (
            <button
              type="button"
              onClick={onBack}
              aria-label="Voltar etapa"
              className="grid size-9 sm:size-10 place-items-center rounded-xl bg-white/10 text-white transition-all hover:bg-white/20 active:scale-95 focus-visible:outline-2 focus-visible:outline-white"
            >
              <ArrowLeft className="size-5" />
            </button>
          ) : (
            <Link
              to="/"
              aria-label="Ir para o início"
              className="grid size-9 sm:size-10 place-items-center rounded-xl bg-white/10 text-white transition-all hover:bg-white/20 active:scale-95 focus-visible:outline-2 focus-visible:outline-white"
            >
              <ArrowLeft className="size-5" />
            </Link>
          )}

          {/* Logo do Bolsa Família com fundo branco nítido e proporções preservadas */}
          <Link to="/" className="flex items-center gap-2 sm:gap-2.5 group">
            <div className="flex h-8 sm:h-9 items-center rounded-lg bg-white px-2 py-0.5 shadow-sm transition group-hover:opacity-95">
              <img
                src={logoBolsaFamilia}
                alt="Programa Bolsa Família"
                className="h-5 sm:h-6 w-auto max-w-[120px] sm:max-w-[130px] object-contain"
                onError={(e) => {
                  if (e.currentTarget.src !== "/logo-bolsa-familia.png") {
                    e.currentTarget.src = "/logo-bolsa-familia.png";
                  }
                }}
              />
            </div>

            <div className="leading-tight">
              <span className="block text-sm sm:text-base font-extrabold tracking-tight text-white">
                SEU Benefício
              </span>
              <span className="block text-[10px] font-bold tracking-wider text-white/80 uppercase">
                Edição 2027
              </span>
            </div>
          </Link>
        </div>

        {/* Lado Direito: Status / Progresso e Menu Responsivo */}
        <div className="flex items-center gap-2 sm:gap-3">
          {step !== undefined && totalSteps ? (
            <div className="text-right text-xs">
              <div className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] sm:text-xs font-bold text-white">
                Etapa {step} de {totalSteps}
              </div>
              {timeRemaining !== undefined && (
                <div className="mt-0.5 hidden sm:flex items-center justify-end gap-1 text-[11px] text-white/80">
                  <Clock className="size-3" /> ~{timeRemaining}s restantes
                </div>
              )}
            </div>
          ) : stepLabel ? (
            <div className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-white">
              <ShieldCheck className="size-3.5 text-white" />
              {stepLabel}
            </div>
          ) : (
            <div className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white">
              <Lock className="size-3.5" /> Portal Seguro 256-bit
            </div>
          )}

          {/* Botão de Menu Auxiliar */}
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Abrir menu de navegação"
            className="grid size-9 place-items-center rounded-xl bg-white/10 text-white transition-all hover:bg-white/20 active:scale-95 focus-visible:outline-2 focus-visible:outline-white"
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Menu Responsivo Dropdown */}
      {menuOpen && (
        <div className="border-t border-[#A50D24] bg-[#A50D24] px-4 py-3 text-white transition-all">
          <div className="mx-auto flex max-w-3xl flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs sm:text-sm">
            <div className="flex flex-wrap gap-4 font-semibold">
              <Link
                to="/"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-1.5 py-1 text-white hover:text-white/80"
              >
                <FileCheck className="size-4" /> Início / Triagem
              </Link>
              <Link
                to="/pagamento"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-1.5 py-1 text-white hover:text-white/80"
              >
                <Lock className="size-4" /> Emissão Cadastral PIX
              </Link>
            </div>
            <div className="flex items-center gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/20 text-white/90 text-xs">
              <span className="flex items-center gap-1">
                <ShieldCheck className="size-3.5 text-white" /> Dados Protegidos (LGPD)
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <HelpCircle className="size-3.5 text-white" /> Atendimento 24h
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Barra de Progresso do Cabeçalho */}
      {showProgress && (
        <div
          className="h-1.5 w-full bg-[#A50D24]"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progressPercent)}
        >
          <div
            className="h-full bg-white transition-all duration-500 ease-out shadow-sm"
            style={{ width: `${Math.max(4, Math.min(100, progressPercent))}%` }}
          />
        </div>
      )}
    </header>
    </>
  );
}
