"use client";

export default function FloatingIA() {
  return (
    <a
      href="https://iadrogarias.com.br/fv"
      target="_blank"
      rel="noreferrer"
      className="fixed bottom-6 right-6 z-50 group"
    >
      <div className="flex items-center gap-3 rounded-full border border-[#d4af37]/30 bg-black/70 px-4 py-3 backdrop-blur shadow-[0_10px_30px_rgba(0,0,0,0.4)] transition hover:scale-105 hover:border-[#d4af37]/60">
        
        <span className="text-xs text-zinc-300 group-hover:text-[#d4af37] transition">
          Farmácia Online
        </span>

        <span className="text-[#d4af37] text-sm">💊</span>
      </div>
    </a>
  );
}