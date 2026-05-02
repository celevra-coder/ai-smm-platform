"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";

type SelectedCalendarItemPayload = {
  businessType?: string;
  platform?: string;
  period?: string;
  frequency?: string;
  tone?: string;
  notes?: string;
  item?: {
    day?: string;
    title?: string;
    format?: string;
    description?: string;
  };
};

type GeneratedPostOption = {
  id: string;
  title: string;
  body: string;
  hashtags: string;
};

type VideoWorkspacePayload = {
  source?: "brand-post" | "quick-flow" | "manual";
  user_request?: string;
  brand_profile?: {
    brand_name?: string;
    brand_description?: string;
  };
  selected_post?: {
    id?: string;
    headline?: string;
    caption?: string;
    raw_text?: string;
  };
};

const WORKSPACE_STORAGE_KEY = "ai_smm_video_workspace_v1";

export default function ContentPostsPage() {
  const [selectedData, setSelectedData] =
    useState<SelectedCalendarItemPayload | null>(null);
  const [postOptions, setPostOptions] = useState<GeneratedPostOption[]>([]);
  const [selectedPostId, setSelectedPostId] = useState<string>("");
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [message, setMessage] = useState("");

    const handleSelectPost = (post: GeneratedPostOption) => {
    try {
      localStorage.setItem(
        "ai_smm_selected_post",
        JSON.stringify({
          ...selectedData,
          post,
        })
      );

      const workspacePayload: VideoWorkspacePayload = {
        source: "brand-post",
        user_request: selectedData?.notes || selectedData?.item?.description || "",
        brand_profile: {
          brand_name: selectedData?.businessType || "",
          brand_description:
            selectedData?.notes || selectedData?.item?.description || "",
        },
        selected_post: {
          id: post.id,
          headline: selectedData?.item?.title || post.title,
          caption: post.body,
          raw_text: [post.body, post.hashtags].filter(Boolean).join("\n\n"),
        },
      };

      localStorage.setItem(
        WORKSPACE_STORAGE_KEY,
        JSON.stringify(workspacePayload)
      );

      setSelectedPostId(post.id);
    } catch (err) {
      console.error("Failed to save selected post:", err);
    }
  };
      useEffect(() => {
    const run = async () => {
      try {
        const stored = localStorage.getItem("ai_smm_selected_calendar_item");
        if (!stored) return;

        const parsed = JSON.parse(stored) as SelectedCalendarItemPayload;
        setSelectedData(parsed);
        setLoadingPosts(true);
        setMessage("");

        const supabase = createClient();

const {
  data: { session },
} = await supabase.auth.getSession();

const accessToken = session?.access_token;

if (!accessToken) {
  window.location.href = "/login";
  return;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Липсват Supabase environment variables.");
}

        const toneMap: Record<string, "soft" | "luxury" | "aggressive"> = {
          "Професионален": "soft",
          "Приятелски": "soft",
          "Премиум": "luxury",
          "Продажбен": "aggressive",
          "Образователен": "soft",
        };

        const businessLabel = parsed.businessType?.trim() || "бизнес";
        const topicTitle = parsed.item?.title?.trim() || "избраната тема";
        const topicDescription = parsed.item?.description?.trim() || "";
        const topicFormat = parsed.item?.format?.trim() || "";
        const platformLabel = parsed.platform?.trim() || "Instagram";
        const periodLabel = parsed.period?.trim() || "";
        const frequencyLabel = parsed.frequency?.trim() || "";
        const notesLabel = parsed.notes?.trim() || "";

let activeBrandPhone = "";

try {
  const savedBrand = localStorage.getItem("active_brand_profile");
  const parsedBrand = savedBrand ? JSON.parse(savedBrand) : null;
  activeBrandPhone = parsedBrand?.phone?.trim() || "";
} catch {
  activeBrandPhone = "";
}

const selectedTone = toneMap[parsed.tone || "Професионален"] || "soft";

                const userRequest = [
          `Напиши 3 различни готови поста на български за ${businessLabel}.`,
          `Темата е: ${topicTitle}.`,
          topicDescription ? `Контекст на темата: ${topicDescription}.` : "",
          topicFormat ? `Предпочитан формат: ${topicFormat}.` : "",
          `Платформа: ${platformLabel}.`,
          periodLabel ? `Период на календара: ${periodLabel}.` : "",
          frequencyLabel ? `Честота: ${frequencyLabel}.` : "",
          notesLabel ? `Допълнителни бележки: ${notesLabel}.` : "",
          activeBrandPhone ? `Телефон за контакт: ${activeBrandPhone}.` : "",
          "Постовете да са готови за публикуване, а не инструкции към клиента.",
          "Да не обясняват какво да се напише, а да бъдат самият готов текст.",
          "Да бъдат различни един от друг като hook, структура и звучене.",
          "Да са съобразени с темата и бизнеса, не шаблонни.",
          "Когато темата позволява, направи поне 1 от 3-те варианта образователен пост.",
"Образователният пост трябва да обяснява полезно нещо на аудиторията: грешка, мит, процес, критерий за избор, често задаван въпрос или практичен съвет.",
"Образователният пост не трябва да продава агресивно, а да изгражда доверие чрез стойност.",
"За професионални обучения пиши за умения, практика, реализация, грешки при избор на курс и какво може да прави човек след обучението.",
"За технически/специализирани услуги пиши с обяснение на процеса, проблема, риска и ползата от правилна диагностика.",
          "Използвай САМО факти, детайли и конкретика, които са изрично дадени в тази заявка.",
          "Ако няма подадени град, район, адрес или локация, НЕ добавяй никакви градове, райони, адреси или местоположения.",
          "Не измисляй адреси, телефони, цени, оферти, срокове, локации или други конкретни данни.",
          "Ако липсва конкретна информация, остави текста общ, но естествен и професионален.",
          "Не добавяй примерни градове като София, Пловдив, Варна, Бургас и други, освен ако не са изрично дадени.",
        ]
          .filter(Boolean)
          .join("\n");

        const response = await fetch(
          `${supabaseUrl}/functions/v1/generate-brand-content`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: supabaseAnonKey,
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
  source: "brand_post",
  brand_profile: {
  brand_name: businessLabel,
  brand_description: notesLabel || topicDescription || "",
  phone: activeBrandPhone,
},
  user_request: userRequest,
  tone: selectedTone,
}),
          }
        );

        const rawText = await response.text();

        let data: any = {};
        try {
          data = rawText ? JSON.parse(rawText) : {};
        } catch {
          throw new Error(rawText || "Невалиден отговор от сървъра.");
        }

        if (!response.ok || !data?.success) {
          throw new Error(data?.error || "Неуспешно генериране на постове.");
        }

        const variations = Array.isArray(data?.variations) ? data.variations : [];

        const generated: GeneratedPostOption[] = variations.map(
          (variation: any, index: number) => ({
            id: `post-${index + 1}`,
            title: `Вариант ${index + 1}`,
            body:
              typeof variation?.post_text === "string"
                ? variation.post_text
                : "",
            hashtags:
              typeof variation?.hashtags === "string"
                ? variation.hashtags
                : "",
          })
        );

        setPostOptions(generated);
      } catch (error) {
        console.error("Failed to load generated posts:", error);
        setMessage(
          error instanceof Error
            ? error.message
            : "Неуспешно генериране на постове."
        );
      } finally {
        setLoadingPosts(false);
      }
    };

    void run();
  }, []);

  return (
  <main className="min-h-screen bg-[#f5f1ec] px-4 py-8 text-neutral-900 md:px-6 md:py-10">
    <div className="mx-auto max-w-6xl">
      <section className="rounded-[28px] border border-black/10 bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.08)] md:p-8">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[20px] border border-black/10 bg-[#fcfaf7] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500">
              Ден / слот
            </p>
            <p className="mt-2 text-sm font-semibold leading-[1.5] text-neutral-900">
              {selectedData?.item?.day || "—"}
            </p>
          </div>

          <div className="rounded-[20px] border border-black/10 bg-[#fcfaf7] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500">
              Заглавие
            </p>
            <p className="mt-2 text-sm font-semibold leading-[1.5] text-neutral-900">
              {selectedData?.item?.title || "—"}
            </p>
          </div>

          <div className="rounded-[20px] border border-black/10 bg-[#fcfaf7] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500">
              Формат
            </p>
            <p className="mt-2 text-sm font-semibold leading-[1.5] text-neutral-900">
              {selectedData?.item?.format || "—"}
            </p>
          </div>

          <div className="rounded-[20px] border border-black/10 bg-[#fcfaf7] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500">
              Описание
            </p>
            <p className="mt-2 text-sm leading-[1.6] text-neutral-700">
              {selectedData?.item?.description || "—"}
            </p>
          </div>
        </div>

        <div className="mt-8">
          {loadingPosts ? (
            <div className="rounded-[20px] border border-dashed border-black/10 bg-[#fcfaf7] p-6 text-center">
              <p className="text-[18px] font-bold text-neutral-900">
                Генерираме 3 варианта на пост...
              </p>
              <p className="mt-2 text-sm leading-[1.7] text-neutral-600">
                Подготвяме текстове според избраната тема, бизнес и тон.
              </p>
            </div>
          ) : null}

          {!loadingPosts && message ? (
            <div className="rounded-[20px] border border-black/10 bg-[#fcfaf7] p-4 text-sm font-medium text-neutral-700">
              {message}
            </div>
          ) : null}

          {!loadingPosts && postOptions.length ? (
            <div className="grid gap-5 xl:grid-cols-3">
              {postOptions.map((post) => {
                const isSelected = selectedPostId === post.id;

                return (
                  <div
                    key={post.id}
                    className={`group flex h-full flex-col rounded-[24px] border p-5 transition duration-200 ${
                      isSelected
                        ? "border-neutral-950 bg-[#efe7de] shadow-[0_18px_40px_rgba(0,0,0,0.10)]"
                        : "border-black/10 bg-[#fcfaf7] shadow-[0_10px_30px_rgba(0,0,0,0.06)] hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(0,0,0,0.10)]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[18px] font-black text-neutral-950">
                        {post.title}
                      </p>

                      {isSelected ? (
                        <span className="inline-flex rounded-full bg-neutral-950 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-white">
                          Избран
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-4 flex-1 whitespace-pre-line text-sm leading-[1.8] text-neutral-700">
                      {post.body}
                    </div>

                    <div className="mt-4 rounded-[16px] bg-white px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500">
                        Хаштагове
                      </p>
                      <p className="mt-1 text-sm font-semibold text-neutral-800">
                        {post.hashtags || "—"}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSelectPost(post)}
                      className={`mt-4 rounded-[18px] px-5 py-3 text-sm font-semibold transition duration-200 ${
                        isSelected
                          ? "bg-neutral-900 text-white"
                          : "bg-neutral-950 text-white hover:scale-[1.02] hover:opacity-95"
                      }`}
                    >
                      {isSelected ? "Постът е избран" : "Избери този пост"}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : null}

          {!loadingPosts && !postOptions.length ? (
            <div className="rounded-[20px] border border-dashed border-black/10 bg-[#fcfaf7] p-6 text-center">
              <p className="text-[18px] font-bold text-neutral-900">
                Няма заредена идея
              </p>
              <p className="mt-2 text-sm leading-[1.7] text-neutral-600">
                Върни се в контент календара и избери тема, по която да напишем
                пост.
              </p>
            </div>
          ) : null}
        </div>

        {!loadingPosts && postOptions.length ? (
          <div className="mt-8 flex justify-center">
            {selectedPostId ? (
              <Link
                href="/dashboard/brand-studio"
                className="inline-flex items-center justify-center rounded-[20px] bg-neutral-950 px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Продължи към Brand Studio
              </Link>
            ) : (
              <button
                type="button"
                disabled
                className="inline-flex items-center justify-center rounded-[20px] bg-neutral-300 px-6 py-3 text-sm font-semibold text-neutral-600"
              >
                Избери пост, за да продължиш
              </button>
            )}
          </div>
        ) : null}
      </section>
    </div>
  </main>
);
}