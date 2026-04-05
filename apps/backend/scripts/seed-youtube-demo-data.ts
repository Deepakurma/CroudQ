import { and, desc, eq, like, sql } from "drizzle-orm";

import { conn, db } from "../src/db";
import { comments, users, videos, youtubeAccounts } from "../src/db/schema";

const SEED_PREFIX_BASE = "cq_seed_demo_20260404";
const SEEDED_VIDEOS_COUNT = 101;
const TOP_VIDEO_COMMENT_COUNT = 500;
const DEFAULT_VIDEO_COMMENT_COUNT = 100;
const TOP_VIDEO_COUNT = 5;

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
type SpecialVideoKind = "diverse-comments" | "war-update";
type LatestCommentTone =
  | "concern"
  | "analysis"
  | "critique"
  | "question"
  | "fatigue";

const latestVideoTitle =
  "Living Alone Reset Vlog: 7 din me habits, routine aur mindset kitna change hua";
const secondLatestVideoTitle =
  "USA, Israel, Iran War Update: kya ho raha hai aur aage kya ho sakta hai";

const diverseCommentOpeners = [
  "Sach bolun",
  "Bhai",
  "Honestly",
  "Mere liye",
  "Personal take",
  "Ngl",
  "Yeh video dekh ke",
  "Main alag reason se",
  "Dil se bolu",
  "Mujhe sabse zyada",
];

const diverseMoodDescriptors = [
  "halka sa nostalgic",
  "andar se motivated",
  "thoda insecure",
  "unexpectedly peaceful",
  "kaafi skeptical",
  "emotionally heavy",
  "lowkey jealous",
  "soft aur hopeful",
  "thoda defensive",
  "seedha inspired",
  "confused but interested",
  "thoda guilty",
  "refresh feel karte hue",
  "protective mode me",
  "andar se competitive",
  "surprisingly comforted",
  "kaafi reflective",
  "restless type energy ke saath",
  "calm acceptance ke mood me",
  "thoda proud",
];

const diverseIntentions = [
  "apni purani routine compare kar raha hoon",
  "sirf editing nahi, discipline observe kar raha hoon",
  "comment isliye likh raha hoon kyunki yeh reality rare lagti hai",
  "tumhari consistency ko silently measure kar raha hoon",
  "dekhna chahta hoon ki next vlog me yeh energy sustain hoti hai ya nahi",
  "apne khud ke burnout phase ko yaad kar raha hoon",
  "isliye react kar raha hoon kyunki yeh video surface level nahi laga",
  "apni loneliness ka angle yahan project kar raha hoon",
  "sirf praise nahi, apna internal mess bhi compare kar raha hoon",
  "yeh dekh kar routine rebuild karne ka mann ho raha hai",
  "tumhare choices ke through apne decisions ko judge kar raha hoon",
  "comment karte waqt bhi soch raha hoon ki camera ke bahar story aur kya hogi",
  "is content me comfort dhoondh raha hoon, bas entertainment nahi",
  "khud ko push karne ke liye isko reminder bana raha hoon",
  "dekh raha hoon ki discipline aur loneliness ka mix kaise handle kiya",
  "tumhare calm tone me apni anxiety ko contrast kar raha hoon",
  "sirf room aesthetic nahi, emotional effort notice kar raha hoon",
  "yeh jaanne ki curiosity me hoon ki off-camera din kitne messy hote honge",
  "thoda validate feel karne aaya tha aur kaafi kuch leke ja raha hoon",
  "apni failed habits ko yaad karke bhi strangely hopeful feel ho raha hai",
  "video ko motivation aur warning dono ki tarah dekh raha hoon",
  "yeh samajhne ki koshish kar raha hoon ki solitude tumhare liye strength hai ya coping mechanism",
  "apne future self ko imagine karke comment likh raha hoon",
  "sirf vibe absorb nahi kar raha, patterns decode kar raha hoon",
  "isliye ruk kar likh raha hoon kyunki isne normal vlog se zyada hit kiya",
];

const diverseObservationAngles = [
  "morning routine ka pace forced nahi laga",
  "kitchen aur room ke beech wali silence kaafi real lagi",
  "background me jo thakan thi woh hide nahi ki gayi",
  "camera placement se intentional solitude feel hui",
  "voiceover me overconfidence nahi tha",
  "tumne productive dikhne ke pressure ko fully fake nahi kiya",
  "small habits ka repetition strongest part laga",
  "mess aur reset ke beech ka transition believable tha",
  "final takeaway preachy nahi laga",
  "vlog me loneliness ko glamorize bhi nahi kiya gaya",
];

const diverseEmotionalEffects = [
  "aur us wajah se video mere dimaag me normal content se zyada der tak rahega",
  "isliye is par hasi wali reaction nahi aa rahi, thoda quietly process kar raha hoon",
  "aur shayad isi liye mujhe yeh zyada personal lag raha hai",
  "jiski wajah se comment chhota rakhna mushkil ho gaya",
  "aur yeh cheez mujhe impress se zyada disturb karke gayi in a good way",
  "isliye main isse sirf aesthetic vlog treat nahi kar paa raha",
  "aur exactly wahi part mujhe sabse honest laga",
  "jisse yeh video algorithm content se alag khadi ho gayi",
  "aur usi point par mujhe apni life ki kamiyaan yaad aayi",
  "isliye yeh bas dekhne wala content nahi, feel karne wala piece ban gaya",
];

const diverseClosers = [
  "next part me aur raw raho",
  "aise comments shayad sab na likhen but feel bahut log karenge",
  "tumne kaafi layered response nikalwa diya",
  "iska impact views se zyada internal hoga",
  "yeh wali honesty easy nahi hoti",
  "main isko save karke dobara dekhunga",
  "isse relate karne wale quietly bahut honge",
  "please is format ko casually mat chhodna",
  "is tarah ka vlog loud nahi hota but stick karta hai",
  "yeh comment bhi shayad mere liye note jaisa hi hai",
];

const latestConcernOpeners = [
  "Yaar",
  "Sach bolu toh",
  "Honestly",
  "Bhai",
  "Mujhe lagta hai",
  "Dil se",
  "Aaj ki update dekh ke",
  "Seedhi baat",
  "Ngl",
  "Seriously",
];

const latestConcernBodies = [
  "iss conflict ka sabse bura part yeh hai ki aam log hi sabse zyada suffer karte hain aur ground reality headlines se bhi zyada painful hoti hogi",
  "har nayi escalation ke baad lagta hai situation control ke bahar nikal rahi hai aur world leaders bas statements tak limited reh gaye hain",
  "video dekh ke aur clear hua ki war ka impact sirf borders tak nahi rehta, families, economy aur future sab par padta hai",
  "jo civilians beech me phas jaate hain unke liye genuinely dil dukhta hai, politics alag cheez hai par human cost sabse heavy lagti hai",
  "aise moments me social media par noise bahut hota hai par asli dikkat un logon ki hoti hai jinke shehron par direct asar pad raha hota hai",
  "jitna tumne calmly breakdown kiya usse samajh aaya ki retaliation chain kitni dangerous ho sakti hai agar koi side peeche na hategi",
  "kabhi kabhi lagta hai duniya history se kuch seekhti hi nahi, har generation ko same type ke conflicts ka naya version dekhna pad raha hai",
  "mujhe sabse zyada tension is baat ki hoti hai ki ek galat decision aur poora region aur unstable ho sakta hai",
  "news clips alag alag dekh kar confusion hota tha, is video ne dikhaya ki background samjhe bina reactions dena kitna easy aur kitna risky hai",
  "sirf military updates dekhne se picture complete nahi hoti, humanitarian angle bhi utna hi important hai aur tumne woh point sahi uthaya",
];

const latestAnalysisOpeners = [
  "Mere hisaab se",
  "Observation yeh hai",
  "Agar calmly dekho",
  "Video ka strongest point",
  "Ek cheez clear lagi",
  "Strategically dekha jaye toh",
  "Mujhe jo samajh aaya",
  "Thoda neutral socho toh",
  "Ye breakdown dekhne ke baad",
  "Point yeh bana",
];

const latestAnalysisBodies = [
  "tumne alliances, retaliation aur regional pressure ko ek hi frame me samjhaya, warna usually videos sirf breaking headline tak ruk jaati hain",
  "is conflict me military action ke saath diplomatic signaling bhi chal rahi hai, aur woh nuance kaafi log miss kar dete hain",
  "jo timeline tumne explain ki usse kaafi clarity mili ki ek incident alag se nahi hota, peeche layered triggers hote hain",
  "market impact, oil routes aur global politics ka connection mention karna zaroori tha, kyunki war sirf battlefield tak limited nahi rehti",
  "commentary balanced lagi kyunki tumne kisi ek narrative ko blindly push nahi kiya aur context par focus rakha",
  "yeh samajhna important hai ki public statements aur actual strategic intent hamesha same nahi hote, aur tumne woh gap achha explain kiya",
  "jitni complexity is issue me hai us hisaab se concise explanation dena easy nahi hota, but yahan sequence samajh aa gaya",
  "bahut log map ya regional dynamics explain hi nahi karte, tumne woh part add karke video ko genuinely useful bana diya",
  "escalation ka risk tumne exaggerated tone me nahi, realistic tone me bataya, isi wajah se video aur credible laga",
  "yeh topic emotional bhi hai aur political bhi, isliye structured explanation zyada valuable lagti hai compared to shouting-match content",
];

const latestCritiqueOpeners = [
  "Ek issue laga",
  "Thoda disagree karunga",
  "Mujhe yahan problem lagi",
  "Respectfully",
  "Criticism yeh hai",
  "Main poori tarah convinced nahi hoon",
  "Video achha tha but",
  "Genuine feedback",
  "Honestly ek gap laga",
  "Meri concern yeh bhi hai",
];

const latestCritiqueBodies = [
  "thoda aur sources ya on-screen references dikhate toh argument aur strong lagta, kyunki is topic me misinformation already bahut hai",
  "timeline achhi thi but kuch parts fast nikal gaye, specially viewers ko history kam pata ho toh unke liye aur context useful hota",
  "kabhi kabhi laga ki geopolitical angle zyada tha aur humanitarian side comparatively thoda kam cover hua",
  "itna sensitive topic hai toh terms aur claims ko aur carefully qualify karna chahiye, warna log apni side ka proof samajh lete hain",
  "video balanced tha but mujhe laga sanctions aur backchannel diplomacy par thoda aur detail dena chahiye tha",
  "analysis strong thi par maps ya visual markers aur hote toh samajhna aur easy hota, especially mobile pe dekhne walon ke liye",
  "aaj kal sab log certainty ke saath bolte hain, isliye jab outcome uncertain ho toh us uncertainty ko aur highlight karna chahiye",
  "conflict ke roots par do minute aur spend karte toh new viewers ke liye overall framing aur better hoti",
  "headline ke beyond jaana achha tha, lekin civilian casualties aur displacement numbers ka mention aur solid impact create karta",
  "topic ka weight dekhte hue description me trusted reading links add karna useful hota, taaki log khud bhi verify kar saken",
];

const latestQuestionOpeners = [
  "Koi batao",
  "Mera sawaal yeh hai",
  "Samajhna chahta hoon",
  "Ek doubt hai",
  "Can someone explain",
  "Mujhe genuinely poochna hai",
  "Yeh clear karo",
  "Question simple hai",
  "Is point par confusion hai",
  "Ek cheez samajh nahi aayi",
];

const latestQuestionBodies = [
  "agar situation aur escalate hoti hai toh kya sirf region affect hoga ya global fuel prices aur markets par bhi immediate impact dikhega",
  "kya yeh conflict direct full-scale war me badal sakta hai ya mostly calibrated retaliation aur diplomatic pressure ke level par hi rahega",
  "UN aur major powers itni statements dete hain, practical ground pe unka actual influence kitna hota hai",
  "jo missile defense aur counter-strike systems discuss hue, unka real success rate kitna reliable maana jata hai",
  "kya public narrative aur military reality me itna difference hota hai jitna experts bolte hain, ya yeh bhi ek media framing issue hai",
  "agar ceasefire ki baat hoti bhi hai toh trust deficit itna high hone ke baad implementation possible kaise hota hai",
  "is situation ka India par foreign policy ya oil import level par koi meaningful indirect effect aa sakta hai kya",
  "jitni countries involved ya aligned lag rahi hain, unme se kaun actually direct intervention se bachna chahega aur kyun",
  "history dekh kar kya yeh pattern repeat hota dikhta hai jahan retaliation ka loop khatam karna sabko mushkil padta hai",
  "civilian evacuation aur aid access jaisi cheezein actual conflict phase me kaun coordinate karta hai aur kitni effective hoti hain",
];

const latestFatigueOpeners = [
  "Sach me",
  "Ab honestly",
  "Har roz",
  "News dekh dekh ke",
  "Public point of view se",
  "Common aadmi ke liye",
  "Mann uth gaya hai",
  "Kab tak",
  "Ye bhi reality hai",
  "Thak gaye yaar",
];

const latestFatigueBodies = [
  "har din naya alert, nayi strike aur nayi breaking news aati hai, lekin ground par logon ki safety phir bhi guarantee nahi hoti",
  "common audience ko itni contradictory reports milti hain ki empathy aur exhaustion dono saath me feel hote hain",
  "jitna zyada conflict content aata hai utna lagta hai ki normalcy ek luxury ban gayi hai un regions ke liye",
  "hum screen par dekh kar overwhelm ho jaate hain toh jo log wahan live kar rahe hain unka mental state soch kar hi heavy feel hota hai",
  "online sab log experts ban jaate hain, par asli suffering ko trend aur hashtag se measure nahi kiya ja sakta",
  "ek taraf propaganda, ek taraf panic, beech me truth dhoondhna bhi full-time job jaisa lagne laga hai",
  "log camps me baith kar future ka wait kar rahe hote hain aur baahar duniya bas positions count kar rahi hoti hai",
  "kabhi kabhi lagta hai headlines human beings ko numbers me convert kar deti hain aur wahi sabse disturbing part hai",
  "yeh sab dekh kar bas itna lagta hai ki de-escalation koi moral luxury nahi, practical necessity hai",
  "breaking news culture ne har crisis ko fast content bana diya hai, par trauma fast nahi hota",
];

const latestPureHindiBodies = [
  "वीडियो देखकर पहली बार पूरा क्रम साफ समझ आया, वरना हर चैनल पर सिर्फ अलग अलग डर फैलाने वाली हेडलाइन ही दिख रही थी",
  "युद्ध की बहस में सबसे दुखद बात यह है कि सबसे बड़ी कीमत हमेशा सामान्य लोग चुकाते हैं और वही बात यहाँ सबसे ज़्यादा महसूस हुई",
  "तुमने भावनात्मक शोर से हटकर स्थिति को शांत तरीके से समझाया, इसलिए यह वीडियो बाकी क्लिप्स से अधिक भरोसेमंद लगा",
  "अगर दुनिया सच में शांति चाहती है तो सिर्फ बयान नहीं, ज़मीन पर दबाव और मानवीय सहायता दोनों एक साथ बढ़ाने होंगे",
  "इस तरह के संघर्ष में जीत किसी की भी दिखाई दे, हार अंत में इंसानियत की ही लगती है",
  "इतिहास बार बार चेतावनी देता है कि बदले की श्रृंखला लंबी होती है, पर नेताओं को यह बात सबसे अंत में समझ आती है",
  "तथ्यों के साथ मानवीय पक्ष भी दिखाना ज़रूरी था, और यही कारण है कि यह वीडियो सिर्फ खबर नहीं बल्कि संदर्भ भी देता है",
  "लोग अक्सर नक्शे और गठबंधनों की बात करते हैं, लेकिन विस्थापित परिवारों की चिंता उतनी ही महत्वपूर्ण है",
  "इस विषय पर शोर बहुत है, पर स्पष्टता कम है; इसलिए ऐसी संतुलित व्याख्या वास्तव में उपयोगी लगती है",
  "सबसे बड़ा डर यही है कि एक गलत कदम पूरे क्षेत्र को और अधिक अस्थिर बना सकता है",
];

const latestClosers = [
  "baaki log bhi calmly discuss karo",
  "facts check karke hi react karna chahiye",
  "aise context wale videos aur banao",
  "comment section me civil rehna important hai",
  "yeh topic lightly lene jaisa nahi hai",
  "next update bhi isi clarity ke saath dena",
  "neutral breakdown ki value isi me samajh aati hai",
  "ground reality ko center me rakhna zaroori hai",
  "hope situation de-escalate ho",
  "insaniyat sabse pehle honi chahiye",
];

const pick = <T>(items: readonly T[], seed: number) =>
  items[Math.abs(seed) % items.length]!;

const getSpecialVideoKind = (index: number): SpecialVideoKind | null => {
  if (index === 0) {
    return "diverse-comments";
  }

  if (index === 1) {
    return "war-update";
  }

  return null;
};

const makeTitle = (index: number) => {
  if (index === 0) {
    return latestVideoTitle;
  }

  if (index === 1) {
    return secondLatestVideoTitle;
  }

  const theme = pick(themes, index);
  const suffix = pick(titleSuffixes, index * 7 + 3);
  return `${theme} ${index + 1}: ${suffix}`;
};

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

const makeLatestCommentTone = (commentIndex: number): LatestCommentTone => {
  const tones: LatestCommentTone[] = [
    "concern",
    "analysis",
    "critique",
    "question",
    "fatigue",
  ];
  return tones[commentIndex % tones.length]!;
};

const makeDiverseLatestVideoCommentText = (commentIndex: number) => {
  const moodIndex = Math.floor(commentIndex / diverseIntentions.length);
  const intentionIndex = commentIndex % diverseIntentions.length;
  const opener = pick(diverseCommentOpeners, commentIndex * 3 + 1);
  const mood = diverseMoodDescriptors[moodIndex]!;
  const intention = diverseIntentions[intentionIndex]!;
  const observation = pick(diverseObservationAngles, commentIndex * 5 + 2);
  const effect = pick(diverseEmotionalEffects, commentIndex * 7 + 4);
  const closer = pick(diverseClosers, commentIndex * 11 + 6);

  return `${opener}, main ${mood} feel karte hue yeh likh raha hoon ki ${intention}. ${observation} ${effect}. ${closer}.`;
};

const makeLatestVideoCommentText = (commentIndex: number, title: string) => {
  if (commentIndex % 11 === 0) {
    const body = pick(latestPureHindiBodies, commentIndex);
    const closer = pick(latestClosers, commentIndex * 3 + 1);
    return `${body}. ${closer}.`;
  }

  const tone = makeLatestCommentTone(commentIndex);
  const openerPool =
    tone === "concern"
      ? latestConcernOpeners
      : tone === "analysis"
        ? latestAnalysisOpeners
        : tone === "critique"
          ? latestCritiqueOpeners
          : tone === "question"
            ? latestQuestionOpeners
            : latestFatigueOpeners;
  const bodyPool =
    tone === "concern"
      ? latestConcernBodies
      : tone === "analysis"
        ? latestAnalysisBodies
        : tone === "critique"
          ? latestCritiqueBodies
          : tone === "question"
            ? latestQuestionBodies
            : latestFatigueBodies;

  const opener = pick(openerPool, commentIndex * 5 + 1);
  const body = pick(bodyPool, commentIndex * 7 + 3);
  const closer = pick(latestClosers, commentIndex * 11 + 5);
  const titleRef =
    commentIndex % 9 === 0 ? ` ${title.split(":")[0]?.toLowerCase()} ke context me` : "";
  const extra =
    commentIndex % 6 === 0
      ? " aur isi wajah se impulsive reaction dene se pehle context dekhna zaroori lagta hai"
      : commentIndex % 5 === 0
        ? " comment section me bhi log isi angle par divided dikh rahe hain"
        : commentIndex % 7 === 0
          ? " is point par thoda aur verified data mil jaye toh picture aur clear hogi"
          : " isliye is topic par oversimplified takes dekh kar irritate bhi hota hoon";

  return `${opener}, ${body}${titleRef}${extra}. ${closer}.`;
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
      thumbnailUrl: null as string | null,
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
          getSpecialVideoKind(videoIndex) === "diverse-comments"
            ? makeDiverseLatestVideoCommentText(commentIndex)
            : getSpecialVideoKind(videoIndex) === "war-update"
              ? makeLatestVideoCommentText(commentIndex, video.title)
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
