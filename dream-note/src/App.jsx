import { useState, useEffect, useRef } from "react";
import { Mic, Square, BookOpen, Moon, Clock, Trash2, ChevronLeft, ChevronRight, PenLine, Star, Search, ArrowUpDown, X, Plus, Pencil, Check, Calendar, BarChart3, Settings, Download, Upload, Copy, Lock, Bell, Delete } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { SpeechRecognition } from "@capacitor-community/speech-recognition";
import { LocalNotifications } from "@capacitor/local-notifications";
import { App as CapApp } from "@capacitor/app";

// 네이티브(안드로이드) 여부 + 영구 저장소 헬퍼
const isNative = Capacitor.isNativePlatform();
const store = {
  async get(key) { try { const { value } = await Preferences.get({ key }); return value; } catch (e) { return null; } },
  async set(key, value) { try { await Preferences.set({ key, value }); } catch (e) { console.error("저장 실패", e); } },
};

// ── palette: 새벽빛(pre-dawn) ──────────────────────────────
const C = {
  night:     "#13122A",
  raised:    "#1C1A3C",
  card:      "#232048",
  cardLine:  "rgba(173,169,212,0.14)",
  glow:      "#F0A87E",   // 동트는 빛
  glowSoft:  "#F4C9A8",
  violet:    "#7A6FB0",
  lavender:  "#ADA9D4",   // 흐린 글자
  moon:      "#F2F0FA",   // 밝은 글자
};

const STORE_KEY = "dream-journal-entries";
const serif = "'Gowun Batang', serif";
const sans  = "'Gowun Dodum', sans-serif";

const W = ["일","월","화","수","목","금","토"];
const pad = (n) => String(n).padStart(2, "0");
const toLocalInput = (d) => {
  const t = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return t.toISOString().slice(0, 16);
};
const fmtDate = (iso) => { const d = new Date(iso); return `${d.getFullYear()}년 ${d.getMonth()+1}월 ${d.getDate()}일`; };
const fmtTime = (iso) => {
  const d = new Date(iso), h = d.getHours();
  const ap = h < 12 ? "오전" : "오후", hh = h % 12 === 0 ? 12 : h % 12;
  return `${ap} ${hh}:${pad(d.getMinutes())}`;
};
const dayKey = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

// 시간대 구간
const SLOTS = [
  { label: "새벽", from: 0, to: 5 },
  { label: "아침", from: 5, to: 8 },
  { label: "오전", from: 8, to: 12 },
  { label: "오후", from: 12, to: 18 },
  { label: "밤", from: 18, to: 24 },
];

// 느낌·유형 태그
const TAGS = ["악몽", "길몽", "자각몽", "반복되는 꿈", "생생함", "평온", "뒤숭숭"];

// 깬 뒤 기분 (선택) — 1~5
const MOODS = [
  { v: 1, emoji: "😣", label: "나쁨" },
  { v: 2, emoji: "😟", label: "별로" },
  { v: 3, emoji: "😐", label: "보통" },
  { v: 4, emoji: "🙂", label: "좋음" },
  { v: 5, emoji: "😊", label: "아주 좋음" },
];
const moodOf = (v) => MOODS.find((m) => m.v === v) || null;

// 꿈 상징 사전 (오프라인 해몽) — 정답이 아닌 흔한 풀이
// variants: 주변 단어(cues)가 있으면 그 풀이를 우선 적용
const SYMBOLS = [
  { name: "물", match: ["물", "강", "호수", "바다", "파도", "수영"], meaning: "감정과 무의식을 비추는 상징이에요.", q: "지금 가장 크게 느끼는 감정은 무엇인가요?",
    variants: [
      { cues: ["맑", "깨끗", "잔잔", "고요", "투명", "반짝"], meaning: "맑고 잔잔한 물은 마음이 평온하고 감정이 잘 정돈돼 있다는 신호로 풀이돼요." },
      { cues: ["흐리", "탁", "더러", "거센", "거칠", "빠지", "휩쓸", "넘치", "범람", "쏟아", "잠기"], meaning: "흐리거나 거센 물은 감당하기 벅찬 감정이나 마음의 동요를 비추기도 해요." },
    ] },
  { name: "불", match: ["불", "화재", "불길", "타오", "불타"], meaning: "강한 열정이나 분노, 또는 무언가를 끝내고 새로 시작하려는 변화의 에너지를 나타내요.",
    variants: [
      { cues: ["번지", "집어삼", "휩싸", "퍼지", "무서"], meaning: "걷잡을 수 없이 번지는 불은 감당하기 어려운 감정이나 통제를 벗어난 상황을 비추기도 해요." },
      { cues: ["따뜻", "모닥", "촛", "은은"], meaning: "은은한 불은 안정과 온기, 마음속 열정이 차분히 타오르는 상태를 뜻하기도 해요." },
    ] },
  { name: "이빨 빠짐", match: ["이빨", "이가 빠", "치아", "이를 뽑"], meaning: "상실이나 변화에 대한 불안, 자신감이나 통제력이 흔들리는 마음과 자주 연결돼요.", q: "요즘 자신감이나 통제력이 흔들린다고 느낀 일이 있었나요?" },
  { name: "떨어짐", match: ["떨어지", "추락", "낙하", "절벽"], meaning: "통제력을 잃을까 하는 두려움, 또는 무언가를 내려놓고 싶은 마음을 드러내요.", q: "떨어지기 직전, 붙잡고 싶었던 것은 무엇이었나요?" },
  { name: "쫓김", match: ["쫓기", "도망", "쫓아", "달아"], meaning: "피하고 있는 문제나 감정이 있다는 신호일 수 있어요.", q: "깨어 있는 삶에서 지금 피하고 있는 일이 있다면 무엇인가요?" },
  { name: "날기", match: ["날아", "날았", "하늘을 날", "비행", "떠올랐"], meaning: "자유로움과 해방감, 한계를 벗어나고 싶은 바람을 상징해요.", q: "지금 벗어나고 싶은 한계나 답답함이 있나요?" },
  { name: "시험", match: ["시험", "수능", "시험지", "면접"], meaning: "평가받는 상황에 대한 압박이나 준비가 부족하다는 불안과 이어져요.", q: "요즘 평가받거나 시험대에 올랐다고 느끼는 일이 있나요?" },
  { name: "죽음", match: ["죽었", "죽는", "죽음", "사망", "장례"], meaning: "끝이자 새로운 시작을 뜻해요. 인생의 한 단계가 마무리되는 변화를 비추기도 해요.", q: "끝내고 싶거나 새로 시작하고 싶은 무언가가 있나요?" },
  { name: "벌거벗음", match: ["벌거", "알몸", "옷이 없"], meaning: "취약함이나 들킬까 하는 두려움, 있는 그대로 보이고 싶은 마음을 나타내요." },
  { name: "뱀", match: ["뱀", "구렁이"], meaning: "변화와 치유의 상징이자, 전통적으로는 재물이나 태몽으로도 풀이되는 강한 상징이에요." },
  { name: "돈", match: ["돈", "지폐", "현금", "복권"], meaning: "스스로의 가치나 자존감, 또는 바라는 무언가에 대한 욕구를 비춰요." },
  { name: "아기", match: ["아기", "갓난", "신생아"], meaning: "새로운 시작, 가능성, 보살피고 싶은 마음을 상징해요." },
  { name: "집", match: ["집에", "집을", "방에", "거실", "현관"], meaning: "자기 자신과 마음의 상태를 나타내요. 집의 분위기가 지금의 내면을 비추기도 해요." },
  { name: "비", match: ["비가", "장마", "빗물", "소나기"], meaning: "정화와 해소, 또는 슬픔과 우울을 씻어내는 감정을 나타내요." },
  { name: "거울", match: ["거울"], meaning: "자기 자신을 들여다보는 마음, 스스로를 어떻게 바라보는지를 비춰요." },
  { name: "싸움", match: ["싸움", "전쟁", "다툼", "싸웠"], meaning: "내면의 갈등이나 풀리지 않은 감정을 드러내요.", q: "마음속에서 부딪치고 있는 두 마음이 있다면 무엇인가요?" },
  { name: "산", match: ["산을", "산에", "등산", "정상"], meaning: "도전과 목표를 뜻해요. 오르는 중이라면 노력하는 과정을, 정상은 성취를 의미하기도 해요." },
  { name: "빛", match: ["빛이", "햇살", "환한"], meaning: "희망, 깨달음, 길을 찾는 마음을 나타내요." },
  { name: "어둠", match: ["어둠", "캄캄", "깜깜", "암흑"], meaning: "불안이나 미지에 대한 두려움, 아직 보이지 않는 마음을 비춰요." },
  { name: "전화", match: ["전화", "통화", "문자"], meaning: "누군가와 이어지고 싶은 마음, 전하지 못한 말을 상징하기도 해요." },
  { name: "차/운전", match: ["운전", "자동차", "버스", "기차"], meaning: "삶을 스스로 끌어가는 통제력을 뜻해요. 사고나 멈춤은 흐름이 막힌 느낌일 수 있어요." },
  { name: "음식", match: ["음식", "먹었", "밥을", "식사"], meaning: "채우고 싶은 욕구나 정서적 허기, 또는 충족감을 나타내요." },
  { name: "똥", match: ["똥", "대변", "변을"], meaning: "전통적으로 재물과 행운으로 풀이되는 대표적인 길몽 상징이에요." },
  { name: "길을 잃음", match: ["길을 잃", "헤매", "미로"], meaning: "방향을 잃은 느낌이나 결정하지 못한 고민이 담겨 있을 수 있어요.", q: "요즘 어떤 결정 앞에서 망설이고 있나요?" },
  { name: "학교", match: ["학교", "교실", "선생님"], meaning: "배움이나 과거의 기억, 평가받던 시절의 감정과 이어져요." },
  { name: "사람/관계", match: ["친구", "가족", "엄마", "아빠", "연인", "그 사람"], meaning: "그 사람 자체보다, 그가 떠올리게 하는 감정이나 관계의 어떤 면을 비추는 경우가 많아요." },
];

// 감정 톤 사전
const NEG_CUES = ["무서", "두려", "불안", "겁", "공포", "쫓기", "도망", "떨어지", "추락", "울었", "울고", "슬프", "외로", "답답", "화가", "분노", "싸우", "죽", "피가", "비명", "어둠", "캄캄", "헤매", "갇", "막막", "긴장", "초조"];
const POS_CUES = ["행복", "기쁘", "즐거", "평온", "평화", "편안", "따뜻", "웃었", "웃으", "설레", "사랑", "아름다", "빛이", "자유", "상쾌", "포근", "신났", "벅찼"];

// 종합 풀이 엔진 (오프라인)
const buildReading = (entry) => {
  const hay = ((entry.title || "") + " " + entry.text).toLowerCase();
  const tags = entry.tags || [];
  // 상징
  const symbols = SYMBOLS.filter((s) => s.match.some((m) => hay.includes(m.toLowerCase()))).map((s) => {
    let meaning = s.meaning;
    if (s.variants) { const v = s.variants.find((vr) => vr.cues.some((c) => hay.includes(c))); if (v) meaning = v.meaning; }
    return { name: s.name, meaning, q: s.q };
  });
  // 톤
  let neg = NEG_CUES.filter((c) => hay.includes(c)).length;
  let pos = POS_CUES.filter((c) => hay.includes(c)).length;
  if (tags.includes("악몽") || tags.includes("뒤숭숭")) neg += 2;
  if (tags.includes("길몽") || tags.includes("평온")) pos += 2;
  let tone, summary;
  if (neg === 0 && pos === 0) { tone = "neutral"; summary = "감정의 색이 뚜렷하지 않은, 담담한 결의 꿈이에요."; }
  else if (neg > pos + 1) { tone = "neg"; summary = "전반적으로 불안하거나 긴장된 분위기가 느껴지는 꿈이에요. 마음 한쪽에 풀리지 않은 무언가가 있을 수 있어요."; }
  else if (pos > neg + 1) { tone = "pos"; summary = "전반적으로 따뜻하고 평온한 기운이 도는 꿈이에요. 지금의 마음이 비교적 안정돼 있다는 신호일 수 있어요."; }
  else { tone = "mixed"; summary = "긴장과 안도가 함께 섞여 있는 꿈이에요. 마음속 두 가지 감정이 맞닿아 있는 시기일 수 있어요."; }
  // 종합 문장
  let synth = summary;
  if (symbols.length) {
    const names = symbols.slice(0, 3).map((s) => s.name).join(" · ");
    synth += ` 특히 ${names} 같은 상징이 눈에 띄어요.`;
  }
  if (tags.includes("반복되는 꿈")) synth += " 반복해서 꾸는 꿈이라면, 그 주제가 지금 삶에서 한 번 들여다봐 달라고 보내는 신호일 수 있어요.";
  // 돌아보기 질문 (상징 우선, 톤으로 보충)
  const questions = [];
  for (const s of symbols) { if (s.q && !questions.includes(s.q)) questions.push(s.q); if (questions.length >= 2) break; }
  if (questions.length < 2) {
    const fill = tone === "neg"
      ? "꿈에서 가장 강하게 남은 감정은 무엇이었나요? 그 감정이 요즘 일상의 무엇과 닿아 있나요?"
      : tone === "pos"
      ? "이 꿈이 남긴 좋은 기분을, 오늘 하루에 어떻게 이어가 볼 수 있을까요?"
      : "꿈에서 가장 인상 깊었던 장면은 무엇이었나요? 왜 그 장면이 남았을까요?";
    if (!questions.includes(fill)) questions.push(fill);
  }
  return { tone, synth, symbols, questions: questions.slice(0, 2) };
};

// 자주 나오는 단어 추출 (간단 한국어 처리)
const PARTICLES = ["으로서", "으로써", "에서는", "에게서", "이라는", "으로", "에서", "에게", "한테", "처럼", "보다", "까지", "부터", "마다", "라고", "이나", "은", "는", "이", "가", "을", "를", "에", "와", "과", "도", "의", "만", "랑", "요"].sort((a, b) => b.length - a.length);
const STOP = new Set(["그리고", "그래서", "하지만", "그런데", "그러나", "나는", "내가", "우리", "그는", "그녀", "사람", "그것", "이것", "저것", "갑자기", "계속", "다시", "너무", "정말", "아주", "조금", "약간", "많이", "함께", "서로", "그냥", "마치", "것을", "것이", "것은", "때문", "동안", "위해", "대해", "했다", "한다", "된다", "같다", "같은", "하는", "있는", "없는", "되는", "느낌", "기분", "오늘", "어제", "내일", "그런", "이런", "저런", "무슨", "어떤", "많은", "엄청"]);
const stripParticle = (w) => { for (const p of PARTICLES) { if (w.length > p.length + 1 && w.endsWith(p)) return w.slice(0, -p.length); } return w; };
const topWords = (list, n = 14) => {
  const counts = {};
  for (const e of list) {
    const toks = (e.text + " " + (e.title || "")).toLowerCase().split(/[^가-힣a-z0-9]+/);
    for (let t of toks) {
      if (!t) continue;
      t = stripParticle(t);
      if (t.length < 2 || STOP.has(t) || /^\d+$/.test(t)) continue;
      counts[t] = (counts[t] || 0) + 1;
    }
  }
  return Object.entries(counts).filter(([, c]) => c >= 2).sort((a, b) => b[1] - a[1]).slice(0, n).map(([word, count]) => ({ word, count }));
};

// 연속 기록(스트릭): 오늘(또는 어제)부터 거꾸로 이어진 기록 일수
const computeStreak = (list) => {
  if (!list.length) return 0;
  const days = new Set(list.map((e) => dayKey(new Date(e.date))));
  const d = new Date(); d.setHours(0, 0, 0, 0);
  if (!days.has(dayKey(d))) {        // 오늘 기록이 아직 없으면 어제부터 센다
    d.setDate(d.getDate() - 1);
    if (!days.has(dayKey(d))) return 0;  // 어제도 없으면 진행 중인 연속 기록 없음
  }
  let streak = 0;
  while (days.has(dayKey(d))) { streak++; d.setDate(d.getDate() - 1); }
  return streak;
};

function Bars({ data, accent }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {data.map((d) => (
        <div key={d.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 42, fontSize: 12.5, color: "#ADA9D4", flexShrink: 0, textAlign: "right" }}>{d.label}</span>
          <div style={{ flex: 1, height: 22, background: "rgba(173,169,212,0.10)", borderRadius: 7, overflow: "hidden" }}>
            <div style={{ width: `${(d.value / max) * 100}%`, height: "100%", minWidth: d.value > 0 ? 4 : 0,
              background: `linear-gradient(90deg, ${accent}, #F4C9A8)`, borderRadius: 7, transition: "width .4s ease" }} />
          </div>
          <span style={{ width: 22, fontSize: 12.5, color: d.value > 0 ? "#F2F0FA" : "#ADA9D4", flexShrink: 0 }}>{d.value}</span>
        </div>
      ))}
    </div>
  );
}

// 숫자 4자리 PIN 입력 패드 (잠금 화면 / 설정에서 공용으로 사용)
function PinPad({ title, subtitle, error, onSubmit, onCancel }) {
  const [val, setVal] = useState("");
  const press = (d) => {
    setVal((v) => {
      if (v.length >= 4) return v;
      const next = v + d;
      if (next.length === 4) setTimeout(() => { onSubmit(next); setVal(""); }, 110);
      return next;
    });
  };
  const del = () => setVal((v) => v.slice(0, -1));
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"];
  return (
    <div style={{ width: "100%", maxWidth: 320, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <Lock size={30} color={C.glowSoft} strokeWidth={1.6} />
      <h2 style={{ fontFamily: serif, fontSize: 21, color: C.moon, margin: "16px 0 6px", textAlign: "center" }}>{title}</h2>
      <p style={{ fontSize: 13.5, color: error ? C.glow : C.lavender, margin: "0 0 26px", textAlign: "center", minHeight: 19, lineHeight: 1.5 }}>
        {error || subtitle}
      </p>
      <div style={{ display: "flex", gap: 16, marginBottom: 34 }}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{ width: 14, height: 14, borderRadius: "50%",
            background: i < val.length ? C.glow : "transparent",
            border: `1.5px solid ${i < val.length ? C.glow : C.violet}`, transition: "background .15s" }} />
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 72px)", gap: 14, justifyContent: "center" }}>
        {keys.map((k, i) => {
          if (k === "") return <div key={i} />;
          if (k === "del") return (
            <button key={i} onClick={del} aria-label="지우기"
              style={{ height: 64, borderRadius: 18, background: "none", border: "none", cursor: "pointer",
                color: C.lavender, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Delete size={24} strokeWidth={1.7} />
            </button>
          );
          return (
            <button key={i} onClick={() => press(k)}
              style={{ height: 64, borderRadius: 18, background: C.card, border: `1px solid ${C.cardLine}`, cursor: "pointer",
                color: C.moon, fontFamily: serif, fontSize: 26, fontWeight: 700 }}>
              {k}
            </button>
          );
        })}
      </div>
      {onCancel && (
        <button onClick={onCancel}
          style={{ marginTop: 26, background: "none", border: "none", cursor: "pointer", color: C.lavender, fontSize: 14 }}>
          취소
        </button>
      )}
    </div>
  );
}

export default function App() {
  const [entries, setEntries] = useState([]);
  const [ready, setReady] = useState(false);
  const [view, setView] = useState("capture"); // capture | journal | detail
  const [selectedId, setSelectedId] = useState(null);
  const [draft, setDraft] = useState("");
  const [when, setWhen] = useState(toLocalInput(new Date()));
  const [recording, setRecording] = useState(false);
  const [interim, setInterim] = useState("");
  const [voiceErr, setVoiceErr] = useState("");
  const [saved, setSaved] = useState(false);
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState([]);
  const [note, setNote] = useState("");
  const [showNote, setShowNote] = useState(false);
  const [editing, setEditing] = useState(false);
  const [edit, setEdit] = useState({ title: "", text: "", note: "", when: "", tags: [], mood: null });
  const [query, setQuery] = useState("");
  const [favOnly, setFavOnly] = useState(false);
  const [tagFilter, setTagFilter] = useState(null);
  const [sortAsc, setSortAsc] = useState(false);
  const [calMonth, setCalMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [selDay, setSelDay] = useState(null); // 'YYYY-M-D'
  const [showMonthPicker, setShowMonthPicker] = useState(false); // 달력 연/월 선택기
  const [pickerYear, setPickerYear] = useState(() => new Date().getFullYear());
  const [statsYear, setStatsYear] = useState(() => new Date().getFullYear());
  const [importMsg, setImportMsg] = useState("");
  const [showReading, setShowReading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null); // 삭제 확인 모달 (대상 id)
  const [aiText, setAiText] = useState("");                  // AI 해석 붙여넣기 보관함
  const [aiSaved, setAiSaved] = useState(false);
  const [aiEditing, setAiEditing] = useState(false);         // AI 해석: 편집 모드 / 읽기 카드
  const [mood, setMood] = useState(null);                    // 기록 화면: 깬 뒤 기분
  // 앱 잠금
  const [lockPin, setLockPin] = useState("");     // 설정된 PIN ("" = 잠금 꺼짐)
  const [locked, setLocked] = useState(false);    // 지금 잠겨 있는지
  const [lockError, setLockError] = useState("");
  const [lockModal, setLockModal] = useState(null); // null | 'new' | 'confirm' | 'recovery' | 'disable' | 'forgot'
  const [lockRecoveryQ, setLockRecoveryQ] = useState(""); // 복구 질문
  const [lockRecoveryA, setLockRecoveryA] = useState(""); // 복구 답(소문자 보관)
  const [recQ, setRecQ] = useState("");   // 복구 설정 폼 입력
  const [recA, setRecA] = useState("");
  const [forgotA, setForgotA] = useState(""); // 잠금화면 복구 답 입력
  const pinFirstRef = useRef("");
  const pendingPinRef = useRef("");
  const lastTabRef = useRef("capture"); // 상세/설정에서 뒤로 갈 기준 탭
  // 아침 기록 알림
  const [reminderOn, setReminderOn] = useState(false);
  const [reminderTime, setReminderTime] = useState("08:00");
  const [reminderMsg, setReminderMsg] = useState("");
  const fileRef = useRef(null);
  const interimRef = useRef("");
  const recogRef = useRef(null);
  const silenceTimerRef = useRef(null);  // 무음 자동 종료 타이머
  const maxTimerRef = useRef(null);       // 최대 녹음 시간 안전장치
  const stoppingRef = useRef(false);      // 정지 중복 호출 방지

  const SILENCE_MS = 5000;  // 이 시간 동안 새 음성이 없으면 자동 종료
  const MAX_MS = 180000;    // 최대 3분까지만 녹음 (안전장치)

  // fonts
  useEffect(() => {
    const l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@400;700&family=Gowun+Dodum&display=swap";
    document.head.appendChild(l);
  }, []);

  // load
  useEffect(() => {
    (async () => {
      try {
        const v = await store.get(STORE_KEY);
        if (v) setEntries(JSON.parse(v));
      } catch (e) { /* first run */ }
      // 잠금 설정 불러오기 — PIN이 있으면 시작 시 잠근다
      try {
        const pin = await store.get("dream-lock-pin");
        if (pin) { setLockPin(pin); setLocked(true); }
        const rq = await store.get("dream-lock-recovery-q");
        const ra = await store.get("dream-lock-recovery-a");
        if (rq) setLockRecoveryQ(rq);
        if (ra) setLockRecoveryA(ra);
      } catch (e) {}
      // 알림 설정 불러오기
      try {
        const on = await store.get("dream-reminder-on");
        const t = await store.get("dream-reminder-time");
        if (t) setReminderTime(t);
        if (on === "1") setReminderOn(true);
      } catch (e) {}
      setReady(true);
    })();
  }, []);

  // 앱이 백그라운드로 갔다가 돌아오면 다시 잠근다
  useEffect(() => {
    const onHide = () => { if (document.hidden && lockPin) setLocked(true); };
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, [lockPin]);

  // 마지막으로 머문 탭 기억 (상세/설정에서 뒤로 갈 기준)
  useEffect(() => {
    if (["capture", "journal", "calendar", "stats"].includes(view)) lastTabRef.current = view;
  }, [view]);

  // 안드로이드 하드웨어 뒤로가기 — 종료 대신 이전 화면으로, 홈에서만 종료
  useEffect(() => {
    if (!isNative) return;
    let handle;
    const onBack = () => {
      // 잠금 화면: 종료/이동 대신 백그라운드로 (복구 폼은 닫기)
      if (locked && lockPin) {
        if (lockModal === "forgot") { setLockModal(null); setLockError(""); setForgotA(""); return; }
        CapApp.minimizeApp(); return;
      }
      // 열려 있는 모달/오버레이부터 닫기
      if (lockModal) { setLockModal(null); setLockError(""); pendingPinRef.current = ""; pinFirstRef.current = ""; return; }
      if (pendingDelete !== null) { setPendingDelete(null); return; }
      if (showMonthPicker) { setShowMonthPicker(false); return; }
      // 화면별 뒤로가기
      if (view === "detail") {
        if (editing) { setEditing(false); return; }   // 편집 중이면 편집만 닫기
        setView(lastTabRef.current || "journal"); return;
      }
      if (view === "settings") { setView(lastTabRef.current || "capture"); return; }
      if (view !== "capture") { setView("capture"); return; }  // 다른 탭 → 홈(기록)
      CapApp.exitApp();  // 홈에서 뒤로가기 → 앱 종료
    };
    CapApp.addListener("backButton", onBack).then((h) => { handle = h; });
    return () => { if (handle) handle.remove(); };
  }, [view, lockModal, pendingDelete, showMonthPicker, editing, locked, lockPin]);

  const persist = async (next) => {
    setEntries(next);
    await store.set(STORE_KEY, JSON.stringify(next));
  };

  // 녹음 중 다른 화면으로 이동하면 마이크를 자동으로 끈다 (백그라운드 녹음 방지)
  useEffect(() => {
    if (recording && view !== "capture") {
      if (isNative) stopNativeVoice();
      else { try { recogRef.current?.stop(); } catch (e) {} }
    }
  }, [view]);

  // ── voice ──────────────────────────────────────────────
  const clearVoiceTimers = () => {
    if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }
    if (maxTimerRef.current) { clearTimeout(maxTimerRef.current); maxTimerRef.current = null; }
  };
  // 말이 들릴 때마다 호출 — "마지막으로 말한 시점"부터 무음 타이머를 다시 시작
  const armSilenceTimer = () => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    silenceTimerRef.current = setTimeout(() => { stopNativeVoice(); }, SILENCE_MS);
  };
  // 지금까지 인식된 한 구간의 글을 본문에 확정해 넣는다
  const commitInterim = () => {
    const add = interimRef.current.trim();
    if (add) setDraft((p) => (p ? p + " " : "") + add);
    interimRef.current = ""; setInterim("");
  };

  const startNativeVoice = async () => {
    try {
      const { available } = await SpeechRecognition.available();
      if (!available) { setVoiceErr("이 기기에서는 음성 인식을 쓸 수 없어요. 텍스트로 적어주세요."); return; }
      const perm = await SpeechRecognition.requestPermissions();
      if (perm.speechRecognition !== "granted") { setVoiceErr("마이크 권한이 필요해요. 설정에서 허용해주세요."); return; }
      setVoiceErr(""); interimRef.current = ""; setInterim("");
      stoppingRef.current = false;
      await SpeechRecognition.removeAllListeners();
      await SpeechRecognition.addListener("partialResults", (data) => {
        const t = (data && data.matches && data.matches[0]) || "";
        interimRef.current = t; setInterim(t);
        armSilenceTimer();  // 새 음성이 들어올 때마다 무음 타이머 리셋
      });
      // 안드로이드 인식기는 짧은 멈춤마다 스스로 한 구간을 끝낸다.
      // 사용자가 정지하지 않았다면 그 구간을 확정하고 곧바로 다시 들어 "연속 받아쓰기"가 되게 한다.
      await SpeechRecognition.addListener("listeningState", (data) => {
        if (!data || data.status !== "stopped") return;
        commitInterim();                       // 방금 말한 구간을 본문에 추가
        if (stoppingRef.current) return;       // 정지 버튼/무음 타이머로 끝난 경우 → 종료
        // 아직 녹음 중 → 살짝 텀을 두고 다음 구간 듣기 시작 (끊김 없이 길게 말하기)
        setTimeout(() => {
          if (stoppingRef.current) return;
          SpeechRecognition.start({ language: "ko-KR", partialResults: true, popup: false }).catch(() => {});
        }, 220);
      });
      setRecording(true);
      clearVoiceTimers();
      armSilenceTimer();  // 시작 후 아무 말이 없어도 자동 종료되도록
      maxTimerRef.current = setTimeout(() => { stopNativeVoice(); }, MAX_MS);
      await SpeechRecognition.start({ language: "ko-KR", partialResults: true, popup: false });
    } catch (e) {
      clearVoiceTimers();
      setRecording(false);
      setVoiceErr("음성 인식을 시작하지 못했어요. 권한을 확인해 주세요.");
    }
  };
  const stopNativeVoice = async () => {
    if (stoppingRef.current) return;  // 중복 호출(버튼+타이머 동시) 방지
    stoppingRef.current = true;
    clearVoiceTimers();
    // UI를 먼저 즉시 풀어준다 — stop()이 응답을 늦게 줘도 버튼이 묶이지 않도록
    commitInterim();
    setRecording(false);
    try { await SpeechRecognition.stop(); } catch (e) {}
    try { await SpeechRecognition.removeAllListeners(); } catch (e) {}
  };

  const toggleVoice = () => {
    if (recording) {
      if (isNative) { stopNativeVoice(); return; }
      recogRef.current?.stop(); return;
    }
    if (isNative) { startNativeVoice(); return; }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setVoiceErr("이 브라우저는 음성 입력을 지원하지 않아요. 텍스트로 적어주세요."); return; }
    setVoiceErr("");
    const r = new SR();
    r.lang = "ko-KR"; r.continuous = true; r.interimResults = true;
    r.onresult = (e) => {
      let fin = "", itm = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) fin += t; else itm += t;
      }
      if (fin) setDraft((p) => (p ? p + " " : "") + fin.trim());
      setInterim(itm);
    };
    r.onerror = (e) => {
      setRecording(false);
      if (e.error === "not-allowed" || e.error === "service-not-allowed")
        setVoiceErr("마이크 권한이 필요해요. 브라우저 설정에서 허용해주세요.");
    };
    r.onend = () => { setRecording(false); setInterim(""); };
    r.start(); recogRef.current = r; setRecording(true);
  };

  const save = async () => {
    // 녹음 중 저장하면 아직 본문에 안 들어간 마지막 인식 결과까지 합쳐준다
    const pending = (isNative ? interimRef.current : interim).trim();
    let combined = draft;
    if (pending) combined = (combined ? combined + " " : "") + pending;
    const text = combined.trim();
    if (!text) return;
    if (recording) { if (isNative) await stopNativeVoice(); else { try { recogRef.current?.stop(); } catch (e) {} } }
    const entry = { id: Date.now().toString(), date: new Date(when).toISOString(), title: title.trim(), text, note: note.trim(), tags, mood, favorite: false, createdAt: new Date().toISOString() };
    await persist([entry, ...entries]);
    setDraft(""); setInterim(""); setTitle(""); setNote(""); setTags([]); setMood(null); setShowNote(false); setWhen(toLocalInput(new Date()));
    setSaved(true); setTimeout(() => setSaved(false), 1800);
  };

  const remove = async (id) => { await persist(entries.filter((e) => e.id !== id)); };
  const toggleFav = async (id) => { await persist(entries.map((e) => (e.id === id ? { ...e, favorite: !e.favorite } : e))); };
  // ── 앱 잠금 ──
  const onPinNew = (pin) => { pinFirstRef.current = pin; setLockError(""); setLockModal("confirm"); };
  const onPinConfirm = (pin) => {
    if (pin !== pinFirstRef.current) { setLockError("두 번 입력한 PIN이 달라요. 다시 설정해 주세요."); setLockModal("new"); return; }
    // PIN을 잊었을 때 풀 수 있게 복구 질문 단계로
    pendingPinRef.current = pin; pinFirstRef.current = "";
    setRecQ(""); setRecA(""); setLockError(""); setLockModal("recovery");
  };
  const submitRecovery = async () => {
    if (!recQ.trim() || !recA.trim()) { setLockError("질문과 답을 모두 입력해 주세요."); return; }
    const pin = pendingPinRef.current; const a = recA.trim().toLowerCase();
    await store.set("dream-lock-pin", pin);
    await store.set("dream-lock-recovery-q", recQ.trim());
    await store.set("dream-lock-recovery-a", a);
    setLockPin(pin); setLockRecoveryQ(recQ.trim()); setLockRecoveryA(a);
    pendingPinRef.current = ""; setRecQ(""); setRecA(""); setLockError(""); setLockModal(null);
  };
  const clearLock = async () => {
    await store.set("dream-lock-pin", "");
    await store.set("dream-lock-recovery-q", "");
    await store.set("dream-lock-recovery-a", "");
    setLockPin(""); setLockRecoveryQ(""); setLockRecoveryA("");
  };
  const onPinDisable = async (pin) => {
    if (pin !== lockPin) { setLockError("PIN이 맞지 않아요."); return; }
    await clearLock(); setLockError(""); setLockModal(null);
  };
  const onPinUnlock = (pin) => {
    if (pin === lockPin) { setLocked(false); setLockError(""); }
    else setLockError("PIN이 맞지 않아요. 다시 입력해 주세요.");
  };
  const submitForgot = async () => {
    if (forgotA.trim().toLowerCase() === lockRecoveryA && lockRecoveryA) {
      await clearLock(); setLocked(false); setForgotA(""); setLockError(""); setLockModal(null);
    } else {
      setLockError("답이 맞지 않아요.");
    }
  };

  // ── 아침 기록 알림 ──
  const REMINDER_ID = 7001;
  const scheduleReminder = async (time) => {
    const [h, m] = time.split(":").map(Number);
    const perm = await LocalNotifications.requestPermissions();
    if (perm.display !== "granted") { setReminderMsg("알림 권한이 필요해요. 휴대폰 설정 → 앱 → 드림노트 → 알림에서 허용해 주세요."); return false; }
    try { await LocalNotifications.cancel({ notifications: [{ id: REMINDER_ID }] }); } catch (e) {}
    await LocalNotifications.schedule({
      notifications: [{
        id: REMINDER_ID,
        title: "드림노트",
        body: "방금 꾼 꿈, 사라지기 전에 기록해요.",
        schedule: { on: { hour: h, minute: m }, allowWhileIdle: true },
      }],
    });
    return true;
  };
  const toggleReminder = async () => {
    if (!isNative) { setReminderMsg("알림은 휴대폰에 설치한 앱에서만 동작해요."); return; }
    if (reminderOn) {
      try { await LocalNotifications.cancel({ notifications: [{ id: REMINDER_ID }] }); } catch (e) {}
      setReminderOn(false); await store.set("dream-reminder-on", "0"); setReminderMsg("알림을 껐어요.");
    } else {
      const ok = await scheduleReminder(reminderTime);
      if (ok) { setReminderOn(true); await store.set("dream-reminder-on", "1"); setReminderMsg(`매일 ${reminderTime}에 알려드릴게요.`); }
    }
  };
  const changeReminderTime = async (t) => {
    setReminderTime(t); await store.set("dream-reminder-time", t);
    if (reminderOn && isNative) { const ok = await scheduleReminder(t); if (ok) setReminderMsg(`매일 ${t}에 알려드릴게요.`); }
  };

  const saveAiReading = async (id, text) => {
    await persist(entries.map((e) => (e.id === id ? { ...e, aiReading: text.trim() } : e)));
    if (text.trim()) setAiEditing(false);
    setAiSaved(true); setTimeout(() => setAiSaved(false), 1800);
  };

  // AI에게 붙여넣을 프롬프트 만들기 + 복사
  const buildPrompt = (e) => {
    const guide = [
      "너는 꿈 분석과 상징 해석을 전문으로 하는 꿈해몽 상담가야. 칼 융의 분석심리학 관점과 전통적인 꿈해몽을 함께 활용해, 아래 꿈을 깊이 있게 해석해줘. 말투는 부드럽고 차분하게 하되, 분석 자체는 솔직하고 균형 있게 — 위로하려고 내용을 미화하지는 마.",
      "",
      "[해석 원칙]",
      "- 꿈의 이미지를 문자 그대로가 아니라 상징으로 읽어줘.",
      "- 꿈 속 인물과 사물은 대부분 꿈꾼 사람 마음의 일부(주관적 수준)로 봐줘. 다만 실제로 가까운 사람이라면 그 관계에 대한 시선도 함께 짚어줘.",
      "- 긍정적인 면과 부정적인 면을 모두 솔직하게 살펴줘. 불편하거나 아픈 통찰이라도 도움이 된다면 부드럽게, 그러나 분명하게 전해줘.",
      "- 근거 없이 좋게만 포장하거나 반대로 겁주지 마. 각 해석이 꿈의 어떤 부분에서 나왔는지 근거를 함께 들어줘.",
      "- 확신의 정도를 구분해줘. 단정할 수 있는 것과 가능성 중 하나일 뿐인 것을 솔직하게 표시해줘(예: '~일 수 있어요', '~로 자주 풀이돼요').",
      "- '왜 이런 꿈을 꿨을까(원인)'와 '이 꿈이 나를 어디로 이끄는가(목적·미래)'를 모두 다뤄줘.",
      "- 이야기의 흐름(배경 → 전개 → 결말)에 주의를 기울이고, 이 꿈이 지금의 마음에서 무엇을 보상하거나 균형 잡으려는지 생각해줘.",
      "- 불길한 일을 단정하는 예언은 피하되, 부정적인 신호를 일부러 숨기지도 마.",
      "",
      "[이 순서로 답해줘]",
      "1. 한 줄 요약",
      "2. 핵심 상징 풀이 — 꿈 속 주요 장면·인물·사물이 각각 무엇을 떠올리게 하고 무엇을 상징하는지 (전통 꿈해몽 의미와 심리학적 의미를 균형 있게, 각 풀이의 근거와 함께)",
      "3. 감정과 심리 — 꿈에 흐르는 정서, 그리고 그것이 비추는 지금의 마음 상태",
      "4. 이 꿈의 메시지 — 무엇을 보상하고 나를 어디로 이끄는지 (좋은 신호와 주의할 신호를 모두)",
      "5. 오늘을 위한 조언 — 앞으로의 방향에 대한 현실적이고 실천 가능한 한마디",
      "6. 스스로 돌아볼 질문 2~3개 — 진짜 의미는 내 안에 있으니, 더 깊이 떠올려볼 만한 질문을 던져줘",
      "",
      "그럼 아래 꿈을 해석해줘.",
      "──────────",
    ];
    const info = [];
    if (e.title) info.push(`제목: ${e.title}`);
    info.push(`꿈 꾼 날: ${fmtDate(e.date)} ${fmtTime(e.date)}`);
    if (e.tags && e.tags.length) info.push(`느낌·유형: ${e.tags.join(", ")}`);
    if (moodOf(e.mood)) info.push(`깬 뒤 기분: ${moodOf(e.mood).label}`);
    info.push("", "꿈 내용:", e.text);
    if (e.note) info.push("", "그날의 상태·특이사항:", e.note);
    return [...guide, ...info].join("\n");
  };
  const copyForAI = async (e) => {
    const text = buildPrompt(e);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true); setTimeout(() => setCopied(false), 2200);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.focus(); ta.select();
      try { document.execCommand("copy"); setCopied(true); setTimeout(() => setCopied(false), 2200); } catch (err) {}
      ta.remove();
    }
  };

  // ── 백업: 내보내기 / 가져오기 ──
  const exportData = async () => {
    const payload = JSON.stringify({ app: "dreamnote", version: 1, exportedAt: new Date().toISOString(), count: entries.length, entries }, null, 2);
    const d = new Date();
    const fileName = `드림노트-백업-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}.json`;
    if (isNative) {
      try {
        const res = await Filesystem.writeFile({ path: fileName, data: payload, directory: Directory.Cache, encoding: Encoding.UTF8 });
        await Share.share({ title: "드림노트 백업", text: "드림노트 꿈 기록 백업 파일이에요.", url: res.uri });
      } catch (e) { console.error("내보내기 실패", e); }
      return;
    }
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = fileName;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };

  const importData = async (file) => {
    setImportMsg("");
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const incoming = Array.isArray(parsed) ? parsed : parsed.entries;
      if (!Array.isArray(incoming)) { setImportMsg("백업 파일 형식을 알아볼 수 없어요."); return; }
      const have = new Set(entries.map((e) => e.id));
      let added = 0, skipped = 0;
      const clean = [];
      for (const e of incoming) {
        if (!e || typeof e.text !== "string" || !e.date) { skipped++; continue; }
        const id = String(e.id || `${Date.parse(e.date) || Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
        if (have.has(id)) { skipped++; continue; }
        have.add(id);
        clean.push({
          id, date: new Date(e.date).toISOString(),
          title: typeof e.title === "string" ? e.title : "",
          text: e.text,
          note: typeof e.note === "string" ? e.note : "",
          aiReading: typeof e.aiReading === "string" ? e.aiReading : "",
          mood: (typeof e.mood === "number" && e.mood >= 1 && e.mood <= 5) ? e.mood : null,
          tags: Array.isArray(e.tags) ? e.tags.filter((t) => typeof t === "string") : [],
          favorite: !!e.favorite,
          createdAt: e.createdAt || new Date().toISOString(),
        });
        added++;
      }
      if (added) await persist([...clean, ...entries].sort((a, b) => new Date(b.date) - new Date(a.date)));
      setImportMsg(`${added}개를 불러왔어요${skipped ? ` · ${skipped}개는 건너뛰었어요(중복 또는 형식 오류)` : ""}.`);
    } catch (err) {
      setImportMsg("파일을 읽지 못했어요. 올바른 백업 파일인지 확인해 주세요.");
    }
  };

  const openEdit = (e) => {
    setEdit({ title: e.title || "", text: e.text, note: e.note || "", when: toLocalInput(new Date(e.date)), tags: e.tags || [], mood: e.mood ?? null });
    setEditing(true);
  };
  const saveEdit = async (id) => {
    const text = edit.text.trim();
    if (!text) return;
    await persist(entries.map((e) => (e.id === id
      ? { ...e, title: edit.title.trim(), text, note: edit.note.trim(), tags: edit.tags, mood: edit.mood ?? null, date: new Date(edit.when).toISOString() }
      : e)));
    setEditing(false);
  };

  // filter + sort + group
  const q = query.trim().toLowerCase();
  const filtered = entries
    .filter((e) => (favOnly ? e.favorite : true))
    .filter((e) => (tagFilter ? (e.tags || []).includes(tagFilter) : true))
    .filter((e) => (q ? ((e.title || "").toLowerCase().includes(q) || e.text.toLowerCase().includes(q) || (e.note || "").toLowerCase().includes(q)) : true));
  const dir = sortAsc ? 1 : -1;
  const ordered = [...filtered].sort((a, b) => (new Date(a.date) - new Date(b.date)) * dir);
  const groups = {};
  const sortedKeys = [];
  for (const e of ordered) { const k = fmtDate(e.date); if (!groups[k]) { groups[k] = []; sortedKeys.push(k); } groups[k].push(e); }

  // ── 달력: 날짜별 개수 맵 ──
  const dayCounts = {};
  for (const e of entries) { const k = dayKey(new Date(e.date)); dayCounts[k] = (dayCounts[k] || 0) + 1; }
  const calY = calMonth.getFullYear(), calM = calMonth.getMonth();
  const firstWeekday = new Date(calY, calM, 1).getDay();
  const daysInMonth = new Date(calY, calM + 1, 0).getDate();
  const calCells = [];
  for (let i = 0; i < firstWeekday; i++) calCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calCells.push(d);
  const selDayEntries = selDay
    ? entries.filter((e) => dayKey(new Date(e.date)) === selDay).sort((a, b) => new Date(b.date) - new Date(a.date))
    : [];

  // ── 통계 ──
  const now = new Date();
  const startOfWeek = new Date(now); startOfWeek.setHours(0, 0, 0, 0); startOfWeek.setDate(now.getDate() - now.getDay());
  const weekCount = entries.filter((e) => new Date(e.date) >= startOfWeek).length;
  const monthCount = entries.filter((e) => { const d = new Date(e.date); return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth(); }).length;
  const byWeekday = W.map((w, i) => ({ label: w, value: entries.filter((e) => new Date(e.date).getDay() === i).length }));
  const bySlot = SLOTS.map((s) => ({ label: s.label, value: entries.filter((e) => { const h = new Date(e.date).getHours(); return h >= s.from && h < s.to; }).length }));
  const byMonth = [];
  for (let m = 0; m < 12; m++) {
    byMonth.push({ label: `${m + 1}월`, value: entries.filter((e) => { const x = new Date(e.date); return x.getFullYear() === statsYear && x.getMonth() === m; }).length });
  }
  const yearTotal = byMonth.reduce((s, m) => s + m.value, 0);
  const recordedYears = [...new Set(entries.map((e) => new Date(e.date).getFullYear()))];
  const minYear = recordedYears.length ? Math.min(...recordedYears) : now.getFullYear();
  const topSlot = bySlot.reduce((a, b) => (b.value > a.value ? b : a), { label: "-", value: 0 });
  const byTag = TAGS.map((t) => ({ label: t, value: entries.filter((e) => (e.tags || []).includes(t)).length })).filter((d) => d.value > 0);
  const byMood = MOODS.map((m) => ({ label: m.emoji, value: entries.filter((e) => e.mood === m.v).length }));
  const moodEntries = entries.filter((e) => moodOf(e.mood));
  const moodAvg = moodEntries.length ? (moodEntries.reduce((s, e) => s + e.mood, 0) / moodEntries.length) : 0;
  const usedTags = TAGS.filter((t) => entries.some((e) => (e.tags || []).includes(t)));
  const freqWords = topWords(entries);
  const streak = computeStreak(entries);
  const recordedToday = entries.some((e) => dayKey(new Date(e.date)) === dayKey(new Date()));

  return (
    <div style={{ minHeight: "100vh", background: C.night, fontFamily: sans, color: C.moon, display: "flex", justifyContent: "center" }}>
      <style>{`
        @keyframes breathe { 0%,100%{ transform:scale(1); box-shadow:0 0 0 0 rgba(240,168,126,.35);} 50%{ transform:scale(1.04); box-shadow:0 0 0 16px rgba(240,168,126,0);} }
        @keyframes rise { from{opacity:0; transform:translateY(8px);} to{opacity:1; transform:translateY(0);} }
        .rise{ animation:rise .5s ease both; }
        textarea::placeholder{ color:${C.lavender}; opacity:.5; }
        textarea, input{ outline:none; }
        textarea:focus, input:focus{ border-color:${C.glow} !important; }
        button:focus-visible{ outline:2px solid ${C.glow}; outline-offset:2px; }
        input[type=datetime-local]{ color-scheme:dark; }
        *::-webkit-scrollbar{ width:0; }
        @media (prefers-reduced-motion: reduce){ .breathe{animation:none!important;} .rise{animation:none!important;} }
      `}</style>

      <div style={{ width: "100%", maxWidth: 460, minHeight: "100vh", position: "relative", paddingBottom: 92 }}>
        {/* 동트는 빛 — 하단 horizon glow */}
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, height: 280, pointerEvents: "none",
          background: `radial-gradient(120% 100% at 50% 130%, rgba(240,168,126,.22), rgba(122,111,176,.10) 45%, transparent 70%)` }} />

        {/* header */}
        <div style={{ padding: "26px 22px 8px", position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <Moon size={20} color={C.glowSoft} strokeWidth={1.6} />
            <span style={{ fontFamily: serif, fontSize: 21, letterSpacing: ".02em" }}>드림노트</span>
            {["capture", "journal", "calendar", "stats"].includes(view) && (
              <button onClick={() => { setView("settings"); setImportMsg(""); }} aria-label="설정"
                style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: C.lavender, display: "flex", padding: 4 }}>
                <Settings size={20} strokeWidth={1.7} />
              </button>
            )}
          </div>
        </div>

        {/* ─────────── CAPTURE ─────────── */}
        {view === "capture" && (
          <div className="rise" style={{ padding: "10px 22px 0", position: "relative", zIndex: 1 }}>
            <p style={{ fontFamily: serif, fontSize: 19, lineHeight: 1.6, color: C.moon, margin: "12px 0 4px" }}>
              기억이 사라지기 전에,<br />방금 꾼 꿈을 남겨두세요.
            </p>
            <p style={{ fontSize: 13.5, color: C.lavender, margin: "0 0 18px" }}>말로 하거나, 손으로 적어도 좋아요.</p>

            {streak > 0 && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 999,
                background: "rgba(240,168,126,.12)", border: `1px solid ${C.glow}`, marginBottom: 20 }}>
                <span style={{ fontSize: 15 }}>🔥</span>
                <span style={{ fontSize: 13.5, color: C.glowSoft, fontWeight: 700 }}>
                  {streak}일 연속 기록 중
                </span>
                {!recordedToday && (
                  <span style={{ fontSize: 12.5, color: C.lavender }}>· 오늘 적으면 {streak + 1}일째!</span>
                )}
              </div>
            )}

            {/* 마이크 */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", margin: "8px 0 22px" }}>
              <button onClick={toggleVoice} aria-label={recording ? "녹음 멈추기" : "음성으로 기록하기"}
                className={recording ? "breathe" : ""}
                style={{ width: 76, height: 76, borderRadius: "50%", cursor: "pointer",
                  background: recording ? C.glow : "linear-gradient(160deg, #2a2752, #1d1b3e)",
                  border: recording ? "none" : `1px solid ${C.cardLine}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "background .3s", color: recording ? C.night : C.glowSoft }}>
                {recording ? <Square size={26} fill={C.night} /> : <Mic size={28} strokeWidth={1.7} />}
              </button>
              <span style={{ fontSize: 12.5, color: recording ? C.glowSoft : C.lavender, marginTop: 11, height: 16 }}>
                {recording ? "듣고 있어요…" : "탭하여 말하기"}
              </span>
            </div>

            {voiceErr && <p style={{ fontSize: 12.5, color: C.glowSoft, textAlign: "center", margin: "-8px 0 14px" }}>{voiceErr}</p>}

            {/* 제목 (선택) */}
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="제목 (선택)"
              style={{ width: "100%", boxSizing: "border-box", background: C.raised, border: `1px solid ${C.cardLine}`,
                borderRadius: 13, padding: "13px 15px", marginBottom: 11, color: C.moon, fontFamily: serif, fontSize: 16,
                transition: "border-color .2s" }} />

            {/* 텍스트 */}
            <textarea value={draft} onChange={(e) => setDraft(e.target.value)}
              placeholder="어떤 꿈을 꿨나요? 떠오르는 장면, 사람, 감정을 그대로 적어보세요…"
              rows={6}
              style={{ width: "100%", boxSizing: "border-box", background: C.raised, border: `1px solid ${C.cardLine}`,
                borderRadius: 16, padding: "16px 16px", color: C.moon, fontFamily: serif, fontSize: 16,
                lineHeight: 1.7, resize: "none", transition: "border-color .2s" }} />
            {interim && <p style={{ fontSize: 14, color: C.lavender, fontStyle: "italic", margin: "8px 4px 0", fontFamily: serif }}>…{interim}</p>}

            {/* 느낌·유형 태그 (선택) */}
            <div style={{ marginTop: 16 }}>
              <span style={{ fontSize: 13, color: C.lavender, display: "block", marginBottom: 9 }}>느낌 · 유형 (선택)</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {TAGS.map((t) => {
                  const on = tags.includes(t);
                  return (
                    <button key={t} onClick={() => setTags((p) => (on ? p.filter((x) => x !== t) : [...p, t]))}
                      style={{ padding: "7px 13px", borderRadius: 999, cursor: "pointer", fontFamily: sans, fontSize: 13,
                        background: on ? "rgba(240,168,126,.16)" : C.raised,
                        border: `1px solid ${on ? C.glow : C.cardLine}`, color: on ? C.glowSoft : C.lavender }}>
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 깬 뒤 기분 (선택) */}
            <div style={{ marginTop: 18 }}>
              <span style={{ fontSize: 13, color: C.lavender, display: "block", marginBottom: 9 }}>깬 뒤 기분 (선택)</span>
              <div style={{ display: "flex", gap: 8 }}>
                {MOODS.map((m) => {
                  const on = mood === m.v;
                  return (
                    <button key={m.v} onClick={() => setMood(on ? null : m.v)} aria-label={m.label}
                      style={{ flex: 1, padding: "9px 0", borderRadius: 13, cursor: "pointer",
                        display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                        background: on ? "rgba(240,168,126,.16)" : C.raised,
                        border: `1px solid ${on ? C.glow : C.cardLine}` }}>
                      <span style={{ fontSize: 22, filter: on ? "none" : "grayscale(.35)", opacity: on ? 1 : .8 }}>{m.emoji}</span>
                      <span style={{ fontSize: 10.5, color: on ? C.glowSoft : C.lavender }}>{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 상태·특이사항 (선택) */}
            {showNote ? (
              <div style={{ marginTop: 14 }}>
                <span style={{ fontSize: 13, color: C.lavender, display: "block", marginBottom: 7 }}>오늘의 상태 · 특이사항</span>
                <textarea value={note} onChange={(e) => setNote(e.target.value)}
                  placeholder="몸 상태, 잠들기 전 일, 기분 등 (예: 늦게 잤다, 스트레스 받음)"
                  rows={3}
                  style={{ width: "100%", boxSizing: "border-box", background: C.raised, border: `1px solid ${C.cardLine}`,
                    borderRadius: 14, padding: "13px 14px", color: C.moon, fontFamily: serif, fontSize: 14.5,
                    lineHeight: 1.6, resize: "none", transition: "border-color .2s" }} />
              </div>
            ) : (
              <button onClick={() => setShowNote(true)}
                style={{ marginTop: 14, background: "none", border: "none", cursor: "pointer", color: C.lavender,
                  fontSize: 13.5, display: "flex", alignItems: "center", gap: 6, padding: "2px 0" }}>
                <Plus size={15} strokeWidth={1.8} /> 상태 · 특이사항 추가 (선택)
              </button>
            )}

            {/* 일시 */}
            <div style={{ display: "flex", alignItems: "center", gap: 9, margin: "18px 2px 0" }}>
              <Clock size={16} color={C.lavender} strokeWidth={1.7} />
              <span style={{ fontSize: 13.5, color: C.lavender }}>꿈 꾼 일시</span>
              <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)}
                style={{ marginLeft: "auto", background: C.raised, border: `1px solid ${C.cardLine}`,
                  borderRadius: 10, padding: "7px 10px", color: C.moon, fontFamily: sans, fontSize: 13 }} />
            </div>

            {/* 저장 */}
            <button onClick={save} disabled={!draft.trim()}
              style={{ width: "100%", marginTop: 22, padding: "15px", borderRadius: 14, border: "none",
                cursor: draft.trim() ? "pointer" : "default",
                background: draft.trim() ? C.glow : C.raised,
                color: draft.trim() ? C.night : C.lavender, fontFamily: sans, fontSize: 15.5, fontWeight: 700,
                letterSpacing: ".02em", transition: "background .25s" }}>
              {saved ? "기록했어요 ✓" : "꿈 일기에 담기"}
            </button>
          </div>
        )}

        {/* ─────────── JOURNAL ─────────── */}
        {view === "journal" && (
          <div className="rise" style={{ padding: "10px 22px 0", position: "relative", zIndex: 1 }}>
            <h2 style={{ fontFamily: serif, fontSize: 22, margin: "10px 0 16px" }}>꿈 일기장</h2>

            {entries.length > 0 && (
              <>
                {/* 검색 */}
                <div style={{ position: "relative", marginBottom: 12 }}>
                  <Search size={16} color={C.lavender} strokeWidth={1.8}
                    style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
                  <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="꿈 내용 검색"
                    style={{ width: "100%", boxSizing: "border-box", background: C.raised, border: `1px solid ${C.cardLine}`,
                      borderRadius: 13, padding: "11px 14px 11px 40px", color: C.moon, fontFamily: sans, fontSize: 14.5, transition: "border-color .2s" }} />
                  {query && (
                    <button onClick={() => setQuery("")} aria-label="검색어 지우기"
                      style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: C.lavender, display: "flex" }}>
                      <X size={16} />
                    </button>
                  )}
                </div>

                {/* 필터 + 정렬 */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                  <button onClick={() => setFavOnly((v) => !v)}
                    style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 13px", borderRadius: 999, cursor: "pointer",
                      fontFamily: sans, fontSize: 13,
                      background: favOnly ? "rgba(240,168,126,.16)" : C.raised,
                      border: `1px solid ${favOnly ? C.glow : C.cardLine}`,
                      color: favOnly ? C.glowSoft : C.lavender }}>
                    <Star size={14} fill={favOnly ? C.glow : "none"} color={favOnly ? C.glow : C.lavender} strokeWidth={1.8} /> 즐겨찾기
                  </button>
                  <button onClick={() => setSortAsc((v) => !v)}
                    style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, padding: "8px 13px", borderRadius: 999, cursor: "pointer",
                      fontFamily: sans, fontSize: 13, background: C.raised, border: `1px solid ${C.cardLine}`, color: C.lavender }}>
                    <ArrowUpDown size={14} strokeWidth={1.8} /> {sortAsc ? "오래된 순" : "최신 순"}
                  </button>
                </div>

                {usedTags.length > 0 && (
                  <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, marginBottom: 20 }}>
                    {usedTags.map((t) => {
                      const on = tagFilter === t;
                      return (
                        <button key={t} onClick={() => setTagFilter(on ? null : t)}
                          style={{ flexShrink: 0, padding: "7px 13px", borderRadius: 999, cursor: "pointer", fontFamily: sans, fontSize: 13,
                            background: on ? "rgba(122,111,176,.28)" : C.raised,
                            border: `1px solid ${on ? C.violet : C.cardLine}`, color: on ? C.glowSoft : C.lavender }}>
                          {t}
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {ready && entries.length === 0 && (
              <div style={{ textAlign: "center", padding: "60px 20px", color: C.lavender }}>
                <Moon size={32} color={C.violet} strokeWidth={1.3} style={{ opacity: .7 }} />
                <p style={{ fontFamily: serif, fontSize: 16, marginTop: 14 }}>아직 담긴 꿈이 없어요.</p>
                <p style={{ fontSize: 13.5, marginTop: 4 }}>오늘 아침의 꿈부터 기록해보세요.</p>
              </div>
            )}

            {ready && entries.length > 0 && sortedKeys.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px 20px", color: C.lavender }}>
                <p style={{ fontFamily: serif, fontSize: 15.5 }}>
                  {favOnly && !q ? "즐겨찾기한 꿈이 아직 없어요." : "찾는 꿈이 없어요."}
                </p>
              </div>
            )}

            {sortedKeys.map((k) => (
              <div key={k} style={{ marginBottom: 26 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 12 }}>
                  <span style={{ fontFamily: serif, fontSize: 15, color: C.glowSoft }}>{k}</span>
                  <span style={{ fontSize: 12, color: C.lavender }}>{W[new Date(groups[k][0].date).getDay()]}요일 · {groups[k].length}개</span>
                </div>

                {groups[k].map((e) => (
                  <button key={e.id} onClick={() => { setSelectedId(e.id); setEditing(false); setShowReading(false); setCopied(false); setAiText(e.aiReading || ""); setAiSaved(false); setAiEditing(!(e.aiReading)); setView("detail"); }}
                    style={{ all: "unset", boxSizing: "border-box", display: "block", width: "100%", cursor: "pointer",
                      background: C.card, border: `1px solid ${C.cardLine}`, borderRadius: 16, padding: "15px 16px", marginBottom: 11 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 7 }}>
                      <span style={{ fontSize: 12.5, color: C.lavender }}>{fmtTime(e.date)}</span>
                      <span style={{ display: "flex", alignItems: "center", gap: 9 }}>
                        {e.note && <PenLine size={13} color={C.lavender} strokeWidth={1.8} />}
                        <span role="button" tabIndex={0} aria-label={e.favorite ? "즐겨찾기 해제" : "즐겨찾기"}
                          onClick={(ev) => { ev.stopPropagation(); toggleFav(e.id); }}
                          onKeyDown={(ev) => { if (ev.key === "Enter") { ev.stopPropagation(); toggleFav(e.id); } }}
                          style={{ display: "flex", cursor: "pointer" }}>
                          <Star size={16} strokeWidth={1.8} fill={e.favorite ? C.glow : "none"} color={e.favorite ? C.glow : C.lavender} />
                        </span>
                      </span>
                    </div>
                    {e.title && <p style={{ fontFamily: serif, fontSize: 16.5, fontWeight: 700, color: C.moon, margin: "0 0 4px" }}>{e.title}</p>}
                    <p style={{ fontFamily: serif, fontSize: 15, lineHeight: 1.7, color: e.title ? C.lavender : C.moon, margin: 0,
                      display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {e.text}
                    </p>
                    {e.tags && e.tags.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 9 }}>
                        {e.tags.map((t) => (
                          <span key={t} style={{ padding: "3px 9px", borderRadius: 999, fontSize: 11.5, fontFamily: sans,
                            background: "rgba(122,111,176,.18)", color: C.glowSoft }}>{t}</span>
                        ))}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* ─────────── DETAIL (한 페이지로 보기) ─────────── */}
        {view === "detail" && (() => {
          const e = entries.find((x) => x.id === selectedId);
          if (!e) return null;
          return (
            <div className="rise" style={{ padding: "10px 22px 0", position: "relative", zIndex: 1 }}>
              <button onClick={() => { setEditing(false); setView("journal"); }}
                style={{ background: "none", border: "none", cursor: "pointer", color: C.lavender,
                  fontSize: 14, display: "flex", alignItems: "center", gap: 6, padding: "4px 0", marginBottom: 10 }}>
                <ChevronLeft size={18} /> 일기장
              </button>

              {editing ? (
                /* ── 편집 모드 ── */
                <div>
                  <span style={{ fontSize: 13, color: C.lavender, display: "block", marginBottom: 7 }}>제목</span>
                  <input value={edit.title} onChange={(ev) => setEdit({ ...edit, title: ev.target.value })} placeholder="제목 (선택)"
                    style={{ width: "100%", boxSizing: "border-box", background: C.raised, border: `1px solid ${C.cardLine}`,
                      borderRadius: 13, padding: "12px 14px", marginBottom: 16, color: C.moon, fontFamily: serif, fontSize: 16, transition: "border-color .2s" }} />

                  <span style={{ fontSize: 13, color: C.lavender, display: "block", marginBottom: 7 }}>꿈 꾼 일시</span>
                  <input type="datetime-local" value={edit.when} onChange={(ev) => setEdit({ ...edit, when: ev.target.value })}
                    style={{ background: C.raised, border: `1px solid ${C.cardLine}`, borderRadius: 11, padding: "9px 12px", marginBottom: 16,
                      color: C.moon, fontFamily: sans, fontSize: 13.5 }} />

                  <span style={{ fontSize: 13, color: C.lavender, display: "block", marginBottom: 7 }}>꿈 내용</span>
                  <textarea value={edit.text} onChange={(ev) => setEdit({ ...edit, text: ev.target.value })} rows={7}
                    style={{ width: "100%", boxSizing: "border-box", background: C.raised, border: `1px solid ${C.cardLine}`,
                      borderRadius: 14, padding: "14px", marginBottom: 16, color: C.moon, fontFamily: serif, fontSize: 16, lineHeight: 1.7, resize: "none", transition: "border-color .2s" }} />

                  <span style={{ fontSize: 13, color: C.lavender, display: "block", marginBottom: 7 }}>상태 · 특이사항</span>
                  <textarea value={edit.note} onChange={(ev) => setEdit({ ...edit, note: ev.target.value })} rows={3} placeholder="(선택)"
                    style={{ width: "100%", boxSizing: "border-box", background: C.raised, border: `1px solid ${C.cardLine}`,
                      borderRadius: 14, padding: "13px 14px", color: C.moon, fontFamily: serif, fontSize: 14.5, lineHeight: 1.6, resize: "none", transition: "border-color .2s" }} />

                  <span style={{ fontSize: 13, color: C.lavender, display: "block", margin: "16px 0 9px" }}>느낌 · 유형</span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {TAGS.map((t) => {
                      const on = edit.tags.includes(t);
                      return (
                        <button key={t} onClick={() => setEdit({ ...edit, tags: on ? edit.tags.filter((x) => x !== t) : [...edit.tags, t] })}
                          style={{ padding: "7px 13px", borderRadius: 999, cursor: "pointer", fontFamily: sans, fontSize: 13,
                            background: on ? "rgba(240,168,126,.16)" : C.raised,
                            border: `1px solid ${on ? C.glow : C.cardLine}`, color: on ? C.glowSoft : C.lavender }}>
                          {t}
                        </button>
                      );
                    })}
                  </div>

                  <span style={{ fontSize: 13, color: C.lavender, display: "block", margin: "16px 0 9px" }}>깬 뒤 기분</span>
                  <div style={{ display: "flex", gap: 8 }}>
                    {MOODS.map((m) => {
                      const on = edit.mood === m.v;
                      return (
                        <button key={m.v} onClick={() => setEdit({ ...edit, mood: on ? null : m.v })} aria-label={m.label}
                          style={{ flex: 1, padding: "9px 0", borderRadius: 13, cursor: "pointer",
                            display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                            background: on ? "rgba(240,168,126,.16)" : C.raised,
                            border: `1px solid ${on ? C.glow : C.cardLine}` }}>
                          <span style={{ fontSize: 22, filter: on ? "none" : "grayscale(.35)", opacity: on ? 1 : .8 }}>{m.emoji}</span>
                          <span style={{ fontSize: 10.5, color: on ? C.glowSoft : C.lavender }}>{m.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
                    <button onClick={() => setEditing(false)}
                      style={{ flex: 1, padding: "14px", borderRadius: 13, cursor: "pointer", background: C.raised,
                        border: `1px solid ${C.cardLine}`, color: C.lavender, fontFamily: sans, fontSize: 15 }}>
                      취소
                    </button>
                    <button onClick={() => saveEdit(e.id)} disabled={!edit.text.trim()}
                      style={{ flex: 1.4, padding: "14px", borderRadius: 13, border: "none",
                        cursor: edit.text.trim() ? "pointer" : "default",
                        background: edit.text.trim() ? C.glow : C.raised, color: edit.text.trim() ? C.night : C.lavender,
                        fontFamily: sans, fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                      <Check size={17} /> 저장
                    </button>
                  </div>
                </div>
              ) : (
                /* ── 보기 모드 ── */
                <div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 9, marginBottom: 4 }}>
                    <span style={{ fontFamily: serif, fontSize: 16, color: C.glowSoft }}>{fmtDate(e.date)}</span>
                    <span style={{ fontSize: 13, color: C.lavender }}>{W[new Date(e.date).getDay()]}요일 · {fmtTime(e.date)}</span>
                    <button onClick={() => toggleFav(e.id)} aria-label={e.favorite ? "즐겨찾기 해제" : "즐겨찾기"}
                      style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", display: "flex", padding: 4 }}>
                      <Star size={22} strokeWidth={1.8} fill={e.favorite ? C.glow : "none"} color={e.favorite ? C.glow : C.lavender} />
                    </button>
                  </div>

                  {e.title && <h2 style={{ fontFamily: serif, fontSize: 24, fontWeight: 700, color: C.moon, margin: "6px 0 14px", lineHeight: 1.35 }}>{e.title}</h2>}

                  {((e.tags && e.tags.length > 0) || moodOf(e.mood)) && (
                    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 7, margin: e.title ? "0 0 18px" : "14px 0 18px" }}>
                      {moodOf(e.mood) && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 11px 5px 9px", borderRadius: 999, fontSize: 12.5, fontFamily: sans,
                          background: "rgba(122,111,176,.18)", border: `1px solid ${C.violet}`, color: C.glowSoft }}>
                          <span style={{ fontSize: 15 }}>{moodOf(e.mood).emoji}</span> {moodOf(e.mood).label}
                        </span>
                      )}
                      {(e.tags || []).map((t) => (
                        <span key={t} style={{ padding: "5px 12px", borderRadius: 999, fontSize: 12.5, fontFamily: sans,
                          background: "rgba(240,168,126,.14)", border: `1px solid ${C.glow}`, color: C.glowSoft }}>{t}</span>
                      ))}
                    </div>
                  )}

                  <p style={{ fontFamily: serif, fontSize: 17, lineHeight: 1.95, color: C.moon, whiteSpace: "pre-wrap", margin: (e.title || (e.tags && e.tags.length) || moodOf(e.mood)) ? "0 0 26px" : "14px 0 26px" }}>
                    {e.text}
                  </p>

                  {e.note && (
                    <div style={{ background: C.raised, borderRadius: 16, padding: "16px 17px", border: `1px solid ${C.cardLine}` }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 9 }}>
                        <PenLine size={15} color={C.glowSoft} strokeWidth={1.8} />
                        <span style={{ fontSize: 13, color: C.glowSoft, fontWeight: 700 }}>상태 · 특이사항</span>
                      </div>
                      <p style={{ fontFamily: serif, fontSize: 15, lineHeight: 1.85, color: C.lavender, whiteSpace: "pre-wrap", margin: 0 }}>{e.note}</p>
                    </div>
                  )}

                  {/* 꿈 풀이 (오프라인 종합 해석) */}
                  {(() => {
                    if (!showReading) {
                      return (
                        <button onClick={() => setShowReading(true)}
                          style={{ width: "100%", marginTop: 16, padding: "14px", borderRadius: 14, cursor: "pointer",
                            background: "transparent", border: `1px solid ${C.violet}`, color: C.glowSoft,
                            fontFamily: sans, fontSize: 14.5, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                          <Moon size={16} strokeWidth={1.8} /> 이 꿈 풀이 보기
                        </button>
                      );
                    }
                    const r = buildReading(e);
                    return (
                      <div className="rise" style={{ marginTop: 16, background: C.raised, borderRadius: 16, padding: "18px 17px", border: `1px solid ${C.cardLine}` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
                          <Moon size={16} color={C.glow} strokeWidth={1.8} />
                          <span style={{ fontSize: 13, color: C.glowSoft, fontWeight: 700 }}>꿈 풀이</span>
                        </div>
                        <p style={{ fontSize: 12, color: C.lavender, margin: "0 0 14px", opacity: .85, lineHeight: 1.5 }}>
                          정해진 답이 아니라, 흔히 알려진 상징과 분위기를 토대로 한 풀이예요.
                        </p>

                        {/* 종합 */}
                        <p style={{ fontFamily: serif, fontSize: 15.5, lineHeight: 1.9, color: C.moon, margin: "0 0 16px" }}>{r.synth}</p>

                        {/* 상징별 */}
                        {r.symbols.length > 0 && (
                          <div style={{ borderTop: `1px solid ${C.cardLine}`, paddingTop: 14, display: "flex", flexDirection: "column", gap: 13 }}>
                            {r.symbols.map((s) => (
                              <div key={s.name}>
                                <p style={{ fontFamily: serif, fontSize: 15, fontWeight: 700, color: C.glowSoft, margin: "0 0 3px" }}>{s.name}</p>
                                <p style={{ fontFamily: serif, fontSize: 14.5, lineHeight: 1.8, color: C.lavender, margin: 0 }}>{s.meaning}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* 돌아보기 */}
                        <div style={{ borderTop: `1px solid ${C.cardLine}`, marginTop: 14, paddingTop: 14 }}>
                          <p style={{ fontSize: 12.5, color: C.glowSoft, fontWeight: 700, margin: "0 0 9px" }}>돌아보기</p>
                          {r.questions.map((q, i) => (
                            <p key={i} style={{ fontFamily: serif, fontSize: 14.5, lineHeight: 1.8, color: C.lavender, margin: i ? "8px 0 0" : 0 }}>· {q}</p>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* AI에게 해석 맡기기 (복사) */}
                  <button onClick={() => copyForAI(e)}
                    style={{ width: "100%", marginTop: 12, padding: "14px", borderRadius: 14, cursor: "pointer", border: "none",
                      background: copied ? "rgba(122,111,176,.25)" : C.glow, color: copied ? C.glowSoft : C.night,
                      fontFamily: sans, fontSize: 14.5, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      transition: "background .25s" }}>
                    {copied ? <><Check size={17} /> 복사됐어요</> : <><Copy size={16} /> AI에게 해석 맡기기 (내용 복사)</>}
                  </button>
                  <p style={{ fontSize: 12, color: C.lavender, textAlign: "center", margin: "9px 0 0", lineHeight: 1.55, opacity: .85 }}>
                    {copied ? "ChatGPT·Claude 등에 붙여넣기만 하면 돼요." : "복사해서 좋아하는 AI 챗봇에 붙여넣으면 해석해줘요."}
                  </p>

                  {/* AI 해석 보관함 — 저장돼 있으면 읽기 카드, 아니면 입력칸 */}
                  <div style={{ marginTop: 18, background: C.raised, borderRadius: 16, padding: "16px 17px", border: `1px solid ${C.cardLine}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
                      <BookOpen size={15} color={C.glowSoft} strokeWidth={1.8} />
                      <span style={{ fontSize: 13, color: C.glowSoft, fontWeight: 700 }}>AI 해석 보관</span>
                      {e.aiReading && !aiEditing && (
                        <button onClick={() => { setAiText(e.aiReading); setAiSaved(false); setAiEditing(true); }}
                          style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: C.lavender,
                            fontSize: 12.5, display: "flex", alignItems: "center", gap: 4 }}>
                          <Pencil size={13} /> 수정
                        </button>
                      )}
                    </div>

                    {e.aiReading && !aiEditing ? (
                      <p style={{ fontFamily: serif, fontSize: 14.5, lineHeight: 1.85, color: C.moon, whiteSpace: "pre-wrap", margin: 0 }}>
                        {e.aiReading}
                      </p>
                    ) : (
                      <>
                        <textarea value={aiText} onChange={(ev) => { setAiText(ev.target.value); if (aiSaved) setAiSaved(false); }}
                          rows={6} placeholder="AI에게 받은 해석을 여기에 붙여넣어 두면, 이 꿈과 함께 저장돼요."
                          style={{ width: "100%", boxSizing: "border-box", background: C.night, border: `1px solid ${C.cardLine}`,
                            borderRadius: 12, padding: "13px", color: C.moon, fontFamily: serif, fontSize: 14.5, lineHeight: 1.8, resize: "vertical", minHeight: 96 }} />
                        {(() => {
                          const unchanged = aiText.trim() === (e.aiReading || "");
                          return (
                            <button onClick={() => saveAiReading(e.id, aiText)} disabled={unchanged}
                              style={{ width: "100%", marginTop: 10, padding: "12px", borderRadius: 12,
                                cursor: unchanged ? "default" : "pointer", border: "none",
                                background: aiSaved ? "rgba(122,111,176,.25)" : (unchanged ? C.raised : C.violet),
                                color: aiSaved ? C.glowSoft : (unchanged ? C.lavender : C.moon),
                                fontFamily: sans, fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                                transition: "background .25s" }}>
                              {aiSaved ? <><Check size={16} /> 저장됐어요</> : <><Check size={16} /> 해석 저장</>}
                            </button>
                          );
                        })()}
                        <p style={{ fontSize: 11.5, color: C.lavender, textAlign: "center", margin: "8px 0 0", opacity: .8, lineHeight: 1.5 }}>
                          저장하면 다음에 이 꿈을 열 때 해석이 그대로 남아 있어요.
                        </p>
                      </>
                    )}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 22 }}>
                    <button onClick={() => openEdit(e)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: C.glowSoft,
                        fontSize: 13.5, display: "flex", alignItems: "center", gap: 6 }}>
                      <Pencil size={14} /> 편집
                    </button>
                    <button onClick={() => setPendingDelete(e.id)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: C.lavender,
                        fontSize: 13.5, display: "flex", alignItems: "center", gap: 6, opacity: .7 }}>
                      <Trash2 size={14} /> 삭제
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* ─────────── CALENDAR ─────────── */}
        {view === "calendar" && (
          <div className="rise" style={{ padding: "10px 22px 0", position: "relative", zIndex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "10px 0 18px" }}>
              <button onClick={() => { setCalMonth(new Date(calY, calM - 1, 1)); setSelDay(null); }}
                style={{ background: "none", border: "none", cursor: "pointer", color: C.lavender, display: "flex", padding: 6 }}>
                <ChevronLeft size={20} />
              </button>
              <button onClick={() => { setPickerYear(calY); setShowMonthPicker(true); }}
                style={{ background: "none", border: "none", cursor: "pointer", color: C.moon,
                  fontFamily: serif, fontSize: 19, display: "flex", alignItems: "center", gap: 6, padding: "4px 8px", borderRadius: 10 }}>
                {calY}년 {calM + 1}월
                <ChevronRight size={16} color={C.lavender} style={{ transform: "rotate(90deg)" }} />
              </button>
              <button onClick={() => { setCalMonth(new Date(calY, calM + 1, 1)); setSelDay(null); }}
                style={{ background: "none", border: "none", cursor: "pointer", color: C.lavender, display: "flex", padding: 6 }}>
                <ChevronRight size={20} />
              </button>
            </div>

            {/* 연/월 빠른 선택기 */}
            {showMonthPicker && (
              <div onClick={() => setShowMonthPicker(false)}
                style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(10,9,22,.66)", backdropFilter: "blur(3px)",
                  display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
                <div onClick={(ev) => ev.stopPropagation()} className="rise"
                  style={{ width: "100%", maxWidth: 360, background: C.card, borderRadius: 22, border: `1px solid ${C.cardLine}`,
                    padding: "20px 20px 18px", boxShadow: "0 18px 50px rgba(0,0,0,.5)" }}>
                  {/* 연도 선택 */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 18, marginBottom: 18 }}>
                    <button onClick={() => setPickerYear((y) => y - 1)} aria-label="이전 해"
                      style={{ background: C.raised, border: `1px solid ${C.cardLine}`, borderRadius: 10, cursor: "pointer",
                        color: C.lavender, display: "flex", padding: 7 }}>
                      <ChevronLeft size={18} />
                    </button>
                    <span style={{ fontFamily: serif, fontSize: 22, fontWeight: 700, color: C.glowSoft, minWidth: 78, textAlign: "center" }}>{pickerYear}년</span>
                    <button onClick={() => setPickerYear((y) => y + 1)} aria-label="다음 해"
                      style={{ background: C.raised, border: `1px solid ${C.cardLine}`, borderRadius: 10, cursor: "pointer",
                        color: C.lavender, display: "flex", padding: 7 }}>
                      <ChevronRight size={18} />
                    </button>
                  </div>

                  {/* 월 그리드 */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 9 }}>
                    {Array.from({ length: 12 }).map((_, m) => {
                      const isCur = pickerYear === calY && m === calM;
                      const hasRecord = entries.some((e) => { const d = new Date(e.date); return d.getFullYear() === pickerYear && d.getMonth() === m; });
                      return (
                        <button key={m} onClick={() => { setCalMonth(new Date(pickerYear, m, 1)); setSelDay(null); setShowMonthPicker(false); }}
                          style={{ padding: "13px 0", borderRadius: 13, cursor: "pointer", position: "relative",
                            background: isCur ? C.glow : C.raised,
                            border: `1px solid ${isCur ? C.glow : C.cardLine}`,
                            color: isCur ? C.night : C.moon, fontFamily: serif, fontSize: 15.5, fontWeight: isCur ? 700 : 400 }}>
                          {m + 1}월
                          {hasRecord && !isCur && (
                            <span style={{ position: "absolute", top: 7, right: 9, width: 5, height: 5, borderRadius: "50%", background: C.glow }} />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* 오늘로 */}
                  <button onClick={() => { const t = new Date(); setCalMonth(new Date(t.getFullYear(), t.getMonth(), 1)); setSelDay(null); setShowMonthPicker(false); }}
                    style={{ width: "100%", marginTop: 16, padding: "12px", borderRadius: 13, cursor: "pointer",
                      background: "transparent", border: `1px solid ${C.violet}`, color: C.glowSoft,
                      fontFamily: sans, fontSize: 14, fontWeight: 700 }}>
                    오늘로
                  </button>
                </div>
              </div>
            )}

            {/* 요일 헤더 */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", marginBottom: 6 }}>
              {W.map((w, i) => (
                <span key={w} style={{ textAlign: "center", fontSize: 12, color: i === 0 ? C.glowSoft : C.lavender }}>{w}</span>
              ))}
            </div>

            {/* 날짜 그리드 */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
              {calCells.map((d, i) => {
                if (d === null) return <div key={"e" + i} />;
                const key = `${calY}-${calM}-${d}`;
                const count = dayCounts[key] || 0;
                const isToday = dayKey(now) === key;
                const isSel = selDay === key;
                return (
                  <button key={key} onClick={() => count > 0 && setSelDay(isSel ? null : key)}
                    style={{ aspectRatio: "1", border: "none", borderRadius: 11, cursor: count > 0 ? "pointer" : "default",
                      background: isSel ? "rgba(240,168,126,.18)" : "transparent",
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3,
                      color: count > 0 ? C.moon : "rgba(173,169,212,.45)" }}>
                    <span style={{ fontSize: 13.5, fontFamily: sans,
                      ...(isToday ? { width: 24, height: 24, borderRadius: "50%", border: `1px solid ${C.glow}`, display: "flex", alignItems: "center", justifyContent: "center" } : {}) }}>{d}</span>
                    <span style={{ display: "flex", gap: 2, height: 5 }}>
                      {count > 0 && Array.from({ length: Math.min(count, 3) }).map((_, j) => (
                        <span key={j} style={{ width: 5, height: 5, borderRadius: "50%", background: C.glow }} />
                      ))}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* 선택한 날의 꿈 */}
            <div style={{ marginTop: 22 }}>
              {selDay && selDayEntries.length > 0 ? (
                <>
                  <p style={{ fontFamily: serif, fontSize: 15, color: C.glowSoft, marginBottom: 12 }}>
                    {fmtDate(selDayEntries[0].date)}의 꿈 · {selDayEntries.length}개
                  </p>
                  {selDayEntries.map((e) => (
                    <button key={e.id} onClick={() => { setSelectedId(e.id); setEditing(false); setShowReading(false); setCopied(false); setAiText(e.aiReading || ""); setAiSaved(false); setAiEditing(!(e.aiReading)); setView("detail"); }}
                      style={{ all: "unset", boxSizing: "border-box", display: "block", width: "100%", cursor: "pointer",
                        background: C.card, border: `1px solid ${C.cardLine}`, borderRadius: 14, padding: "13px 15px", marginBottom: 9 }}>
                      <span style={{ fontSize: 12, color: C.lavender }}>{fmtTime(e.date)}</span>
                      {e.title && <p style={{ fontFamily: serif, fontSize: 15.5, fontWeight: 700, color: C.moon, margin: "4px 0 0" }}>{e.title}</p>}
                      <p style={{ fontFamily: serif, fontSize: 14.5, lineHeight: 1.6, color: e.title ? C.lavender : C.moon, margin: "3px 0 0",
                        display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{e.text}</p>
                    </button>
                  ))}
                </>
              ) : (
                <p style={{ textAlign: "center", fontSize: 13.5, color: C.lavender, padding: "10px 0" }}>
                  {selDay ? "이 날 기록한 꿈이 없어요." : "점이 있는 날짜를 눌러 꿈을 확인하세요."}
                </p>
              )}
            </div>
          </div>
        )}

        {/* ─────────── STATS ─────────── */}
        {view === "stats" && (
          <div className="rise" style={{ padding: "10px 22px 0", position: "relative", zIndex: 1 }}>
            <h2 style={{ fontFamily: serif, fontSize: 22, margin: "10px 0 18px" }}>통계</h2>

            {entries.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px", color: C.lavender }}>
                <BarChart3 size={32} color={C.violet} strokeWidth={1.3} style={{ opacity: .7 }} />
                <p style={{ fontFamily: serif, fontSize: 16, marginTop: 14 }}>아직 통계를 보여줄 기록이 없어요.</p>
              </div>
            ) : (
              <>
                {/* 요약 카드 */}
                <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
                  {[["전체", entries.length], ["이번 주", weekCount], ["이번 달", monthCount]].map(([label, val]) => (
                    <div key={label} style={{ flex: 1, background: C.card, border: `1px solid ${C.cardLine}`, borderRadius: 14, padding: "15px 10px", textAlign: "center" }}>
                      <div style={{ fontFamily: serif, fontSize: 26, fontWeight: 700, color: C.glow }}>{val}</div>
                      <div style={{ fontSize: 12, color: C.lavender, marginTop: 3 }}>{label}</div>
                    </div>
                  ))}
                </div>

                {streak > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "13px 15px", borderRadius: 14, marginBottom: 16,
                    background: "rgba(240,168,126,.10)", border: `1px solid ${C.glow}` }}>
                    <span style={{ fontSize: 18 }}>🔥</span>
                    <span style={{ fontSize: 14, color: C.glowSoft, fontWeight: 700 }}>{streak}일 연속 기록 중</span>
                    <span style={{ fontSize: 12.5, color: C.lavender, marginLeft: "auto" }}>
                      {recordedToday ? "오늘도 기록 완료" : "오늘 기록하면 이어져요"}
                    </span>
                  </div>
                )}

                {topSlot.value > 0 && (
                  <p style={{ fontSize: 13.5, color: C.lavender, marginBottom: 22, lineHeight: 1.6 }}>
                    꿈을 가장 많이 기록한 시간대는 <span style={{ color: C.glowSoft, fontWeight: 700 }}>{topSlot.label}</span>이에요.
                  </p>
                )}

                {/* 월별 추이 */}
                <div style={{ marginBottom: 26 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                    <h3 style={{ fontFamily: serif, fontSize: 16, color: C.moon, margin: 0 }}>월별 기록</h3>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <button onClick={() => setStatsYear((y) => y - 1)} disabled={statsYear <= minYear}
                        aria-label="이전 해"
                        style={{ background: "none", border: "none", cursor: statsYear <= minYear ? "default" : "pointer",
                          color: statsYear <= minYear ? "rgba(173,169,212,.35)" : C.lavender, display: "flex", padding: 4 }}>
                        <ChevronLeft size={18} />
                      </button>
                      <span style={{ fontFamily: serif, fontSize: 15, color: C.glowSoft, minWidth: 54, textAlign: "center" }}>{statsYear}년</span>
                      <button onClick={() => setStatsYear((y) => y + 1)} disabled={statsYear >= now.getFullYear()}
                        aria-label="다음 해"
                        style={{ background: "none", border: "none", cursor: statsYear >= now.getFullYear() ? "default" : "pointer",
                          color: statsYear >= now.getFullYear() ? "rgba(173,169,212,.35)" : C.lavender, display: "flex", padding: 4 }}>
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>
                  <Bars data={byMonth} accent={C.glow} />
                  <p style={{ fontSize: 12, color: C.lavender, marginTop: 10, opacity: .8 }}>{statsYear}년 총 {yearTotal}개</p>
                </div>

                {/* 요일별 */}
                <div style={{ marginBottom: 26 }}>
                  <h3 style={{ fontFamily: serif, fontSize: 16, color: C.moon, margin: "0 0 14px" }}>요일별 기록</h3>
                  <Bars data={byWeekday} accent={C.violet} />
                </div>

                {/* 시간대별 */}
                <div style={{ marginBottom: 26 }}>
                  <h3 style={{ fontFamily: serif, fontSize: 16, color: C.moon, margin: "0 0 14px" }}>시간대별 기록</h3>
                  <Bars data={bySlot} accent={C.glow} />
                  <p style={{ fontSize: 11.5, color: C.lavender, marginTop: 10, opacity: .8 }}>
                    새벽 0–5시 · 아침 5–8시 · 오전 8–12시 · 오후 12–18시 · 밤 18–24시
                  </p>
                </div>

                {/* 느낌·유형별 */}
                {byTag.length > 0 && (
                  <div style={{ marginBottom: 26 }}>
                    <h3 style={{ fontFamily: serif, fontSize: 16, color: C.moon, margin: "0 0 14px" }}>느낌 · 유형별 기록</h3>
                    <Bars data={byTag} accent={C.violet} />
                  </div>
                )}

                {/* 깬 뒤 기분 */}
                {moodEntries.length > 0 && (
                  <div style={{ marginBottom: 26 }}>
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 14 }}>
                      <h3 style={{ fontFamily: serif, fontSize: 16, color: C.moon, margin: 0 }}>깬 뒤 기분</h3>
                      <span style={{ fontSize: 12.5, color: C.lavender }}>
                        평균 {moodAvg.toFixed(1)} · {moodOf(Math.round(moodAvg))?.emoji}
                      </span>
                    </div>
                    <Bars data={byMood} accent={C.glow} />
                  </div>
                )}

                {/* 자주 나오는 단어 */}
                {freqWords.length > 0 && (
                  <div style={{ marginBottom: 10 }}>
                    <h3 style={{ fontFamily: serif, fontSize: 16, color: C.moon, margin: "0 0 6px" }}>자주 나오는 단어</h3>
                    <p style={{ fontSize: 12, color: C.lavender, margin: "0 0 14px", opacity: .8 }}>단어를 누르면 그 단어가 담긴 꿈을 찾아봐요.</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 9 }}>
                      {freqWords.map((w, i) => (
                        <button key={w.word} onClick={() => { setQuery(w.word); setTagFilter(null); setFavOnly(false); setView("journal"); }}
                          style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 13px", borderRadius: 12, cursor: "pointer",
                            background: C.card, border: `1px solid ${C.cardLine}`,
                            color: i < 3 ? C.glowSoft : C.lavender, fontFamily: serif,
                            fontSize: 15 + Math.min(6, w.count) }}>
                          {w.word}
                          <span style={{ fontFamily: sans, fontSize: 11.5, color: C.lavender, opacity: .8 }}>{w.count}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ─────────── SETTINGS ─────────── */}
        {view === "settings" && (
          <div className="rise" style={{ padding: "10px 22px 0", position: "relative", zIndex: 1 }}>
            <button onClick={() => setView("journal")}
              style={{ background: "none", border: "none", cursor: "pointer", color: C.lavender,
                fontSize: 14, display: "flex", alignItems: "center", gap: 6, padding: "4px 0", marginBottom: 10 }}>
              <ChevronLeft size={18} /> 뒤로
            </button>

            <h2 style={{ fontFamily: serif, fontSize: 22, margin: "10px 0 8px" }}>백업</h2>
            <p style={{ fontSize: 13.5, color: C.lavender, lineHeight: 1.65, margin: "0 0 24px" }}>
              꿈은 이 기기에 저장돼요. 가끔 백업 파일로 내보내 드라이브나 메일에 보관해두면, 기기를 바꾸거나 앱을 다시 설치해도 안전하게 되살릴 수 있어요.
            </p>

            <div style={{ background: C.card, border: `1px solid ${C.cardLine}`, borderRadius: 16, padding: "18px 17px", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <p style={{ fontFamily: serif, fontSize: 16, color: C.moon, margin: 0 }}>내보내기</p>
                  <p style={{ fontSize: 12.5, color: C.lavender, margin: "3px 0 0" }}>현재 {entries.length}개의 꿈을 파일로 저장</p>
                </div>
                <button onClick={exportData} disabled={entries.length === 0}
                  style={{ display: "flex", alignItems: "center", gap: 7, padding: "11px 16px", borderRadius: 12, border: "none",
                    cursor: entries.length ? "pointer" : "default",
                    background: entries.length ? C.glow : C.raised, color: entries.length ? C.night : C.lavender,
                    fontFamily: sans, fontSize: 14, fontWeight: 700 }}>
                  <Download size={16} /> 저장
                </button>
              </div>
            </div>

            <div style={{ background: C.card, border: `1px solid ${C.cardLine}`, borderRadius: 16, padding: "18px 17px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <p style={{ fontFamily: serif, fontSize: 16, color: C.moon, margin: 0 }}>가져오기</p>
                  <p style={{ fontSize: 12.5, color: C.lavender, margin: "3px 0 0" }}>백업 파일에서 불러오기 (기존 기록에 합쳐져요)</p>
                </div>
                <button onClick={() => fileRef.current?.click()}
                  style={{ display: "flex", alignItems: "center", gap: 7, padding: "11px 16px", borderRadius: 12, cursor: "pointer",
                    background: "transparent", border: `1px solid ${C.violet}`, color: C.glowSoft, fontFamily: sans, fontSize: 14 }}>
                  <Upload size={16} /> 불러오기
                </button>
              </div>
              <input ref={fileRef} type="file" accept="application/json,.json" style={{ display: "none" }}
                onChange={(ev) => { const f = ev.target.files?.[0]; if (f) importData(f); ev.target.value = ""; }} />
            </div>

            {importMsg && <p style={{ fontSize: 13, color: C.glowSoft, marginTop: 16, lineHeight: 1.6 }}>{importMsg}</p>}

            {/* ── 잠금 ── */}
            <h2 style={{ fontFamily: serif, fontSize: 22, margin: "36px 0 8px" }}>잠금</h2>
            <p style={{ fontSize: 13.5, color: C.lavender, lineHeight: 1.65, margin: "0 0 18px" }}>
              가장 사적인 기록이니까요. PIN을 켜두면 앱을 열 때마다 잠금을 풀어야 볼 수 있어요.
            </p>
            <div style={{ background: C.card, border: `1px solid ${C.cardLine}`, borderRadius: 16, padding: "18px 17px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                  <Lock size={19} color={lockPin ? C.glow : C.lavender} strokeWidth={1.8} />
                  <div>
                    <p style={{ fontFamily: serif, fontSize: 16, color: C.moon, margin: 0 }}>앱 잠금 (PIN)</p>
                    <p style={{ fontSize: 12.5, color: C.lavender, margin: "3px 0 0" }}>{lockPin ? "켜짐 · 열 때 PIN을 물어봐요" : "꺼짐"}</p>
                  </div>
                </div>
                <button onClick={() => { setLockError(""); setLockModal(lockPin ? "disable" : "new"); }}
                  style={{ padding: "10px 18px", borderRadius: 12, cursor: "pointer", fontFamily: sans, fontSize: 14, fontWeight: 700,
                    border: lockPin ? `1px solid ${C.cardLine}` : "none",
                    background: lockPin ? "transparent" : C.glow, color: lockPin ? C.lavender : C.night }}>
                  {lockPin ? "끄기" : "켜기"}
                </button>
              </div>
            </div>

            {/* ── 아침 알림 ── */}
            <h2 style={{ fontFamily: serif, fontSize: 22, margin: "36px 0 8px" }}>아침 알림</h2>
            <p style={{ fontSize: 13.5, color: C.lavender, lineHeight: 1.65, margin: "0 0 18px" }}>
              꿈은 깨고 나면 금방 잊혀요. 매일 정한 시간에 "방금 꾼 꿈을 기록하라"고 살짝 알려드릴게요.
            </p>
            <div style={{ background: C.card, border: `1px solid ${C.cardLine}`, borderRadius: 16, padding: "18px 17px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                  <Bell size={19} color={reminderOn ? C.glow : C.lavender} strokeWidth={1.8} />
                  <div>
                    <p style={{ fontFamily: serif, fontSize: 16, color: C.moon, margin: 0 }}>아침 기록 알림</p>
                    <p style={{ fontSize: 12.5, color: C.lavender, margin: "3px 0 0" }}>{reminderOn ? `매일 ${reminderTime}에 알림` : "꺼짐"}</p>
                  </div>
                </div>
                <button onClick={toggleReminder}
                  style={{ padding: "10px 18px", borderRadius: 12, cursor: "pointer", fontFamily: sans, fontSize: 14, fontWeight: 700,
                    border: reminderOn ? `1px solid ${C.cardLine}` : "none",
                    background: reminderOn ? "transparent" : C.glow, color: reminderOn ? C.lavender : C.night }}>
                  {reminderOn ? "끄기" : "켜기"}
                </button>
              </div>
              {reminderOn && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 16, paddingTop: 16, borderTop: `1px solid ${C.cardLine}` }}>
                  <Clock size={16} color={C.lavender} strokeWidth={1.7} />
                  <span style={{ fontSize: 13.5, color: C.lavender }}>알림 시간</span>
                  <input type="time" value={reminderTime} onChange={(ev) => changeReminderTime(ev.target.value)}
                    style={{ marginLeft: "auto", background: C.raised, border: `1px solid ${C.cardLine}`,
                      borderRadius: 10, padding: "7px 11px", color: C.moon, fontFamily: sans, fontSize: 14 }} />
                </div>
              )}
            </div>
            {reminderMsg && <p style={{ fontSize: 13, color: C.glowSoft, marginTop: 16, lineHeight: 1.6 }}>{reminderMsg}</p>}

            <div style={{ height: 30 }} />
          </div>
        )}

        {/* ─────────── 잠금 화면 ─────────── */}
        {locked && lockPin && lockModal !== "forgot" && (
          <div style={{ position: "fixed", inset: 0, zIndex: 100, background: C.night,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 28 }}>
            <PinPad title="드림노트" subtitle="PIN을 입력해 잠금을 해제하세요" error={lockError} onSubmit={onPinUnlock} />
            {lockRecoveryQ && (
              <button onClick={() => { setForgotA(""); setLockError(""); setLockModal("forgot"); }}
                style={{ marginTop: 22, background: "none", border: "none", cursor: "pointer", color: C.lavender, fontSize: 13.5, textDecoration: "underline", opacity: .85 }}>
                PIN을 잊으셨나요?
              </button>
            )}
          </div>
        )}

        {/* ─────────── PIN 설정/해제/복구 모달 ─────────── */}
        {lockModal && (
          <div style={{ position: "fixed", inset: 0, zIndex: 110, background: C.night,
            display: "flex", alignItems: "center", justifyContent: "center", padding: 28 }}>
            {lockModal === "new" && (
              <PinPad title="새 PIN 설정" subtitle="앱을 열 때 쓸 4자리 숫자를 정하세요" error={lockError}
                onSubmit={onPinNew} onCancel={() => { setLockError(""); setLockModal(null); }} />
            )}
            {lockModal === "confirm" && (
              <PinPad title="PIN 확인" subtitle="같은 PIN을 한 번 더 입력하세요" error={lockError}
                onSubmit={onPinConfirm} onCancel={() => { setLockError(""); setLockModal(null); pinFirstRef.current = ""; }} />
            )}
            {lockModal === "disable" && (
              <PinPad title="잠금 끄기" subtitle="현재 PIN을 입력하세요" error={lockError}
                onSubmit={onPinDisable} onCancel={() => { setLockError(""); setLockModal(null); }} />
            )}
            {lockModal === "recovery" && (
              <div style={{ width: "100%", maxWidth: 340, display: "flex", flexDirection: "column", alignItems: "center" }}>
                <Lock size={28} color={C.glowSoft} strokeWidth={1.6} />
                <h2 style={{ fontFamily: serif, fontSize: 20, color: C.moon, margin: "14px 0 6px", textAlign: "center" }}>잠금 복구 설정</h2>
                <p style={{ fontSize: 13, color: C.lavender, margin: "0 0 22px", textAlign: "center", lineHeight: 1.6 }}>
                  PIN을 잊었을 때 풀 수 있는<br />질문과 답을 정해 두세요.
                </p>
                <input value={recQ} onChange={(e) => setRecQ(e.target.value)} placeholder="복구 질문 (예: 첫 반려동물 이름은?)"
                  style={{ width: "100%", boxSizing: "border-box", background: C.raised, border: `1px solid ${C.cardLine}`,
                    borderRadius: 12, padding: "13px 14px", marginBottom: 10, color: C.moon, fontFamily: sans, fontSize: 15 }} />
                <input value={recA} onChange={(e) => setRecA(e.target.value)} placeholder="답"
                  style={{ width: "100%", boxSizing: "border-box", background: C.raised, border: `1px solid ${C.cardLine}`,
                    borderRadius: 12, padding: "13px 14px", color: C.moon, fontFamily: sans, fontSize: 15 }} />
                {lockError && <p style={{ fontSize: 13, color: C.glow, margin: "12px 0 0", textAlign: "center" }}>{lockError}</p>}
                <button onClick={submitRecovery}
                  style={{ width: "100%", marginTop: 18, padding: "14px", borderRadius: 13, cursor: "pointer", border: "none",
                    background: C.glow, color: C.night, fontFamily: sans, fontSize: 15, fontWeight: 700 }}>
                  잠금 켜기
                </button>
                <button onClick={() => { setLockError(""); setLockModal(null); pendingPinRef.current = ""; }}
                  style={{ marginTop: 14, background: "none", border: "none", cursor: "pointer", color: C.lavender, fontSize: 14 }}>
                  취소
                </button>
              </div>
            )}
            {lockModal === "forgot" && (
              <div style={{ width: "100%", maxWidth: 340, display: "flex", flexDirection: "column", alignItems: "center" }}>
                <Lock size={28} color={C.glowSoft} strokeWidth={1.6} />
                <h2 style={{ fontFamily: serif, fontSize: 20, color: C.moon, margin: "14px 0 14px", textAlign: "center" }}>잠금 복구</h2>
                <p style={{ fontSize: 14, color: C.glowSoft, margin: "0 0 6px", textAlign: "center", fontWeight: 700 }}>{lockRecoveryQ}</p>
                <p style={{ fontSize: 12.5, color: C.lavender, margin: "0 0 18px", textAlign: "center" }}>답을 맞히면 잠금이 풀리고 꺼져요.</p>
                <input value={forgotA} onChange={(e) => setForgotA(e.target.value)} placeholder="답"
                  style={{ width: "100%", boxSizing: "border-box", background: C.raised, border: `1px solid ${C.cardLine}`,
                    borderRadius: 12, padding: "13px 14px", color: C.moon, fontFamily: sans, fontSize: 15 }} />
                {lockError && <p style={{ fontSize: 13, color: C.glow, margin: "12px 0 0", textAlign: "center" }}>{lockError}</p>}
                <button onClick={submitForgot}
                  style={{ width: "100%", marginTop: 18, padding: "14px", borderRadius: 13, cursor: "pointer", border: "none",
                    background: C.glow, color: C.night, fontFamily: sans, fontSize: 15, fontWeight: 700 }}>
                  확인
                </button>
                <button onClick={() => { setLockError(""); setLockModal(null); setForgotA(""); }}
                  style={{ marginTop: 14, background: "none", border: "none", cursor: "pointer", color: C.lavender, fontSize: 14 }}>
                  취소
                </button>
              </div>
            )}
          </div>
        )}

        {/* ─────────── 삭제 확인 모달 ─────────── */}
        {pendingDelete !== null && (
          <div onClick={() => setPendingDelete(null)}
            style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(10,9,22,.66)", backdropFilter: "blur(3px)",
              display: "flex", alignItems: "center", justifyContent: "center", padding: 28 }}>
            <div onClick={(ev) => ev.stopPropagation()} className="rise"
              style={{ width: "100%", maxWidth: 340, background: C.card, borderRadius: 22, border: `1px solid ${C.cardLine}`,
                padding: "26px 24px 20px", boxShadow: "0 18px 50px rgba(0,0,0,.5)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 12, background: "rgba(240,168,126,.14)",
                  display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Trash2 size={18} color={C.glow} strokeWidth={1.9} />
                </div>
                <span style={{ fontFamily: serif, fontSize: 18, fontWeight: 700, color: C.moon }}>이 꿈을 삭제할까요?</span>
              </div>
              <p style={{ fontSize: 13.5, color: C.lavender, lineHeight: 1.7, margin: "0 0 22px" }}>
                삭제하면 되돌릴 수 없어요. 보관해 둔 AI 해석도 함께 사라집니다.
              </p>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setPendingDelete(null)}
                  style={{ flex: 1, padding: "13px", borderRadius: 13, cursor: "pointer",
                    background: C.raised, border: `1px solid ${C.cardLine}`, color: C.moon,
                    fontFamily: sans, fontSize: 14.5, fontWeight: 700 }}>
                  취소
                </button>
                <button onClick={() => { const id = pendingDelete; setPendingDelete(null); remove(id); setView("journal"); }}
                  style={{ flex: 1, padding: "13px", borderRadius: 13, cursor: "pointer",
                    background: C.glow, border: "none", color: C.night,
                    fontFamily: sans, fontSize: 14.5, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <Trash2 size={15} /> 삭제
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─────────── bottom nav ─────────── */}
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, display: "flex", justifyContent: "center", zIndex: 2 }}>
          <div style={{ width: "100%", maxWidth: 460, display: "flex", background: "rgba(19,18,42,.86)",
            backdropFilter: "blur(14px)", borderTop: `1px solid ${C.cardLine}`, padding: "10px 12px calc(10px + env(safe-area-inset-bottom))" }}>
            {[["capture", "기록", PenLine], ["journal", "일기장", BookOpen], ["calendar", "달력", Calendar], ["stats", "통계", BarChart3]].map(([v, label, Icon]) => {
              const active = view === v || (v === "journal" && view === "detail");
              return (
              <button key={v} onClick={() => setView(v)}
                style={{ flex: 1, background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column",
                  alignItems: "center", gap: 4, color: active ? C.glow : C.lavender }}>
                <Icon size={21} strokeWidth={active ? 2 : 1.6} />
                <span style={{ fontSize: 11.5, fontWeight: active ? 700 : 400 }}>{label}</span>
              </button>
            );})}
          </div>
        </div>
      </div>
    </div>
  );
}
