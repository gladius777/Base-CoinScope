"use client";

type StatsCardProps = {
  title: string;
  children: React.ReactNode;
};

export function StatsCard({ title, children }: StatsCardProps) {
  return (
    <div
      className="relative overflow-hidden rounded-xl border border-white/[0.08] bg-gradient-to-b from-[#0F1420] via-[#172031] to-[#0F1420] px-3 py-4 text-center sm:rounded-2xl sm:px-5 sm:py-6"
      style={{
        boxShadow:
          "0 8px 24px -4px rgba(59, 130, 246, 0.25), inset 0 1px 0 0 rgba(255,255,255,0.06)",
      }}
    >
      {/* Bottom blue glow */}
      <div
        className="absolute inset-x-[15%] bottom-0 h-10 rounded-full opacity-80 sm:h-14"
        style={{
          background:
            "linear-gradient(to top, rgba(59, 130, 246, 0.5) 0%, rgba(59, 130, 246, 0.15) 40%, transparent 100%)",
          filter: "blur(12px)",
        }}
        aria-hidden
      />

      <p
        className="relative mb-2 text-xs font-medium sm:mb-3 sm:text-sm"
        style={{ color: "#93C5FD" }}
      >
        {title}
      </p>

      <div
        className="relative text-2xl font-bold tabular-nums sm:text-3xl md:text-4xl"
        style={{ color: "#ffffff" }}
      >
        {children}
      </div>
    </div>
  );
}
