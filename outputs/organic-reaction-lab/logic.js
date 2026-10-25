import {validateMechanism} from './electron-flow.js';

export function angleDistance(a, b) {
  return Math.abs(((a - b + 540) % 360) - 180);
}

export function inspectGeometry(kind, state) {
  if (kind === 'sn2') return {ok: angleDistance(state.approach, 180) <= 12, label: `進攻角 ${Math.round(state.approach)}°`, reason: '將親核劑調到脫離基背面，Nu–C–Br 接近 180°。'};
  if (kind === 'sn1') return {ok: state.step >= 1 && state.faceSeen?.includes('front') && state.faceSeen?.includes('back'), label: state.step >= 1 ? '已建立平面中間體' : '目前仍是四面體受質', reason: '先建立平面碳陽離子，再分別觀察兩面進攻。'};
  if (kind === 'e1') return {ok: state.step >= 1 && state.beta === 'Hethyl', label: state.beta ? `已選擇 ${state.beta}` : '尚未選取 β-H', reason: '先建立碳陽離子，再選擇乙基側 β-H，以支持這次要解釋的較多取代烯類。'};
  if (kind === 'e2') return {ok: Boolean(state.beta) && angleDistance(state.torsion, 180) <= 12, label: `H–Cβ–Cα–Br ${Math.round(state.torsion)}°`, reason: '選取 β-H，再旋轉 Cα–Cβ 單鍵，使二面角接近 180°。'};
  if (kind === 'chair') return {ok: state.chair === 'axial' && state.beta === 'H6', label: state.chair === 'axial' ? 'Br 軸向' : 'Br 赤道向', reason: '將 Br 翻到軸向，再選 C6 的反式軸向氫；C2 軸向被甲基占據。'};
  return {ok: angleDistance(state.approach, 180) <= 12 && angleDistance(state.torsion, 180) <= 12 && Boolean(state.beta), label: '雙條件比較', reason: '依序保存 SN2 背面進攻與 E2 反疊構形（antiperiplanar conformation）的證據。'};
}

export function gradeLevel(level, draft, spatial, arrows = null) {
  const mechanism = draft.mechanism === level.answer;
  const selected = new Set(draft.reasons || []);
  const correct = level.reasons.filter(r => r.correct).map(r => r.id);
  const falseSelected = level.reasons.some(r => !r.correct && selected.has(r.id));
  const reasonScore = falseSelected ? 0 : Math.min(2, correct.filter(id => selected.has(id)).length);
  const steps = draft.sequence === level.sequenceAnswer && arrows !== false;
  const product = draft.product === level.productAnswer;
  const competition = draft.competition === level.competitionAnswer;
  const score = (mechanism ? 2 : 0) + reasonScore + (steps ? 2 : 0) + (spatial ? 2 : 0) + (product ? 1 : 0) + (competition ? 1 : 0);
  return {score, passed: score >= 8 && mechanism && steps && spatial && product, checks: {mechanism, reasons: reasonScore === 2, steps, ...(arrows===null?{}:{arrows}), spatial: Boolean(spatial), product, competition}};
}

export function recordAttempt(previous, attempt) {
  const attempts = [...(previous?.attempts || []), structuredClone(attempt)];
  return {attempts, first: previous?.first || structuredClone(attempt), best: Math.max(previous?.best || 0, attempt.score), passed: Boolean(previous?.passed || attempt.passed)};
}

export function gradeExam(items, answers, evidence = {}, mechanisms = {}) {
  const dimensions = {};
  let earned = 0;
  for (const item of items) {
    const correct = answers[item.id] === item.answer;
    const points = item.mechanism ? (correct ? 5 : 0) + (validateMechanism(item.mechanism,mechanisms[item.id]).ok ? 5 : 0) : item.spatial ? (correct ? item.points - 5 : 0) + (evidence[item.id]?.valid === true ? 5 : 0) : correct ? item.points : 0;
    earned += points;
    const d = dimensions[item.dimension] ||= {earned: 0, possible: 0};
    d.possible += item.points;
    d.earned += points;
  }
  return {score: earned, dimensions};
}

export function parseProgress(raw) {
  if (!raw) return {version: 1, current: 0, levels: {}, exams: {}, drafts: {}};
  const data = JSON.parse(raw);
  if (data?.version !== 1 || !Number.isInteger(data.current) || data.current < 0 || data.current > 5 || !data.levels || !data.exams || !data.drafts || typeof data.levels !== 'object' || typeof data.exams !== 'object' || typeof data.drafts !== 'object' || Array.isArray(data.levels) || Array.isArray(data.exams) || Array.isArray(data.drafts)) throw new Error('進度格式不符');
  for(const record of Object.values(data.levels)) {
    if(!record || !Array.isArray(record.attempts) || record.attempts.some(a=>!a || !Number.isFinite(a.score) || a.score<0 || a.score>10) || !record.first || !Number.isFinite(record.first.score) || !Number.isFinite(record.best)) throw new Error('關卡紀錄格式不符');
  }
  for(const records of Object.values(data.exams)) {
    if(!Array.isArray(records) || records.some(r=>!r || !Number.isFinite(r.score) || r.score<0 || r.score>100 || !r.dimensions || !r.answers)) throw new Error('評量紀錄格式不符');
  }
  for(const draft of Object.values(data.drafts)) {
    if(!draft || typeof draft!=='object' || !draft.scene || !draft.evidence || !Array.isArray(draft.reasons) || !Array.isArray(draft.messages) || !Number.isFinite(draft.hints)) throw new Error('作答草稿格式不符');
  }
  return data;
}
