"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Instagram, Youtube, Twitter, Linkedin, Facebook,
  Sparkles, TrendingUp, Clock, Hash, Video, Image,
  Send, Calendar, Loader2, CheckCircle, X, ChevronRight,
  Zap, Globe, BarChart2, Plus, Trash2, Eye, RefreshCw,
  MessageCircle, Mail, Play, FileImage, Wand2, AlarmClock
} from "lucide-react";

// ── Platform config ─────────────────────────────────────
const PLATFORMS = [
  { id: "instagram", label: "Instagram",  Icon: Instagram,  color: "#E1306C", bg: "bg-pink-50",    border: "border-pink-300",    accent: "text-pink-600"   },
  { id: "facebook",  label: "Facebook",   Icon: Facebook,   color: "#1877F2", bg: "bg-blue-50",    border: "border-blue-300",    accent: "text-blue-600"   },
  { id: "youtube",   label: "YouTube",    Icon: Youtube,    color: "#FF0000", bg: "bg-red-50",     border: "border-red-300",     accent: "text-red-600"    },
  { id: "twitter",   label: "Twitter / X",Icon: Twitter,    color: "#1DA1F2", bg: "bg-sky-50",     border: "border-sky-300",     accent: "text-sky-600"    },
  { id: "linkedin",  label: "LinkedIn",   Icon: Linkedin,   color: "#0A66C2", bg: "bg-indigo-50",  border: "border-indigo-300",  accent: "text-indigo-600" },
];

const CONTENT_TYPES = [
  { id: "post",    label: "Post",        icon: <FileImage size={16} /> },
  { id: "video",   label: "Short Video", icon: <Play size={16} />      },
  { id: "story",   label: "Story",       icon: <Eye size={16} />       },
  { id: "reel",    label: "Reel / Short",icon: <Video size={16} />     },
];

const SEND_MODES = [
  { id: "schedule", label: "Schedule",      icon: <AlarmClock size={16} /> },
  { id: "instant",  label: "Send Now",      icon: <Zap size={16} />        },
  { id: "email",    label: "+ Email",       icon: <Mail size={16} />       },
  { id: "whatsapp", label: "+ WhatsApp",    icon: <MessageCircle size={16}/> },
];

const getToken = () =>
  typeof window !== "undefined" ? localStorage.getItem("token") : null;

// ── AI API call ──────────────────────────────────────────
async function callAI(prompt, maxTokens = 800) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await res.json();
  return data.content?.[0]?.text || "";
}

// ── Main Component ───────────────────────────────────────
export default function SocialCampaignStudio() {
  const router = useRouter();

  // Core state
  const [step, setStep] = useState(1); // 1=Platform, 2=Content, 3=AI, 4=Schedule
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const [contentType, setContentType] = useState("post");
  const [sendModes, setSendModes] = useState(["schedule"]);
  const [campaignName, setCampaignName] = useState("");
  const [topic, setTopic] = useState("");
  const [industry, setIndustry] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState([]);
  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaUrls, setMediaUrls] = useState([]);
  const [emailRecipients, setEmailRecipients] = useState("");
  const [whatsappNumbers, setWhatsappNumbers] = useState("");
  const [statusMessage, setStatusMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  // AI state
  const [aiLoading, setAiLoading] = useState({});
  const [trendingTopics, setTrendingTopics] = useState([]);
  const [suggestedTimes, setSuggestedTimes] = useState([]);
  const [generatedCaptions, setGeneratedCaptions] = useState([]);
  const [generatedHashtags, setGeneratedHashtags] = useState([]);
  const [videoScript, setVideoScript] = useState("");
  const [imagePrompt, setImagePrompt] = useState("");
  const [aiPanel, setAiPanel] = useState(null); // which AI panel open

  const fileInputRef = useRef(null);

  // ── Platform toggle ──────────────────────────────────
  const togglePlatform = (id) =>
    setSelectedPlatforms((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : [...p, id]
    );

  const toggleSendMode = (id) =>
    setSendModes((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : [...p, id]
    );

  // ── AI: Trending Topics ──────────────────────────────
  const fetchTrending = async () => {
    if (!industry) return;
    setAiLoading((p) => ({ ...p, trending: true }));
    try {
      const text = await callAI(
        `Give me 8 trending topics right now for ${industry} industry that are perfect for social media posts in 2025. 
         Format: JSON array of objects with fields: topic (string), reason (short string), platforms (array of: instagram/youtube/twitter/linkedin/facebook).
         Only return valid JSON, no extra text.`
      );
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setTrendingTopics(parsed);
    } catch (e) {
      console.error(e);
    } finally {
      setAiLoading((p) => ({ ...p, trending: false }));
    }
  };

  // ── AI: Generate Caption ─────────────────────────────
  const generateCaption = async () => {
    if (!topic) return;
    setAiLoading((p) => ({ ...p, caption: true }));
    try {
      const platformNames = selectedPlatforms.join(", ") || "social media";
      const text = await callAI(
        `Create 3 engaging social media captions for the topic: "${topic}"
         Platforms: ${platformNames}
         Content type: ${contentType}
         Industry: ${industry || "general"}
         
         Rules:
         - Caption 1: Professional tone
         - Caption 2: Casual/fun tone  
         - Caption 3: Story-telling tone
         - Each caption max 150 words
         - Include 1-2 emojis per caption
         - Add a strong CTA at end
         
         Format: JSON array of objects with fields: tone (string), caption (string).
         Only return valid JSON, no extra text.`
      );
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setGeneratedCaptions(parsed);
    } catch (e) {
      console.error(e);
    } finally {
      setAiLoading((p) => ({ ...p, caption: false }));
    }
  };

  // ── AI: Generate Hashtags ────────────────────────────
  const generateHashtags = async () => {
    if (!topic) return;
    setAiLoading((p) => ({ ...p, hashtags: true }));
    try {
      const text = await callAI(
        `Generate 20 high-performing hashtags for topic: "${topic}" on ${selectedPlatforms.join(", ") || "social media"}.
         Mix: 5 mega (1M+), 8 mid (100K-1M), 7 niche (<100K) hashtags.
         Format: JSON array of objects: { tag: string (without #), size: "mega"|"mid"|"niche", reach: string }.
         Only return valid JSON, no extra text.`
      );
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setGeneratedHashtags(parsed);
    } catch (e) {
      console.error(e);
    } finally {
      setAiLoading((p) => ({ ...p, hashtags: false }));
    }
  };

  // ── AI: Best Post Times ──────────────────────────────
  const suggestBestTimes = async () => {
    setAiLoading((p) => ({ ...p, times: true }));
    try {
      const text = await callAI(
        `What are the best times to post on ${selectedPlatforms.join(", ")} for maximum engagement in ${industry || "general"} industry in India (IST timezone)?
         Format: JSON array of objects: { platform: string, times: array of strings (HH:MM IST), reason: string, engagement: string }.
         Only return valid JSON, no extra text.`
      );
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setSuggestedTimes(parsed);
    } catch (e) {
      console.error(e);
    } finally {
      setAiLoading((p) => ({ ...p, times: false }));
    }
  };

  // ── AI: 15-sec Video Script ──────────────────────────
  const generateVideoScript = async () => {
    if (!topic) return;
    setAiLoading((p) => ({ ...p, video: true }));
    try {
      const text = await callAI(
        `Write a 15-second short video script for topic: "${topic}" for ${selectedPlatforms.join(", ")}.
         Format it as:
         [0-3s] Hook: ...
         [3-8s] Value: ...
         [8-13s] CTA: ...
         [13-15s] End card: ...
         
         Also provide: voiceover text, on-screen text overlays, suggested background music mood.
         Keep it punchy, engaging, trend-aware. Industry: ${industry || "general"}.`,
        600
      );
      setVideoScript(text);
    } catch (e) {
      console.error(e);
    } finally {
      setAiLoading((p) => ({ ...p, video: false }));
    }
  };

  // ── AI: Image Prompt ─────────────────────────────────
  const generateImagePrompt = async () => {
    if (!topic) return;
    setAiLoading((p) => ({ ...p, image: true }));
    try {
      const text = await callAI(
        `Create a detailed image generation prompt for a social media post about: "${topic}".
         Platform: ${selectedPlatforms[0] || "instagram"}
         Style: photorealistic, professional, high-engagement
         Include: composition, lighting, colors, mood, style, aspect ratio recommendation.
         Also suggest 3 alternative styles (minimalist, vibrant, corporate).
         Keep total under 200 words.`
      );
      setImagePrompt(text);
    } catch (e) {
      console.error(e);
    } finally {
      setAiLoading((p) => ({ ...p, image: false }));
    }
  };

  // ── Media upload ─────────────────────────────────────
  const uploadToCloudinary = async (file) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("upload_preset", "application");
    const res  = await fetch("https://api.cloudinary.com/v1_1/dz1gfppll/auto/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "Upload failed");
    return data.secure_url;
  };

  const handleMediaChange = (e) => {
    const files = Array.from(e.target.files || []);
    setMediaFiles((p) => [...p, ...files]);
  };

  // ── Submit ───────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPlatforms.length) {
      setStatusMessage({ type: "error", text: "Please select at least one platform." });
      return;
    }
    if (!caption) {
      setStatusMessage({ type: "error", text: "Please add a caption." });
      return;
    }
    setLoading(true);
    setStatusMessage(null);

    try {
      // Upload media
      let uploadedUrls = [];
      if (mediaFiles.length > 0) {
        setStatusMessage({ type: "info", text: "Uploading media..." });
        uploadedUrls = await Promise.all(mediaFiles.map(uploadToCloudinary));
      }

      const payload = {
        campaignName,
        platforms: selectedPlatforms,
        contentType,
        sendModes,
        topic,
        industry,
        caption,
        hashtags: hashtags.map((h) => (h.startsWith("#") ? h : "#" + h)),
        mediaUrls: [...mediaUrls, ...uploadedUrls],
        scheduledTime: sendModes.includes("schedule") ? scheduledTime : null,
        emailRecipients: sendModes.includes("email")
          ? emailRecipients.split(/[\n,]+/).map((x) => x.trim()).filter(Boolean)
          : [],
        whatsappNumbers: sendModes.includes("whatsapp")
          ? whatsappNumbers.split(/[\n,]+/).map((x) => x.trim()).filter(Boolean)
          : [],
        videoScript: contentType === "video" || contentType === "reel" ? videoScript : null,
        imagePrompt: contentType === "post" || contentType === "story" ? imagePrompt : null,
      };

      const res = await fetch("/api/social-campaign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setStatusMessage({ type: "success", text: "🎉 Campaign created successfully!" });
        setTimeout(() => router.push("/admin/crm/campaign"), 1500);
      } else {
        const err = await res.json();
        setStatusMessage({ type: "error", text: err?.error || "Something went wrong." });
      }
    } catch (err) {
      setStatusMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  // ── Step indicator ────────────────────────────────────
  const steps = [
    { n: 1, label: "Platforms"  },
    { n: 2, label: "Content"    },
    { n: 3, label: "AI Studio"  },
    { n: 4, label: "Schedule"   },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white font-sans">
      {/* BG mesh */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-violet-600/10 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full bg-cyan-600/10 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-10">

        {/* ── Header ── */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-1.5 text-xs font-bold text-violet-300 uppercase tracking-widest mb-4">
            <Sparkles size={12} /> AI-Powered Social Media Studio
          </div>
          <h1 className="text-5xl font-black tracking-tight bg-gradient-to-r from-white via-violet-200 to-cyan-300 bg-clip-text text-transparent">
            Social Campaign Studio
          </h1>
          <p className="text-slate-400 mt-3 text-lg">Create, schedule & send across all platforms with AI</p>
        </div>

        {/* ── Step Bar ── */}
        <div className="flex items-center justify-center gap-0 mb-10">
          {steps.map((s, i) => (
            <div key={s.n} className="flex items-center">
              <button
                type="button"
                onClick={() => setStep(s.n)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
                  step === s.n
                    ? "bg-violet-600 text-white shadow-lg shadow-violet-500/30"
                    : step > s.n
                    ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-white/5 text-slate-500 border border-white/10"
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-black ${step === s.n ? "bg-white text-violet-600" : ""}`}>
                  {step > s.n ? "✓" : s.n}
                </span>
                {s.label}
              </button>
              {i < steps.length - 1 && (
                <div className={`w-8 h-px mx-1 ${step > s.n ? "bg-emerald-500/50" : "bg-white/10"}`} />
              )}
            </div>
          ))}
        </div>

        {/* ── Status ── */}
        {statusMessage && (
          <div className={`mb-6 p-4 rounded-2xl flex items-center gap-3 text-sm font-bold ${
            statusMessage.type === "success" ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
            : statusMessage.type === "info" ? "bg-blue-500/10 border border-blue-500/30 text-blue-300"
            : "bg-rose-500/10 border border-rose-500/30 text-rose-300"
          }`}>
            {statusMessage.type === "success" ? <CheckCircle size={18}/> : <X size={18}/>}
            {statusMessage.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* ══════════ STEP 1: PLATFORMS ══════════ */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              {/* Campaign name */}
              <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
                <h2 className="text-xl font-black mb-5 flex items-center gap-2">
                  <Globe size={20} className="text-violet-400" /> Campaign Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="text-xs font-black uppercase text-slate-500 tracking-widest block mb-2">Campaign Name</label>
                    <input
                      type="text" value={campaignName} onChange={(e) => setCampaignName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-slate-600 focus:outline-none focus:border-violet-500 font-semibold"
                      placeholder="Summer Sale 2025" required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-black uppercase text-slate-500 tracking-widest block mb-2">Industry / Niche</label>
                    <input
                      type="text" value={industry} onChange={(e) => setIndustry(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-slate-600 focus:outline-none focus:border-violet-500 font-semibold"
                      placeholder="e.g. Fashion, Tech, Food, Fitness..."
                    />
                  </div>
                </div>
              </div>

              {/* Platform selector */}
              <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
                <h2 className="text-xl font-black mb-2 flex items-center gap-2">
                  <BarChart2 size={20} className="text-cyan-400" /> Select Platforms
                </h2>
                <p className="text-slate-500 text-sm mb-6">Choose where you want to publish</p>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {PLATFORMS.map(({ id, label, Icon, color, bg, border, accent }) => (
                    <button
                      key={id} type="button" onClick={() => togglePlatform(id)}
                      className={`relative flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all ${
                        selectedPlatforms.includes(id)
                          ? "border-violet-500 bg-violet-500/10 scale-105 shadow-lg shadow-violet-500/20"
                          : "border-white/10 bg-white/3 hover:border-white/20 hover:bg-white/5"
                      }`}
                    >
                      {selectedPlatforms.includes(id) && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-violet-500 rounded-full flex items-center justify-center">
                          <CheckCircle size={12} />
                        </div>
                      )}
                      <Icon size={32} style={{ color: selectedPlatforms.includes(id) ? color : "#64748b" }} />
                      <span className={`text-xs font-black ${selectedPlatforms.includes(id) ? "text-white" : "text-slate-500"}`}>
                        {label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Content type */}
              <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
                <h2 className="text-xl font-black mb-5 flex items-center gap-2">
                  <Video size={20} className="text-pink-400" /> Content Type
                </h2>
                <div className="flex flex-wrap gap-3">
                  {CONTENT_TYPES.map((ct) => (
                    <button
                      key={ct.id} type="button" onClick={() => setContentType(ct.id)}
                      className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all ${
                        contentType === ct.id
                          ? "bg-violet-600 text-white shadow-lg shadow-violet-500/30"
                          : "bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10"
                      }`}
                    >
                      {ct.icon} {ct.label}
                    </button>
                  ))}
                </div>
              </div>

              <button type="button" onClick={() => setStep(2)}
                className="w-full py-5 bg-gradient-to-r from-violet-600 to-cyan-600 rounded-2xl font-black text-lg flex items-center justify-center gap-2 hover:opacity-90 transition">
                Next: Create Content <ChevronRight size={20} />
              </button>
            </div>
          )}

          {/* ══════════ STEP 2: CONTENT ══════════ */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">

              {/* Topic */}
              <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
                <h2 className="text-xl font-black mb-5 flex items-center gap-2">
                  <Wand2 size={20} className="text-violet-400" /> Post Topic
                </h2>
                <input
                  type="text" value={topic} onChange={(e) => setTopic(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-slate-600 focus:outline-none focus:border-violet-500 font-semibold"
                  placeholder="What is this post about? e.g. New product launch, Diwali sale, Company milestone..."
                />
              </div>

              {/* Caption */}
              <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-black flex items-center gap-2">
                    <FileImage size={20} className="text-cyan-400" /> Caption
                  </h2>
                  <button type="button" onClick={generateCaption} disabled={!topic || aiLoading.caption}
                    className="flex items-center gap-2 px-4 py-2 bg-violet-600/20 border border-violet-500/30 text-violet-300 rounded-xl text-xs font-bold hover:bg-violet-600/30 disabled:opacity-40">
                    {aiLoading.caption ? <Loader2 size={12} className="animate-spin"/> : <Sparkles size={12}/>}
                    AI Generate
                  </button>
                </div>

                {/* AI generated captions */}
                {generatedCaptions.length > 0 && (
                  <div className="grid grid-cols-1 gap-3 mb-4">
                    {generatedCaptions.map((c, i) => (
                      <div key={i}
                        onClick={() => setCaption(c.caption)}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                          caption === c.caption
                            ? "border-violet-500 bg-violet-500/10"
                            : "border-white/10 bg-white/3 hover:border-white/20"
                        }`}
                      >
                        <div className="text-[10px] font-black uppercase text-violet-400 tracking-widest mb-1">{c.tone}</div>
                        <p className="text-sm text-slate-300 leading-relaxed">{c.caption}</p>
                      </div>
                    ))}
                  </div>
                )}

                <textarea
                  rows="5" value={caption} onChange={(e) => setCaption(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-slate-600 focus:outline-none focus:border-violet-500 font-medium text-sm leading-relaxed resize-none"
                  placeholder="Write or generate your caption..."
                />
                <p className="text-right text-xs text-slate-600 mt-1">{caption.length} chars</p>
              </div>

              {/* Hashtags */}
              <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-black flex items-center gap-2">
                    <Hash size={20} className="text-emerald-400" /> Hashtags
                  </h2>
                  <button type="button" onClick={generateHashtags} disabled={!topic || aiLoading.hashtags}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs font-bold hover:bg-emerald-600/30 disabled:opacity-40">
                    {aiLoading.hashtags ? <Loader2 size={12} className="animate-spin"/> : <Sparkles size={12}/>}
                    AI Generate
                  </button>
                </div>

                {generatedHashtags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {generatedHashtags.map((h, i) => (
                      <button
                        key={i} type="button"
                        onClick={() => setHashtags((p) => p.includes(h.tag) ? p.filter((x) => x !== h.tag) : [...p, h.tag])}
                        className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${
                          hashtags.includes(h.tag)
                            ? "bg-emerald-600 text-white"
                            : h.size === "mega" ? "bg-red-500/10 border border-red-500/30 text-red-300 hover:bg-red-500/20"
                            : h.size === "mid"  ? "bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20"
                            : "bg-blue-500/10 border border-blue-500/30 text-blue-300 hover:bg-blue-500/20"
                        }`}
                      >
                        #{h.tag}
                        <span className="ml-1 opacity-60 text-[9px]">{h.size}</span>
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap gap-2 mb-3">
                  {hashtags.map((h, i) => (
                    <span key={i} className="flex items-center gap-1 bg-violet-600/20 border border-violet-500/30 text-violet-300 px-3 py-1.5 rounded-full text-xs font-bold">
                      #{h}
                      <button type="button" onClick={() => setHashtags((p) => p.filter((_, idx) => idx !== i))}><X size={10}/></button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-violet-500 text-sm"
                  placeholder="Type a hashtag and press Enter..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const val = e.target.value.replace("#", "").trim();
                      if (val) { setHashtags((p) => [...new Set([...p, val])]); e.target.value = ""; }
                    }
                  }}
                />
              </div>

              {/* Media upload */}
              <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
                <h2 className="text-xl font-black mb-5 flex items-center gap-2">
                  <Image size={20} className="text-pink-400" /> Media
                </h2>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-white/10 rounded-2xl p-10 text-center cursor-pointer hover:border-violet-500/50 hover:bg-violet-500/5 transition-all"
                >
                  <UploadIcon className="mx-auto mb-3 text-slate-600" />
                  <p className="text-slate-500 font-semibold">Click to upload images or videos</p>
                  <p className="text-slate-700 text-xs mt-1">PNG, JPG, MP4, MOV up to 100MB</p>
                  <input ref={fileInputRef} type="file" multiple accept="image/*,video/*" className="hidden" onChange={handleMediaChange} />
                </div>
                {mediaFiles.length > 0 && (
                  <div className="flex flex-wrap gap-3 mt-4">
                    {mediaFiles.map((f, i) => (
                      <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-white/10">
                        {f.type.startsWith("image/")
                          ? <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full bg-white/10 flex items-center justify-center text-xs text-slate-400 font-bold p-2 text-center">{f.name}</div>
                        }
                        <button type="button" onClick={() => setMediaFiles((p) => p.filter((_, idx) => idx !== i))}
                          className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px]">✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <button type="button" onClick={() => setStep(1)}
                  className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl font-bold text-slate-400 hover:bg-white/10 transition">
                  ← Back
                </button>
                <button type="button" onClick={() => setStep(3)}
                  className="flex-[2] py-4 bg-gradient-to-r from-violet-600 to-cyan-600 rounded-2xl font-black flex items-center justify-center gap-2 hover:opacity-90 transition">
                  Next: AI Studio <Sparkles size={18}/>
                </button>
              </div>
            </div>
          )}

          {/* ══════════ STEP 3: AI STUDIO ══════════ */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">

              {/* Trending Topics */}
              <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
                <div className="flex justify-between items-center mb-5">
                  <h2 className="text-xl font-black flex items-center gap-2">
                    <TrendingUp size={20} className="text-orange-400" /> Trending Topics
                    <span className="text-xs font-normal text-slate-500">for your industry</span>
                  </h2>
                  <button type="button" onClick={fetchTrending} disabled={!industry || aiLoading.trending}
                    className="flex items-center gap-2 px-5 py-2.5 bg-orange-600/20 border border-orange-500/30 text-orange-300 rounded-xl text-xs font-bold hover:bg-orange-600/30 disabled:opacity-40">
                    {aiLoading.trending ? <Loader2 size={12} className="animate-spin"/> : <RefreshCw size={12}/>}
                    Fetch Trends
                  </button>
                </div>

                {!industry && (
                  <p className="text-slate-600 text-sm">Enter your industry in Step 1 first</p>
                )}

                {trendingTopics.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {trendingTopics.map((t, i) => (
                      <div key={i}
                        onClick={() => setTopic(t.topic)}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                          topic === t.topic
                            ? "border-orange-500 bg-orange-500/10"
                            : "border-white/10 bg-white/3 hover:border-white/20"
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-bold text-white text-sm">{t.topic}</span>
                          <div className="flex gap-1">
                            {(t.platforms || []).map((pl) => {
                              const plat = PLATFORMS.find((p) => p.id === pl);
                              if (!plat) return null;
                              return <plat.Icon key={pl} size={12} style={{ color: plat.color }} />;
                            })}
                          </div>
                        </div>
                        <p className="text-xs text-slate-500">{t.reason}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Best Time to Post */}
              <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
                <div className="flex justify-between items-center mb-5">
                  <h2 className="text-xl font-black flex items-center gap-2">
                    <Clock size={20} className="text-cyan-400" /> Best Times to Post
                  </h2>
                  <button type="button" onClick={suggestBestTimes} disabled={!selectedPlatforms.length || aiLoading.times}
                    className="flex items-center gap-2 px-5 py-2.5 bg-cyan-600/20 border border-cyan-500/30 text-cyan-300 rounded-xl text-xs font-bold hover:bg-cyan-600/30 disabled:opacity-40">
                    {aiLoading.times ? <Loader2 size={12} className="animate-spin"/> : <Sparkles size={12}/>}
                    Suggest Times
                  </button>
                </div>

                {suggestedTimes.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {suggestedTimes.map((s, i) => {
                      const plat = PLATFORMS.find((p) => p.id === s.platform?.toLowerCase());
                      return (
                        <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                          <div className="flex items-center gap-2 mb-2">
                            {plat && <plat.Icon size={16} style={{ color: plat.color }} />}
                            <span className="font-bold text-sm capitalize">{s.platform}</span>
                            <span className="ml-auto text-xs text-emerald-400 font-bold">{s.engagement}</span>
                          </div>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {(s.times || []).map((t, j) => (
                              <button key={j} type="button"
                                onClick={() => {
                                  const today = new Date().toISOString().split("T")[0];
                                  const [time] = t.split(" ");
                                  setScheduledTime(`${today}T${time}`);
                                }}
                                className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 rounded-lg text-xs font-bold hover:bg-cyan-500/20 transition">
                                {t}
                              </button>
                            ))}
                          </div>
                          <p className="text-xs text-slate-600">{s.reason}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 15-sec Video Script */}
              {(contentType === "video" || contentType === "reel") && (
                <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
                  <div className="flex justify-between items-center mb-5">
                    <h2 className="text-xl font-black flex items-center gap-2">
                      <Play size={20} className="text-red-400" /> 15-sec Video Script
                    </h2>
                    <button type="button" onClick={generateVideoScript} disabled={!topic || aiLoading.video}
                      className="flex items-center gap-2 px-5 py-2.5 bg-red-600/20 border border-red-500/30 text-red-300 rounded-xl text-xs font-bold hover:bg-red-600/30 disabled:opacity-40">
                      {aiLoading.video ? <Loader2 size={12} className="animate-spin"/> : <Wand2 size={12}/>}
                      Generate Script
                    </button>
                  </div>
                  {videoScript && (
                    <pre className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap bg-white/3 border border-white/10 rounded-2xl p-5 font-mono">
                      {videoScript}
                    </pre>
                  )}
                </div>
              )}

              {/* AI Image Prompt */}
              {(contentType === "post" || contentType === "story") && (
                <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
                  <div className="flex justify-between items-center mb-5">
                    <h2 className="text-xl font-black flex items-center gap-2">
                      <Image size={20} className="text-pink-400" /> AI Image Prompt
                    </h2>
                    <button type="button" onClick={generateImagePrompt} disabled={!topic || aiLoading.image}
                      className="flex items-center gap-2 px-5 py-2.5 bg-pink-600/20 border border-pink-500/30 text-pink-300 rounded-xl text-xs font-bold hover:bg-pink-600/30 disabled:opacity-40">
                      {aiLoading.image ? <Loader2 size={12} className="animate-spin"/> : <Sparkles size={12}/>}
                      Generate Prompt
                    </button>
                  </div>
                  {imagePrompt && (
                    <div className="bg-white/3 border border-white/10 rounded-2xl p-5">
                      <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{imagePrompt}</p>
                      <p className="text-xs text-slate-600 mt-3">Use this prompt in Midjourney, DALL-E, Firefly, or Stable Diffusion</p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-4">
                <button type="button" onClick={() => setStep(2)}
                  className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl font-bold text-slate-400 hover:bg-white/10 transition">
                  ← Back
                </button>
                <button type="button" onClick={() => setStep(4)}
                  className="flex-[2] py-4 bg-gradient-to-r from-violet-600 to-cyan-600 rounded-2xl font-black flex items-center justify-center gap-2 hover:opacity-90 transition">
                  Next: Schedule & Send <Calendar size={18}/>
                </button>
              </div>
            </div>
          )}

          {/* ══════════ STEP 4: SCHEDULE ══════════ */}
          {step === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">

              {/* Send mode */}
              <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
                <h2 className="text-xl font-black mb-5 flex items-center gap-2">
                  <Send size={20} className="text-violet-400" /> Send Options
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {SEND_MODES.map((sm) => (
                    <button key={sm.id} type="button" onClick={() => toggleSendMode(sm.id)}
                      className={`flex flex-col items-center gap-2 p-5 rounded-2xl border-2 transition-all ${
                        sendModes.includes(sm.id)
                          ? "border-violet-500 bg-violet-500/10"
                          : "border-white/10 bg-white/3 hover:border-white/20"
                      }`}
                    >
                      <span className={sendModes.includes(sm.id) ? "text-violet-400" : "text-slate-600"}>{sm.icon}</span>
                      <span className={`text-xs font-black ${sendModes.includes(sm.id) ? "text-white" : "text-slate-500"}`}>{sm.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Schedule time */}
              {sendModes.includes("schedule") && (
                <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
                  <h2 className="text-xl font-black mb-5 flex items-center gap-2">
                    <AlarmClock size={20} className="text-cyan-400" /> Schedule Time
                  </h2>
                  <input
                    type="datetime-local" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-violet-500 font-semibold"
                  />
                </div>
              )}

              {/* Email recipients */}
              {sendModes.includes("email") && (
                <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
                  <h2 className="text-xl font-black mb-4 flex items-center gap-2">
                    <Mail size={20} className="text-blue-400" /> Email Recipients
                  </h2>
                  <textarea rows="4" value={emailRecipients} onChange={(e) => setEmailRecipients(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-slate-600 focus:outline-none focus:border-violet-500 font-mono text-sm resize-none"
                    placeholder="john@example.com, sara@test.com&#10;one per line or comma separated"
                  />
                </div>
              )}

              {/* WhatsApp numbers */}
              {sendModes.includes("whatsapp") && (
                <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
                  <h2 className="text-xl font-black mb-4 flex items-center gap-2">
                    <MessageCircle size={20} className="text-emerald-400" /> WhatsApp Numbers
                  </h2>
                  <textarea rows="4" value={whatsappNumbers} onChange={(e) => setWhatsappNumbers(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-slate-600 focus:outline-none focus:border-violet-500 font-mono text-sm resize-none"
                    placeholder="+91 98765 43210&#10;one per line or comma separated"
                  />
                </div>
              )}

              {/* Summary card */}
              <div className="bg-gradient-to-br from-violet-600/10 to-cyan-600/10 border border-violet-500/20 rounded-3xl p-8">
                <h2 className="text-xl font-black mb-5">Campaign Summary</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500 text-xs font-black uppercase tracking-widest">Campaign</span>
                    <p className="text-white font-bold mt-1">{campaignName || "—"}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-xs font-black uppercase tracking-widest">Platforms</span>
                    <div className="flex gap-2 mt-1">
                      {selectedPlatforms.map((id) => {
                        const p = PLATFORMS.find((x) => x.id === id);
                        return p ? <p.Icon key={id} size={18} style={{ color: p.color }} /> : null;
                      })}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500 text-xs font-black uppercase tracking-widest">Content Type</span>
                    <p className="text-white font-bold mt-1 capitalize">{contentType}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-xs font-black uppercase tracking-widest">Hashtags</span>
                    <p className="text-white font-bold mt-1">{hashtags.length} added</p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-xs font-black uppercase tracking-widest">Media</span>
                    <p className="text-white font-bold mt-1">{mediaFiles.length} file{mediaFiles.length !== 1 ? "s" : ""}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-xs font-black uppercase tracking-widest">Schedule</span>
                    <p className="text-white font-bold mt-1">
                      {sendModes.includes("instant") ? "Instant" : scheduledTime ? new Date(scheduledTime).toLocaleString("en-IN") : "Not set"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button type="button" onClick={() => setStep(3)}
                  className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl font-bold text-slate-400 hover:bg-white/10 transition">
                  ← Back
                </button>
                <button type="submit" disabled={loading}
                  className="flex-[2] py-5 bg-gradient-to-r from-violet-600 to-cyan-600 rounded-2xl font-black text-lg flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-50">
                  {loading ? <Loader2 className="animate-spin" size={22}/> : <><Send size={22}/> Launch Campaign</>}
                </button>
              </div>
            </div>
          )}

        </form>
      </div>
    </div>
  );
}

// tiny svg placeholder
function UploadIcon({ className }) {
  return (
    <svg className={className} width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    </svg>
  );
}