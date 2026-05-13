"use client";

type Props = {
  imageUrl: string;
  logoUrl: string;
  headline: string;
  subtext: string;
  offerBadge: string;
  supportLines: string[];
  phone: string;
};

export default function MobileBannerComposition({
  imageUrl,
  logoUrl,
  headline,
  subtext,
  offerBadge,
  supportLines,
  phone,
}: Props) {
  return (
    <div className="relative aspect-square w-full overflow-hidden bg-[#f5f1ec]">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt="Banner"
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-700" />
      )}

      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/28 to-black/10" />

      {logoUrl ? (
  <div className="absolute right-3 top-3 z-[60] flex h-[54px] min-w-[72px] items-center justify-center rounded-2xl border border-black/10 bg-white/95 px-3 py-2 shadow-lg">
    <img
      src={logoUrl}
      alt="Logo"
      className="max-h-[38px] max-w-[92px] object-contain"
    />
  </div>
) : null}

      <div className="relative z-10 flex h-full flex-col justify-center px-6 pt-10 text-white">
        <div className={logoUrl ? "max-w-[245px]" : "max-w-[315px]"}>
          {headline ? (
            <h3 className="text-[25px] font-black leading-[1.05] tracking-[-0.03em]">
              {headline}
            </h3>
          ) : null}

          {subtext ? (
            <p className="mt-3 text-[14px] font-semibold leading-[1.28] text-white/90">
              {subtext}
            </p>
          ) : null}

          {offerBadge ? (
  <div className="mt-4 inline-flex max-w-[210px] rounded-full bg-black/72 px-4 py-2 text-[12px] font-black leading-tight text-white shadow-lg">
    {offerBadge}
  </div>
) : null}

          {supportLines.length ? (
            <div className="mt-4 space-y-1.5">
              {supportLines.slice(0, 2).map((line, index) => (
                <p key={index} className="text-[12px] font-semibold leading-[1.25] text-white/90">
                  ✔️ {line}
                </p>
              ))}
            </div>
          ) : null}

          {phone ? (
            <div className="mt-6 inline-flex rounded-2xl bg-black/75 px-3.5 py-2 text-[13px] font-black text-white">
              📞 Обади се: {phone}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}