"use client";


type Props = {
  generatedBannerUrl: string;
  brandName: string;
  headlineText: string;
  subtextText?: string;
  phone?: string;
  logoUrl?: string;
};

export default function BrandStudioDesktopBanner({
  generatedBannerUrl,
  brandName,
  headlineText,
  subtextText,
  phone,
  logoUrl,
}: Props) {
  return (
    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl">
      <img
        src={generatedBannerUrl}
        alt="Generated banner"
        className="absolute inset-0 h-full w-full object-cover"
      />

      <div className="absolute inset-0 bg-black/35" />

      {logoUrl ? (
        <img
          src={logoUrl}
          alt="Logo"
          className="absolute right-4 top-4 z-20 h-12 w-12 rounded-xl object-contain p-1"
          style={{
            background: "rgba(255,255,255,0.2)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
          }}
        />
      ) : null}

      <div className="absolute inset-0 flex flex-col justify-center px-7 py-4 text-center text-white">
        <div>
          <div
            style={{
              fontFamily: '"Times New Roman", Georgia, serif',
              fontStyle: "italic",
              fontSize: "34px",
              fontWeight: 700,
              lineHeight: 1,
              letterSpacing: "0.3px",
              textShadow: "0 3px 14px rgba(0,0,0,0.75)",
            }}
          >
            {brandName}
          </div>

          <div className="mx-auto mt-3 h-px w-[170px] bg-white/70" />
        </div>

        <div className="flex flex-1 flex-col items-center justify-center -mt-5">
          <div
            style={{
              maxWidth: "330px",
              fontSize: "19px",
              fontWeight: 900,
              lineHeight: 1.15,
              textShadow: "0 3px 12px rgba(0,0,0,0.8)",
            }}
          >
            {headlineText}
          </div>

          {subtextText ? (
            <div
              style={{
                marginTop: "16px",
                maxWidth: "320px",
                fontSize: "14px",
                fontWeight: 500,
                lineHeight: 1.3,
                textShadow: "0 3px 12px rgba(0,0,0,0.8)",
              }}
            >
              {subtextText}
            </div>
          ) : null}
        </div>

        {phone ? (
          <div className="mx-auto mb-6 rounded-full bg-black/35 px-9 py-2.5 text-[18px] font-black leading-none text-white shadow-2xl ring-1 ring-white/20 backdrop-blur-md">
            {phone}
          </div>
        ) : null}
      </div>
    </div>
  );
}