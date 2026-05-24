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
  locale?: string;
  item?: {
    day?: string;
    title?: string;
    format?: string;
    description?: string;
    postType?: "educational" | "promo" | "trust" | "authority" | "general";
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

export default function EnglishContentPostsPage() {
  const [selectedData, setSelectedData] =
    useState<SelectedCalendarItemPayload | null>(null);

  const [postOptions, setPostOptions] = useState<GeneratedPostOption[]>([]);
  const [selectedPostId, setSelectedPostId] = useState("");
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [message, setMessage] = useState("");

  const handleSelectPost = (post: GeneratedPostOption) => {
    try {
      localStorage.setItem(
        "ai_smm_selected_post",
        JSON.stringify({
          ...selectedData,
          post,
          locale: "en",
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
          window.location.href = "/en/login";
          return;
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseAnonKey) {
          throw new Error("Missing Supabase environment variables.");
        }

        const toneMap: Record<string, "soft" | "luxury" | "aggressive"> = {
          Professional: "soft",
          Friendly: "soft",
          Premium: "luxury",
          "Sales-focused": "aggressive",
          Educational: "soft",

          Професионален: "soft",
          Приятелски: "soft",
          Премиум: "luxury",
          Продажбен: "aggressive",
          Образователен: "soft",
        };

        const businessLabel = parsed.businessType?.trim() || "the business";
        const topicTitle = parsed.item?.title?.trim() || "the selected topic";
        const topicDescription = parsed.item?.description?.trim() || "";
        const topicFormat = parsed.item?.format?.trim() || "";
        const lowerFormat = topicFormat.toLowerCase();
        const postType = parsed.item?.postType || "general";

        const isEducational =
          postType === "educational" ||
          lowerFormat.includes("educational") ||
          lowerFormat.includes("tip") ||
          lowerFormat.includes("guide") ||
          lowerFormat.includes("how to") ||
          lowerFormat.includes("образовател");

        const isPromotional =
          postType === "promo" ||
          lowerFormat.includes("promo") ||
          lowerFormat.includes("promotion") ||
          lowerFormat.includes("offer") ||
          lowerFormat.includes("sales") ||
          lowerFormat.includes("discount") ||
          lowerFormat.includes("промо") ||
          lowerFormat.includes("оферта");

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

        const selectedTone = toneMap[parsed.tone || "Professional"] || "soft";

        const userRequest = [
          `LANGUAGE RULE: Write the entire response ONLY in English. Do not use Bulgarian words, Bulgarian phrases, Bulgarian hashtags or Bulgarian CTA text.`,
`Write 3 different ready-to-publish social media posts in English for ${businessLabel}.`,
          `Topic: ${topicTitle}.`,
          topicDescription ? `Topic context: ${topicDescription}.` : "",
          topicFormat ? `Preferred format: ${topicFormat}.` : "",
          `Platform: ${platformLabel}.`,
          periodLabel ? `Calendar period: ${periodLabel}.` : "",
          frequencyLabel ? `Publishing frequency: ${frequencyLabel}.` : "",
          notesLabel ? `Extra notes: ${notesLabel}.` : "",
          !isEducational && activeBrandPhone
            ? `Contact phone: ${activeBrandPhone}.`
            : "",

          "The posts must be complete final captions, ready to publish.",
"Every post body and every hashtag must be in English only.",
"Do not translate the topic into Bulgarian. Do not answer in Bulgarian even if the backend default language is Bulgarian.",
          "Do not explain what should be written. Write the actual post text.",
          "Make the 3 versions different in hook, structure and angle.",
          "Keep every post tightly focused on the selected topic. Do not drift into general advertising, clinic promotion, service selling or unrelated dental services.",
"Use the selected topic as the main subject of every post.",
"Do not replace a how-to educational topic with a promotional description of a professional service.",
"Write practical, useful information that directly answers the topic.",
"Avoid generic AI wording.",

          isEducational
            ? "All posts must be fully educational."
            : "When the topic allows, make at least 1 of the 3 versions educational.",

          "An educational post should teach something useful: a mistake, myth, process, selection criteria, FAQ, practical tip or expert explanation.",
"If the topic asks for a step-by-step process, write actual numbered or clearly separated steps. Do not turn it into a promotional service description.",
"For a topic like 'How to clean your teeth step by step', explain the daily home care process: brushing technique, duration, toothpaste amount, gumline, interdental cleaning, tongue cleaning, rinsing habits and consistency.",

          "For educational content, do NOT add phone numbers, hard CTA, 'contact us', 'book now', sales ending or aggressive advertising.",

          "Educational posts should sound like helpful expert information, not like an ad.",

          !isPromotional
            ? "Do not end posts with sales CTAs like 'contact us', 'message us', 'call now', unless the format is explicitly promotional."
            : "",

          "For professional courses, write about skills, practice, career paths, common mistakes when choosing a course and what a person can do after training.",

          "For technical or specialized services, explain the process, the problem, the risk and the benefit of correct diagnosis or professional work.",

          "Use ONLY facts, details and specific information that were explicitly provided in this request.",

          "If no city, area, address or location is provided, do NOT invent locations.",

          "Do not invent addresses, phone numbers, prices, discounts, deadlines, offers or other concrete details.",

          "If information is missing, keep the text general but natural and professional.",

          "Do not add example cities or locations unless they were explicitly provided.",

          "Return hashtags in English.",
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
          throw new Error(rawText || "Invalid server response.");
        }

        if (!response.ok || !data?.success) {
          throw new Error(data?.error || "Could not generate posts.");
        }

        const variations = Array.isArray(data?.variations)
          ? data.variations
          : [];

        const generated: GeneratedPostOption[] = variations.map(
          (variation: any, index: number) => ({
            id: `post-${index + 1}`,
            title: `Option ${index + 1}`,
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
            : "Could not generate posts."
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
        <div className="mb-6 flex items-center justify-between gap-4">
          <Link
            href="/en/content-calendar"
            className="text-sm font-semibold text-neutral-500"
          >
            ← Back to calendar
          </Link>

          <Link
            href="/en/pricing"
            className="rounded-full bg-neutral-950 px-4 py-2 text-sm font-bold text-white"
          >
            Pricing
          </Link>
        </div>

        <section className="rounded-[28px] border border-black/10 bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.08)] md:p-8">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-neutral-500">
              Content posts
            </p>

            <h1 className="mt-3 text-[32px] font-black leading-none tracking-[-0.03em] text-neutral-950 md:text-[40px]">
              Generate ready-to-publish posts
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-[1.7] text-neutral-600">
              AI creates three post variations based on the selected calendar
              idea, business type and content tone.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[20px] border border-black/10 bg-[#fcfaf7] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500">
                Day / slot
              </p>
              <p className="mt-2 text-sm font-semibold leading-[1.5] text-neutral-900">
                {selectedData?.item?.day || "—"}
              </p>
            </div>

            <div className="rounded-[20px] border border-black/10 bg-[#fcfaf7] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500">
                Title
              </p>
              <p className="mt-2 text-sm font-semibold leading-[1.5] text-neutral-900">
                {selectedData?.item?.title || "—"}
              </p>
            </div>

            <div className="rounded-[20px] border border-black/10 bg-[#fcfaf7] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500">
                Format
              </p>
              <p className="mt-2 text-sm font-semibold leading-[1.5] text-neutral-900">
                {selectedData?.item?.format || "—"}
              </p>
            </div>

            <div className="rounded-[20px] border border-black/10 bg-[#fcfaf7] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500">
                Description
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
                  Generating 3 post variations...
                </p>
                <p className="mt-2 text-sm leading-[1.7] text-neutral-600">
                  We are preparing captions based on the selected topic,
                  business and tone.
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
                            Selected
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-4 flex-1 whitespace-pre-line text-sm leading-[1.8] text-neutral-700">
                        {post.body}
                      </div>

                      <div className="mt-4 rounded-[16px] bg-white px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500">
                          Hashtags
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
                        {isSelected ? "Post selected" : "Select this post"}
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : null}

            {!loadingPosts && !postOptions.length ? (
              <div className="rounded-[20px] border border-dashed border-black/10 bg-[#fcfaf7] p-6 text-center">
                <p className="text-[18px] font-bold text-neutral-900">
                  No selected idea
                </p>
                <p className="mt-2 text-sm leading-[1.7] text-neutral-600">
                  Go back to the content calendar and choose a topic to generate
                  posts from.
                </p>
              </div>
            ) : null}
          </div>

          {!loadingPosts && postOptions.length ? (
            <div className="mt-8 flex justify-center">
              {selectedPostId ? (
                <Link
                  href="/en/dashboard/brand-studio"
                  className="inline-flex items-center justify-center rounded-[20px] bg-neutral-950 px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  Continue to Brand Studio
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  className="inline-flex items-center justify-center rounded-[20px] bg-neutral-300 px-6 py-3 text-sm font-semibold text-neutral-600"
                >
                  Select a post to continue
                </button>
              )}
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}