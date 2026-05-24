"use client";

import type { Dispatch, SetStateAction } from "react";

type CalendarItem = {
  day: string;
  title: string;
  format: string;
  description: string;
  postType?: "educational" | "promo" | "trust" | "authority" | "general";
};

type Props = {
  businessType: string;
  setBusinessType: Dispatch<SetStateAction<string>>;
  specificServices: string;
  setSpecificServices: Dispatch<SetStateAction<string>>;
  platform: string;
  setPlatform: Dispatch<SetStateAction<string>>;
  period: string;
  setPeriod: Dispatch<SetStateAction<string>>;
  frequency: string;
  setFrequency: Dispatch<SetStateAction<string>>;
  tone: string;
  setTone: Dispatch<SetStateAction<string>>;
  notes: string;
  setNotes: Dispatch<SetStateAction<string>>;
  calendarItems: CalendarItem[];
  isGeneratingCalendar: boolean;
  isCalendarSaved: boolean;
  promoRedirectMessage: string;
  calendarHelperMessage: string;
  onGenerateCalendar: () => void;
  onSaveCalendar: () => void;
  onClearCalendar: () => void;
  onWritePost: (item: CalendarItem) => void;
};

export default function EnglishContentCalendarMobile({
  businessType,
  setBusinessType,
  specificServices,
  setSpecificServices,
  platform,
  setPlatform,
  period,
  setPeriod,
  frequency,
  setFrequency,
  tone,
  setTone,
  notes,
  setNotes,
  calendarItems,
  isGeneratingCalendar,
  isCalendarSaved,
  promoRedirectMessage,
  calendarHelperMessage,
  onGenerateCalendar,
  onSaveCalendar,
  onClearCalendar,
  onWritePost,
}: Props) {
  return (
    <div className="md:hidden">
      <section className="rounded-[28px] bg-white p-5 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-neutral-500">
          Content calendar
        </p>

        <h1 className="mt-3 text-[30px] font-black leading-[1.02] tracking-[-0.04em] text-neutral-950">
          Plan social media content for your business
        </h1>

        <p className="mt-4 text-sm leading-7 text-neutral-600">
          Add your business, services and style. AI will create post ideas by
          day, format and topic.
        </p>
      </section>

      <section className="mt-5 rounded-[28px] bg-white p-5 shadow-sm">
        <h2 className="text-xl font-black text-neutral-950">Settings</h2>

        <div className="mt-5 space-y-4">
          <MobileInput
            label="Business type"
            value={businessType}
            onChange={setBusinessType}
            placeholder="Example: hair salon"
          />

          <MobileInput
            label="Services / offers"
            value={specificServices}
            onChange={setSpecificServices}
            placeholder="Example: haircuts, coloring, hair therapy"
          />

          <MobileSelect
            label="Platform"
            value={platform}
            onChange={setPlatform}
            options={["Instagram", "Facebook", "Instagram + Facebook"]}
          />

          <MobileSelect
            label="Period"
            value={period}
            onChange={setPeriod}
            options={["7 days", "14 days", "30 days"]}
          />

          <MobileSelect
            label="Frequency"
            value={frequency}
            onChange={setFrequency}
            options={[
              "3 posts per week",
              "4 posts per week",
              "5 posts per week",
              "Every day",
            ]}
          />

          <MobileSelect
            label="Tone"
            value={tone}
            onChange={setTone}
            options={[
              "Professional",
              "Friendly",
              "Premium",
              "Sales-focused",
              "Educational",
            ]}
          />

          <label className="block">
            <span className="mb-2 block text-sm font-bold text-neutral-800">
              Notes / goals
            </span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={5}
              placeholder="Example: more inquiries, trust, local positioning, seasonal offers..."
              className="w-full rounded-2xl border border-black/10 bg-[#fcfaf7] px-4 py-3 text-[15px] outline-none focus:border-black/30"
            />
          </label>
        </div>

        <button
          type="button"
          onClick={onGenerateCalendar}
          disabled={isGeneratingCalendar}
          className="mt-6 flex w-full items-center justify-center rounded-full bg-neutral-950 px-5 py-4 text-sm font-bold text-white disabled:opacity-60"
        >
          {isGeneratingCalendar ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Generating...
            </span>
          ) : (
            "Generate calendar"
          )}
        </button>
      </section>

      <section className="mt-5 rounded-[28px] bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-neutral-950">Result</h2>
            <p className="mt-1 text-sm text-neutral-500">
              {calendarItems.length
                ? `${calendarItems.length} content ideas`
                : "Your calendar will appear here"}
            </p>
          </div>

          {calendarItems.length ? (
            <button
              type="button"
              onClick={onClearCalendar}
              className="rounded-full border border-black/10 px-4 py-2 text-xs font-bold text-neutral-700"
            >
              Clear
            </button>
          ) : null}
        </div>

        {promoRedirectMessage ? (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
            {promoRedirectMessage}
          </div>
        ) : null}

        {calendarHelperMessage ? (
          <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-800">
            {calendarHelperMessage}
          </div>
        ) : null}

        <div className="relative mt-5">
          {isGeneratingCalendar ? (
            <div className="rounded-2xl bg-[#fcfaf7] p-5 text-center text-sm font-bold text-neutral-700">
              AI is generating your calendar...
            </div>
          ) : null}

          {calendarItems.length ? (
            <div className="space-y-4">
              {calendarItems.map((item) => (
                <article
                  key={`${item.day}-${item.title}`}
                  className="rounded-[24px] border border-black/10 bg-[#fcfaf7] p-5"
                >
                  <div className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-black uppercase tracking-[0.08em] text-neutral-700">
                    {item.day}
                  </div>

                  <h3 className="mt-4 text-lg font-black leading-snug text-neutral-950">
                    {item.title}
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-neutral-600">
                    {item.description}
                  </p>

                  <div className="mt-4 inline-flex rounded-full border border-black/10 bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-neutral-600">
                    {item.format}
                  </div>

                  <button
                    type="button"
                    onClick={() => onWritePost(item)}
                    className="mt-5 w-full rounded-full bg-neutral-950 px-4 py-3 text-sm font-bold text-white"
                  >
                    Create post
                  </button>
                </article>
              ))}

              <button
                type="button"
                onClick={onSaveCalendar}
                className="w-full rounded-full border border-black/10 bg-white px-5 py-4 text-sm font-bold text-neutral-900"
              >
                {isCalendarSaved ? "✔ Saved" : "Save calendar"}
              </button>
            </div>
          ) : (
            <div className="rounded-2xl bg-[#fcfaf7] p-4">
              <p className="text-sm font-bold text-neutral-900">
                Example posts
              </p>
              <ul className="mt-2 space-y-1 text-sm text-neutral-600">
                <li>• Introduce {businessType || "your business"}</li>
                <li>• Useful tip ({tone.toLowerCase()})</li>
                <li>• Offer / service highlight</li>
              </ul>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function MobileInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: Dispatch<SetStateAction<string>>;
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-neutral-800">
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-black/10 bg-[#fcfaf7] px-4 py-3 text-[15px] outline-none focus:border-black/30"
      />
    </label>
  );
}

function MobileSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: Dispatch<SetStateAction<string>>;
  options: string[];
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-neutral-800">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-black/10 bg-[#fcfaf7] px-4 py-3 text-[15px] outline-none focus:border-black/30"
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}