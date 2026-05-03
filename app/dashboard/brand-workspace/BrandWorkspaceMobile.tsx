"use client";

type ToneOption = "soft" | "luxury" | "aggressive";

type BrandProfile = {
  id?: string;
  brand_name: string;
  business_address?: string | null;
  phone?: string | null;
  brand_description?: string | null;
  preferred_colors?: string | null;
  logo_url?: string | null;
};

type BrandVariation = {
  post_text?: string;
  hashtags?: string;
};

type Props = {
  brandProfile: BrandProfile | null;
  userRequest: string;
  setUserRequest: (value: string) => void;
  tone: ToneOption;
  setTone: (value: ToneOption) => void;
  toneOptions: {
    value: ToneOption;
    label: string;
    description: string;
  }[];
  promoHelperMessage: string;
  promoPhone: string;
  setPromoPhone: (value: string) => void;
  promoAddress: string;
  setPromoAddress: (value: string) => void;
  variations: BrandVariation[];
  selectedVariationIndex: number | null;
  setSelectedVariationIndex: (value: number) => void;
  selectedVariation: BrandVariation | null;
  loading: boolean;
  error: string;
  copyMessage: string;
  onGenerate: () => void;
  onCopyText: () => void;
  onOpenVideoWorkspace: () => void;
};

export default function BrandWorkspaceMobile({
  brandProfile,
  userRequest,
  setUserRequest,
  tone,
  setTone,
  toneOptions,
  promoHelperMessage,
  promoPhone,
  setPromoPhone,
  promoAddress,
  setPromoAddress,
  variations,
  selectedVariationIndex,
  setSelectedVariationIndex,
  selectedVariation,
  loading,
  error,
  copyMessage,
  onGenerate,
  onCopyText,
  onOpenVideoWorkspace,
}: Props) {
  return (
    <main className="min-h-screen bg-[#f5f1ec] px-3 py-4 text-black">
      <section className="rounded-[26px] bg-white p-4 shadow-sm">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400">
          Brand Workspace
        </p>

        <h1 className="mt-2 text-[28px] font-black leading-none tracking-[-0.04em]">
          Brand posts
        </h1>

        <p className="mt-2 text-xs leading-5 text-neutral-500">
          Създай текстове за пост по активния си бранд.
        </p>
      </section>

      {!brandProfile ? (
        <section className="mt-3 rounded-[22px] border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          Няма активен brand profile. Върни се и избери бизнес.
        </section>
      ) : (
        <>
          <section className="mt-3 rounded-[26px] bg-white p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#f7f3ee]">
                {brandProfile.logo_url ? (
                  <img
                    src={brandProfile.logo_url}
                    alt={brandProfile.brand_name}
                    className="h-10 w-10 object-contain"
                  />
                ) : (
                  <span className="text-xs font-black text-neutral-400">AI</span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-700">
                  Активен бранд
                </p>
                <h2 className="mt-1 truncate text-xl font-black">
                  {brandProfile.brand_name}
                </h2>
                {brandProfile.brand_description ? (
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-neutral-500">
                    {brandProfile.brand_description}
                  </p>
                ) : null}
              </div>
            </div>

            <details className="mt-3 rounded-[18px] bg-[#f7f3ee] p-3">
              <summary className="cursor-pointer text-sm font-black">
                Данни за бранда
              </summary>

              <div className="mt-3 grid gap-2 text-xs text-neutral-700">
                {brandProfile.business_address ? (
                  <p>
                    <span className="font-bold">Адрес:</span>{" "}
                    {brandProfile.business_address}
                  </p>
                ) : null}

                {brandProfile.phone ? (
                  <p>
                    <span className="font-bold">Телефон:</span>{" "}
                    {brandProfile.phone}
                  </p>
                ) : null}

                {brandProfile.preferred_colors ? (
                  <p>
                    <span className="font-bold">Цветове:</span>{" "}
                    {brandProfile.preferred_colors}
                  </p>
                ) : null}
              </div>
            </details>
          </section>

          <section className="mt-3 rounded-[26px] bg-white p-4 shadow-sm">
            <label className="block">
              <span className="mb-2 block text-sm font-black">
                Какво искаш да създадем?
              </span>
              <textarea
                value={userRequest}
                onChange={(e) => setUserRequest(e.target.value)}
                rows={5}
                placeholder="Напр. Instagram пост за промоция, нова услуга, оферта..."
                className="w-full rounded-[20px] border border-black/10 bg-[#f7f3ee] px-4 py-3 text-sm leading-6 outline-none"
              />
            </label>

            {promoHelperMessage ? (
              <details className="mt-3 rounded-[18px] border border-amber-200 bg-amber-50 p-3">
                <summary className="cursor-pointer text-sm font-black text-amber-900">
                  Промо данни
                </summary>

                <p className="mt-3 text-xs leading-5 text-amber-800">
                  {promoHelperMessage}
                </p>

                <div className="mt-3 grid gap-2">
                  <input
                    value={promoPhone}
                    onChange={(e) => setPromoPhone(e.target.value)}
                    placeholder="Телефон"
                    className="w-full rounded-[16px] border border-black/10 bg-white px-3 py-3 text-sm outline-none"
                  />

                  <input
                    value={promoAddress}
                    onChange={(e) => setPromoAddress(e.target.value)}
                    placeholder="Адрес"
                    className="w-full rounded-[16px] border border-black/10 bg-white px-3 py-3 text-sm outline-none"
                  />
                </div>
              </details>
            ) : null}

            <details className="mt-3 rounded-[18px] bg-[#f7f3ee] p-3">
              <summary className="cursor-pointer text-sm font-black">
                Избери стил
              </summary>

              <div className="mt-3 grid gap-2">
                {toneOptions.map((option) => {
                  const isActive = tone === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setTone(option.value)}
                      className={`rounded-[18px] border px-3 py-3 text-left ${
                        isActive
                          ? "border-black bg-black text-white"
                          : "border-black/10 bg-white text-black"
                      }`}
                    >
                      <p className="text-sm font-black">{option.label}</p>
                      <p
                        className={`mt-1 text-xs leading-5 ${
                          isActive ? "text-white/70" : "text-neutral-500"
                        }`}
                      >
                        {option.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </details>

            <button
              type="button"
              onClick={onGenerate}
              disabled={loading}
              className="mt-4 w-full rounded-[20px] bg-black px-5 py-4 text-sm font-black text-white disabled:opacity-60"
            >
              {loading ? "Генериране..." : "Генерирай 3 варианта"}
            </button>

            {loading ? (
              <div className="mt-3 rounded-[18px] bg-[#f7f3ee] px-4 py-3 text-xs font-semibold text-neutral-600">
                Генерираме 3 варианта...
              </div>
            ) : null}

            {error ? (
              <div className="mt-3 rounded-[18px] border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
                {error}
              </div>
            ) : null}

            {copyMessage ? (
              <div className="mt-3 rounded-[18px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700">
                {copyMessage}
              </div>
            ) : null}
          </section>

          {variations.length ? (
            <section className="mt-3 rounded-[26px] bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-[22px] font-black tracking-[-0.03em]">
                  Варианти
                </h2>
                <span className="rounded-full bg-[#f7f3ee] px-3 py-1 text-xs font-bold text-neutral-600">
                  {variations.length}
                </span>
              </div>

              <div className="mt-4 grid gap-3">
                {variations.map((variation, index) => {
                  const isSelected = selectedVariationIndex === index;

                  return (
                    <details
                      key={index}
                      open={isSelected}
                      className={`rounded-[22px] border p-4 ${
                        isSelected
                          ? "border-black bg-[#e8ded1]"
                          : "border-black/10 bg-[#f7f3ee]"
                      }`}
                    >
                      <summary className="cursor-pointer list-none">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-black">
                            Вариант {index + 1}
                          </p>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              setSelectedVariationIndex(index);
                            }}
                            className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                              isSelected
                                ? "bg-black text-white"
                                : "bg-white text-black"
                            }`}
                          >
                            {isSelected ? "Избран" : "Избери"}
                          </button>
                        </div>
                      </summary>

                      <p className="mt-3 whitespace-pre-line text-sm leading-6 text-neutral-800">
                        {variation.post_text || "Няма генериран текст."}
                      </p>

                      {variation.hashtags ? (
                        <div className="mt-3 rounded-[18px] bg-white/80 p-3">
                          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-400">
                            Хаштагове
                          </p>
                          <p className="whitespace-pre-line text-xs leading-5 text-neutral-600">
                            {variation.hashtags}
                          </p>
                        </div>
                      ) : null}
                    </details>
                  );
                })}
              </div>
            </section>
          ) : null}

          {selectedVariation ? (
            <section className="mt-3 rounded-[26px] bg-white p-4 shadow-sm">
              <h2 className="text-[22px] font-black tracking-[-0.03em]">
                Финален избор
              </h2>

              <div className="mt-3 rounded-[20px] bg-[#f7f3ee] p-4">
                <p className="whitespace-pre-line text-sm leading-6 text-neutral-800">
                  {selectedVariation.post_text || "Няма текст."}
                </p>
              </div>

              {selectedVariation.hashtags ? (
                <div className="mt-3 rounded-[20px] bg-[#f7f3ee] p-4">
                  <p className="whitespace-pre-line text-xs leading-5 text-neutral-600">
                    {selectedVariation.hashtags}
                  </p>
                </div>
              ) : null}

              <div className="mt-4 grid gap-2">
                <button
                  type="button"
                  onClick={onCopyText}
                  className="rounded-[18px] border border-black/10 bg-white px-4 py-3 text-sm font-bold"
                >
                  Копирай текста
                </button>

                <button
                  type="button"
                  onClick={onOpenVideoWorkspace}
                  className="rounded-[18px] bg-black px-4 py-3 text-sm font-bold text-white"
                >
                  Отвори Brand Studio
                </button>
              </div>
            </section>
          ) : null}
        </>
      )}
    </main>
  );
}