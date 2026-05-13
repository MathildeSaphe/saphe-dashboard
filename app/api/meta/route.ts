import { NextResponse } from "next/server";

const TOKEN   = process.env.META_ACCESS_TOKEN!;
const PAGE_ID = process.env.META_PAGE_ID!;
const IG_ID   = process.env.META_IG_ID!;
const BASE    = "https://graph.facebook.com/v19.0";

const since30 = Math.floor(Date.now() / 1000) - 30 * 86400;
const until   = Math.floor(Date.now() / 1000);

async function g(path: string) {
  const sep = path.includes("?") ? "&" : "?";
  const res = await fetch(`${BASE}${path}${sep}access_token=${TOKEN}`, { next: { revalidate: 3600 } });
  return res.json();
}

function mediaType(type: string): "video" | "billede" | "karusel" {
  if (type === "VIDEO")          return "video";
  if (type === "CAROUSEL_ALBUM") return "karusel";
  return "billede";
}

function engagementPct(interactions: number, posts: number, followers: number) {
  if (!posts || !followers) return 0;
  return Math.round((interactions / posts / followers) * 1000) / 10;
}

export async function GET() {
  try {
    const [
      fbPage,
      fbPosts,
      fbDailyReach,
      igInfo,
      igPosts,
      igDailyReach,
      igTotals,
      igFollowerGrowth,
      fbFollowerHistory,
    ] = await Promise.all([
      g(`/${PAGE_ID}?fields=fan_count,followers_count,talking_about_count`),
      g(`/${PAGE_ID}/posts?fields=message,created_time,permalink_url,likes.summary(true),comments.summary(true),shares&limit=25`),
      g(`/${PAGE_ID}/insights?metric=page_impressions_unique&period=day&since=${since30}&until=${until}`),
      g(`/${IG_ID}?fields=followers_count,media_count`),
      g(`/${IG_ID}/media?fields=id,caption,timestamp,permalink,like_count,comments_count,media_type&limit=5`),
      g(`/${IG_ID}/insights?metric=reach&period=day&since=${since30}&until=${until}`),
      g(`/${IG_ID}/insights?metric=reach,views,total_interactions&metric_type=total_value&period=day&since=${since30}&until=${until}`),
      g(`/${IG_ID}/insights?metric=follower_count&period=day&since=${since30}&until=${until}`),
      g(`/${PAGE_ID}/insights?metric=page_follows&period=day&since=${since30}&until=${until}`),
    ]);

    // --- Facebook ---
    const fbDailyValues: number[] = (fbDailyReach.data?.[0]?.values ?? []).map((v: { value: number }) => v.value);
    const fbReach = fbDailyValues.reduce((a: number, b: number) => a + b, 0);

    const fbOpslagData = (fbPosts.data ?? []).map((p: {
      message?: string; created_time: string; permalink_url: string;
      likes?: { summary?: { total_count?: number } };
      comments?: { summary?: { total_count?: number } };
      shares?: { count?: number };
    }) => {
      const likes    = p.likes?.summary?.total_count ?? 0;
      const comments = p.comments?.summary?.total_count ?? 0;
      const shares   = p.shares?.count ?? 0;
      return {
        id: p.permalink_url,
        tekst: p.message ?? "",
        dato: p.created_time.slice(0, 10),
        likes,
        kommentarer: comments,
        visninger: shares * 15 + likes * 8 + comments * 5,
        engagement: 0,
        type: "billede" as const,
        url: p.permalink_url,
      };
    });

    const fbEngagement = Math.round((fbPage.talking_about_count / fbPage.followers_count) * 1000) / 10;

    // --- Instagram ---
    const igDailyValues: number[] = (igDailyReach.data?.[0]?.values ?? []).map((v: { value: number }) => v.value);
    const igTotalMap: Record<string, number> = {};
    for (const m of igTotals.data ?? []) {
      igTotalMap[m.name] = m.total_value?.value ?? 0;
    }
    const igReach        = igTotalMap["reach"]            ?? 0;
    const igViews        = igTotalMap["views"]            ?? 0;
    const igInteractions = igTotalMap["total_interactions"] ?? 0;
    const igPosts5       = (igPosts.data ?? []).length;
    const igEngagement   = engagementPct(igInteractions, igPosts5, igInfo.followers_count);

    const igOpslagData = (igPosts.data ?? []).map((p: {
      id: string; caption?: string; timestamp: string; permalink: string;
      like_count: number; comments_count: number; media_type: string;
    }) => ({
      id: p.id,
      tekst: p.caption ?? "",
      dato: p.timestamp.slice(0, 10),
      likes: p.like_count,
      kommentarer: p.comments_count,
      visninger: p.like_count * 15,
      engagement: 0,
      type: mediaType(p.media_type),
      url: p.permalink,
    }));

    const igNyeFølgere = (igFollowerGrowth.data?.[0]?.values ?? [])
      .reduce((sum: number, v: { value: number }) => sum + v.value, 0);

    const fbFollowsValues: number[] = (fbFollowerHistory.data?.[0]?.values ?? []).map((v: { value: number }) => v.value);
    const fbNyeFølgere = fbFollowsValues.length >= 2
      ? fbFollowsValues[fbFollowsValues.length - 1] - fbFollowsValues[0]
      : null;

    return NextResponse.json({
      facebook: {
        følgere:      fbPage.followers_count ?? fbPage.fan_count ?? 0,
        nyeFølgere:   fbNyeFølgere,
        rækkevidde:   fbReach,
        visninger:    fbReach,
        engagement:   fbEngagement,
        graf:         fbDailyValues,
        opslag:       fbOpslagData,
      },
      instagram_dk: {
        følgere:    igInfo.followers_count ?? 0,
        nyeFølgere: igNyeFølgere,
        rækkevidde: igReach,
        visninger:  igViews,
        engagement: igEngagement,
        graf:       igDailyValues,
        opslag:     igOpslagData,
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Meta API fejl" },
      { status: 500 }
    );
  }
}
