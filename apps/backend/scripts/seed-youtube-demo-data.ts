import { and, desc, eq, like, sql } from "drizzle-orm";

import { conn, db } from "../src/db";
import { comments, users, videos, youtubeAccounts } from "../src/db/schema";

const SEED_PREFIX_BASE = "cq_seed_demo_20260404";
const SEEDED_VIDEOS_COUNT = 101;
const TOP_VIDEO_COMMENT_COUNT = 500;
const DEFAULT_VIDEO_COMMENT_COUNT = 100;
const TOP_VIDEO_COUNT = 5;
const TOP_VIDEO_LOOK_COUNT = 10;

const themes = [
  "Bengaluru work vlog",
  "weekend reset routine",
  "creator workflow breakdown",
  "Notion planning setup",
  "iPhone camera test",
  "startup grind diary",
  "desk setup update",
  "editing workflow tips",
  "budget tech picks",
  "monthly life update",
];

const titleSuffixes = [
  "for busy founders",
  "after a chaotic week",
  "with real examples",
  "that actually helped me",
  "in Indian context",
  "without overcomplicating it",
  "from my daily routine",
  "using simple systems",
  "with honest pros and cons",
  "for the next 30 days",
];

const praiseBodies = [
  "bhai pacing mast tha",
  "yeh genuinely useful laga",
  "editing kaafi clean hai",
  "straight to the point tha",
  "kaafi relatable nikla",
  "is baar intro strong tha",
  "practical value achha tha",
  "presentation simple but solid tha",
  "video dekh ke motivation aa gaya",
  "quality last few uploads se better hai",
];

const suggestionBodies = [
  "next time thoda aur detail me dikhao",
  "audio thoda aur crisp ho sakta hai",
  "timestamps add karoge to aur easy hoga",
  "screen recording thoda zoom karke dikhao",
  "part 2 banao with deeper examples",
  "short summary end me de do to perfect ho jayega",
  "thoda slow explain karoge to beginners ko help milegi",
  "comparison table add karoge to mast rahega",
  "Hindi me thoda aur bolo to broader audience connect karegi",
  "real numbers bhi share karo next time",
];

const relatabilityBodies = [
  "same scene mere saath bhi hota hai",
  "office ke baad energy exactly aisi hi rehti hai",
  "Indian audience ke liye yeh point on point tha",
  "Bengaluru traffic ke baad routine maintain karna tough hota hai",
  "middle class setup me bhi yeh doable laga",
  "freelance life ka pressure achhe se capture kiya",
  "ghar se kaam karne walon ko yeh samajh aayega",
  "student se creator shift me yeh kaafi relevant hai",
  "aisa honest take kam log dete hain",
  "yeh wali struggle bilkul real hai",
];

const critiqueBodies = [
  "title thoda zyada generic laga but content achha tha",
  "thumbnail se expectation thodi alag thi",
  "starting 20 seconds aur tighter ho sakte the",
  "background music thoda loud tha",
  "ek do points repeat hue lage",
  "ending thoda abrupt thi",
  "hook strong tha but middle me pace dip hua",
  "examples aur specific hote to aur better lagta",
  "camera angle thoda unstable tha",
  "caption mistakes thodi distracting thi",
];

const closers = [
  "keep going yaar",
  "next upload ka wait rahega",
  "aise hi honest content lao",
  "subscribed for this vibe",
  "respect for the effort",
  "yeh series continue karo",
  "kaafi logon ko help milegi",
  "algorithm ko bhi samajh aana chahiye yeh",
  "isse growth aayegi pakka",
  "good stuff overall",
];

const lightOpeners = [
  "Bhai",
  "Honestly",
  "Ngl",
  "Yaar",
  "Bro",
  "Sahi me",
  "Aaj",
  "Waise",
  "Mujhe laga",
  "Sach bolu to",
];

const categories = ["praise", "suggestion", "relatable", "critique"] as const;

type CommentCategory = (typeof categories)[number];
type SpecialVideoKind = "latest-grwm";

const topVideoPresets = [
  {
    title: "GRWM for a Brunch Date: soft glam, coffee run, and outfit chaos",
    thumbnailUrl: null,
  },
  {
    title: "My 6AM Reset Routine: skincare, journaling, and a calm apartment morning",
    thumbnailUrl: null,
  },
  {
    title: "Productive Workday in Bangalore: cafe edit session and creator to-do list",
    thumbnailUrl: null,
  },
  {
    title: "Closet Cleanout and Outfit Planning for the Week",
    thumbnailUrl: null,
  },
  {
    title: "Weekend Glow-Up Vlog: salon stop, skincare haul, and dinner plans",
    thumbnailUrl: null,
  },
  {
    title: "Desk Setup Refresh for Better Focus and Better Videos",
    thumbnailUrl: null,
  },
  {
    title: "What I Actually Use in My Everyday Makeup Bag",
    thumbnailUrl: null,
  },
  {
    title: "Spend the Day With Me: errands, editing, and a sunset catch-up",
    thumbnailUrl: null,
  },
  {
    title: "Night Routine After a Long Shoot Day",
    thumbnailUrl: null,
  },
  {
    title: "How I Plan Content for the Week Without Burning Out",
    thumbnailUrl: null,
  },
] as const;

const latestVideoTitle = topVideoPresets[0].title;

const grwmOpeners = [
  "Omg",
  "Girl",
  "Okay",
  "Honestly",
  "Sis",
  "Ngl",
  "Babeee",
  "Aree",
  "Lowkey",
  "No because",
];

const grwmMoods = [
  "full obsessed",
  "softly impressed",
  "slightly jealous",
  "happy for you",
  "curious as hell",
  "lightly entertained",
  "completely sold",
  "comforted",
  "surprisingly inspired",
  "staring respectfully",
  "quietly taking notes",
  "ready to copy this",
  "still recovering",
  "fully invested",
  "randomly emotional",
  "kind of attacked",
  "very entertained",
  "straight up influenced",
  "locked in",
  "weirdly motivated",
];

const grwmAngles = [
  "the base makeup blend looked crazy smooth on camera",
  "that outfit switch moment actually made the whole vlog hit harder",
  "your hair and jewelry together looked way too put together in the best way",
  "the lighting on the skincare part made everything feel expensive",
  "the final mirror reveal was genuinely worth the build-up",
  "the casual way you explained each step made it feel very watchable",
  "the coffee run clips made the whole thing feel like a proper lifestyle vlog",
  "your makeup table looked chaotic but in a very relatable creator way",
  "the lip combo at the end pulled the whole look together",
  "the transitions were clean enough to make the whole video feel polished",
  "the simple top with the accessories was honestly the smartest styling choice",
  "your skin prep looked like it made the biggest difference to the final look",
  "the voiceover felt calm without making the video boring",
  "the before and after contrast was subtle but super effective",
  "the perfume and final touch section made the whole thing feel complete",
  "the outfit felt cute without looking overdone",
  "the little pauses and reactions made the vlog feel more real",
  "the makeup choices looked wearable and not forced for camera",
  "the final glam felt elevated while still looking easy to recreate",
  "the vibe was very main-character without trying too hard",
  "the styling choices looked expensive even though the outfit was simple",
  "the way you paced the ready-with-me section made it easy to stay hooked",
  "the balance between chatty and aesthetic was actually done really well",
  "the blush and lip shade combo looked perfect on screen",
  "the whole thing made me want to get ready for no reason at all",
];

const grwmIntents = [
  "I need the exact lip combo details",
  "drop the outfit link somewhere please",
  "someone please ask for the skincare products because I also need them",
  "I want a full product list in the caption",
  "I am here only to know which perfume you used",
  "this is the kind of video that makes people shop immediately",
  "I would watch a longer version of this with every product named",
  "I need a separate video just for the makeup routine",
  "the hair routine also deserves its own breakdown",
  "please tell me where the accessories are from",
  "I am fully influenced and not even mad about it",
  "this kind of soft glam actually deserves a tutorial",
  "I need the exact foundation and blush shades",
  "this video just convinced me to care about getting ready again",
  "you somehow made simple steps look very premium",
  "I want the coffee place recommendation too at this point",
  "the camera quality and the look together sold the whole vibe",
  "I need links, names, and an updated makeup bag tour immediately",
  "the final look deserves a thumbnail of its own",
  "this is the sort of GRWM that makes the comments section useful",
  "I would genuinely save this before my next outing",
  "you made the whole process feel fun instead of stressful",
  "this is exactly the tone more lifestyle vlogs should have",
  "I need a version of this for office looks too",
  "this made me want to clean my room and my makeup pouch",
];

const grwmClosers = [
  "more of these please",
  "absolute serve",
  "saving this one",
  "the vibe was immaculate",
  "you ate that up",
  "need part two",
  "comments are going to be full of product questions",
  "this was way too pretty",
  "such a clean vlog",
  "I get the hype now",
];

const grwmPureComments = [
  "this vlog made me want to get dressed up immediately",
  "your final look was genuinely so pretty and clean",
  "I need the exact details of the lip shade and blush",
  "the styling in this video felt effortless in the best way",
  "this is exactly the kind of get ready with me I replay",
  "the final reveal was worth every second of the build-up",
  "the whole video felt soft, polished, and easy to watch",
  "I would absolutely watch a longer version of this routine",
  "the products, the outfit, and the mood all worked together",
  "this was such a pretty and comforting video overall",
];

const pick = <T>(items: readonly T[], seed: number) =>
  items[Math.abs(seed) % items.length]!;

const getSpecialVideoKind = (index: number): SpecialVideoKind | null => {
  if (index === 0) {
    return "latest-grwm";
  }

  return null;
};

const makeTitle = (index: number) => {
  if (index < TOP_VIDEO_LOOK_COUNT) {
    return topVideoPresets[index]!.title;
  }

  const theme = pick(themes, index);
  const suffix = pick(titleSuffixes, index * 7 + 3);
  return `${theme} ${index + 1}: ${suffix}`;
};

const makeThumbnailUrl = (index: number) =>
  index < TOP_VIDEO_LOOK_COUNT ? topVideoPresets[index]!.thumbnailUrl : null;

const buildSeedPrefix = (userId: string) =>
  `${SEED_PREFIX_BASE}_${userId.replace(/-/g, "").slice(0, 8)}`;

const makeYoutubeVideoId = (seedPrefix: string, index: number) =>
  `${seedPrefix}_vid_${String(index + 1).padStart(3, "0")}`;

const makeDuration = (index: number) => {
  const minutes = 4 + (index % 12);
  const seconds = 8 + ((index * 13) % 50);
  return `PT${minutes}M${seconds}S`;
};

const makeViewCount = (index: number) => {
  if (index < TOP_VIDEO_COUNT) {
    return 120000 - index * 9000;
  }

  return 18000 + (SEEDED_VIDEOS_COUNT - index) * 430 + (index % 5) * 1200;
};

const makeLikeCount = (index: number, commentCount: number) => {
  if (index < TOP_VIDEO_COUNT) {
    return 7200 - index * 430;
  }

  return Math.max(140, Math.round(makeViewCount(index) * 0.042) + commentCount / 5);
};

const makeCategory = (videoIndex: number, commentIndex: number): CommentCategory =>
  categories[(videoIndex * 3 + commentIndex) % categories.length]!;

const makeCommentText = (
  videoIndex: number,
  commentIndex: number,
  title: string,
) => {
  const opener = pick(lightOpeners, videoIndex * 17 + commentIndex);
  const closer = pick(closers, videoIndex * 23 + commentIndex * 5);
  const category = makeCategory(videoIndex, commentIndex);
  const bodyPool =
    category === "praise"
      ? praiseBodies
      : category === "suggestion"
        ? suggestionBodies
        : category === "relatable"
          ? relatabilityBodies
          : critiqueBodies;
  const body = pick(bodyPool, videoIndex * 29 + commentIndex * 11);
  const titleRef = commentIndex % 9 === 0 ? ` ${title.split(":")[0]?.toLowerCase()} pe` : "";
  const tail =
    commentIndex % 13 === 0
      ? " specially Indian audience ke liye."
      : commentIndex % 7 === 0
        ? " timing bhi perfect tha."
        : ".";

  return `${opener}, ${body}${titleRef}${tail} ${closer}.`;
};

const makeDiverseLatestVideoCommentText = (commentIndex: number) => {
  if (commentIndex % 11 === 0) {
    const body = pick(grwmPureComments, commentIndex);
    const closer = pick(grwmClosers, commentIndex * 3 + 1);
    return `${body}. ${closer}.`;
  }
  const moodIndex = Math.floor(commentIndex / grwmIntents.length);
  const intentIndex = commentIndex % grwmIntents.length;
  const opener = pick(grwmOpeners, commentIndex * 5 + 1);
  const mood = grwmMoods[moodIndex]!;
  const angle = pick(grwmAngles, commentIndex * 7 + 3);
  const intent = grwmIntents[intentIndex]!;
  const closer = pick(grwmClosers, commentIndex * 11 + 5);
  const extra =
    commentIndex % 6 === 0
      ? " and the camera work made the whole thing look extra polished"
      : commentIndex % 5 === 0
        ? " and now the whole comment section is going to ask for the product list"
        : commentIndex % 7 === 0
          ? " and I genuinely need a follow-up with every single product mentioned"
          : " and that final look came together way better than I expected";

  return `${opener}, I am ${mood} because ${angle}. ${intent}${extra}. ${closer}.`;
};

const ensureUniqueTexts = <T extends { text: string }>(items: T[]) => {
  const seen = new Set<string>();

  for (const item of items) {
    let candidate = item.text;
    let duplicateIndex = 1;

    while (seen.has(candidate)) {
      candidate = `${item.text} (${duplicateIndex + 1})`;
      duplicateIndex += 1;
    }

    item.text = candidate;
    seen.add(candidate);
  }

  return items;
};

const buildSeedData = (userId: string) => {
  const now = Date.now();
  const syncedAt = new Date(now);
  const seedPrefix = buildSeedPrefix(userId);

  const seededVideos = Array.from({ length: SEEDED_VIDEOS_COUNT }, (_, index) => {
    const commentCount =
      index < TOP_VIDEO_COUNT ? TOP_VIDEO_COMMENT_COUNT : DEFAULT_VIDEO_COMMENT_COUNT;
    const publishedAt = new Date(now - index * 36 * 60 * 60 * 1000);
    const createdAt = new Date(publishedAt.getTime() + 20 * 60 * 1000);
    const title = makeTitle(index);
    const youtubeVideoId = makeYoutubeVideoId(seedPrefix, index);

    return {
      id: crypto.randomUUID(),
      youtubeVideoId,
      userId,
      title,
      publishedAt,
      thumbnailUrl: makeThumbnailUrl(index),
      viewCount: makeViewCount(index),
      likeCount: makeLikeCount(index, commentCount),
      favoriteCount: 0,
      commentCount,
      duration: makeDuration(index),
      lastCommentsSyncedAt: syncedAt,
      lastManualCommentsSyncAt: null as Date | null,
      createdAt,
      updatedAt: syncedAt,
    };
  });

  const seededComments = ensureUniqueTexts(
    seededVideos.flatMap((video, videoIndex) => {
    const count = video.commentCount ?? DEFAULT_VIDEO_COMMENT_COUNT;

    return Array.from({ length: count }, (_, commentIndex) => {
      const publishedAt = new Date(
        video.publishedAt.getTime() +
          30 * 60 * 1000 +
          commentIndex * 11 * 60 * 1000 +
          (videoIndex % 5) * 60 * 1000,
      );

      return {
        id: crypto.randomUUID(),
        videoId: video.id,
        youtubeCommentId: `${video.youtubeVideoId}_c_${String(commentIndex + 1).padStart(4, "0")}`,
        text:
          getSpecialVideoKind(videoIndex) === "latest-grwm"
            ? makeDiverseLatestVideoCommentText(commentIndex)
            : makeCommentText(videoIndex, commentIndex, video.title),
        publishedAt,
        likeCount:
          videoIndex < TOP_VIDEO_COUNT
            ? Math.max(0, 42 - (commentIndex % 17))
            : Math.max(0, 16 - (commentIndex % 9)),
        createdAt: publishedAt,
      };
    });
    }),
  );

  return {
    seedPrefix,
    syncedAt,
    seededVideos,
    seededComments,
  };
};

const main = async () => {
  const userArgIndex = Bun.argv.indexOf("--user-id");
  const explicitUserId =
    userArgIndex >= 0 ? (Bun.argv[userArgIndex + 1] ?? "").trim() : "";

  const [youtubeAccount] = explicitUserId
    ? await db
        .select()
        .from(youtubeAccounts)
        .where(eq(youtubeAccounts.userId, explicitUserId))
        .limit(1)
    : await db
        .select()
        .from(youtubeAccounts)
        .orderBy(desc(youtubeAccounts.updatedAt))
        .limit(1);

  if (!youtubeAccount) {
    throw new Error("No YouTube-connected user found to seed");
  }

  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
    })
    .from(users)
    .where(eq(users.id, youtubeAccount.userId))
    .limit(1);

  if (!user) {
    throw new Error("Target user was not found");
  }

  const { seedPrefix, syncedAt, seededVideos, seededComments } = buildSeedData(
    user.id,
  );

  await db.transaction(async (tx) => {
    const existingSeededVideos = await tx
      .select({
        id: videos.id,
      })
      .from(videos)
      .where(
        and(
          eq(videos.userId, user.id),
          like(videos.youtubeVideoId, `${SEED_PREFIX_BASE}%`),
        ),
      );

    if (existingSeededVideos.length > 0) {
      await tx
        .delete(videos)
        .where(
          and(
            eq(videos.userId, user.id),
            like(videos.youtubeVideoId, `${SEED_PREFIX_BASE}%`),
          ),
        );
    }

    await tx.insert(videos).values(seededVideos);

    const commentBatchSize = 500;
    for (let index = 0; index < seededComments.length; index += commentBatchSize) {
      await tx
        .insert(comments)
        .values(seededComments.slice(index, index + commentBatchSize));
    }

    await tx
      .update(youtubeAccounts)
      .set({
        lastSyncedAt: syncedAt,
        updatedAt: syncedAt,
      })
      .where(eq(youtubeAccounts.userId, user.id));
  });

  const [seededVideoStats, seededCommentStats, topVideoCounts] = await Promise.all([
    db
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(videos)
      .where(
        and(
          eq(videos.userId, user.id),
          like(videos.youtubeVideoId, `${seedPrefix}%`),
        ),
      ),
    db
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(comments)
      .innerJoin(videos, eq(comments.videoId, videos.id))
      .where(
        and(
          eq(videos.userId, user.id),
          like(videos.youtubeVideoId, `${seedPrefix}%`),
        ),
      ),
    db
      .select({
        title: videos.title,
        youtubeVideoId: videos.youtubeVideoId,
        commentCount: sql<number>`count(${comments.id})::int`,
      })
      .from(videos)
      .leftJoin(comments, eq(comments.videoId, videos.id))
      .where(
        and(
          eq(videos.userId, user.id),
          like(videos.youtubeVideoId, `${seedPrefix}%`),
        ),
      )
      .groupBy(videos.id)
      .orderBy(desc(videos.publishedAt))
      .limit(TOP_VIDEO_COUNT),
  ]);

  console.log(
    JSON.stringify(
      {
        seededForUser: user,
        insertedVideos: seededVideoStats[0]?.count ?? 0,
        insertedComments: seededCommentStats[0]?.count ?? 0,
        topFiveLatestVideos: topVideoCounts,
      },
      null,
      2,
    ),
  );
};

main()
  .catch((error) => {
    console.error("Failed to seed YouTube demo data:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await conn.end();
  });
