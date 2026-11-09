// Horários de funcionamento: semana geral + datas especiais (horário de Brasília).
import type { DayHours, Settings, SpecialDay, WeeklyHours } from "./types";

export const WEEKDAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"] as const;
const WEEKDAYS_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"] as const;
const TZ = "America/Sao_Paulo";

type HoursSettings = Pick<Settings, "weekly_hours" | "special_hours">;

/** Dia da semana (0 = domingo) de uma data "AAAA-MM-DD". */
export const weekdayOf = (date: string) => new Date(`${date}T12:00:00Z`).getUTCDay();

/** Horário de um dia: a data especial vale mais que a semana geral. null = fechado. */
export function hoursForDate(s: HoursSettings, date: string): DayHours {
  const special = s.special_hours?.find((d) => d.date === date);
  if (special) return special.closed || !special.open || !special.close ? null : { open: special.open, close: special.close };
  return s.weekly_hours?.[String(weekdayOf(date)) as keyof WeeklyHours] ?? null;
}

const toMin = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
};
const toTime = (min: number) => `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

/** Agora, no horário de Brasília, como "AAAA-MM-DD" e minutos do dia. */
function nowInBrazil(offsetMs = 0) {
  const d = new Date(Date.now() + offsetMs);
  const date = new Intl.DateTimeFormat("sv-SE", { timeZone: TZ }).format(d);
  const time = new Intl.DateTimeFormat("sv-SE", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(d);
  return { date, minutes: toMin(time) };
}

/**
 * Horários que o cliente pode escolher num dia (de 30 em 30 min, da abertura até o fechamento,
 * incluindo o horário de fechar), respeitando a antecedência mínima em horas.
 */
export function timeSlots(s: HoursSettings, date: string, minHoursAhead = 0, step = 30): string[] {
  const h = hoursForDate(s, date);
  if (!h) return [];
  const earliest = nowInBrazil(minHoursAhead * 3600_000);
  if (date < earliest.date) return [];
  const slots: string[] = [];
  for (let m = toMin(h.open); m <= toMin(h.close); m += step) {
    if (date === earliest.date && m < earliest.minutes) continue;
    slots.push(toTime(m));
  }
  return slots;
}

/** Primeiro dia (a partir de "minDate") em que há horário disponível. */
export function firstOpenDate(s: HoursSettings, minDate: string, minHoursAhead = 0) {
  let d = new Date(`${minDate}T12:00:00Z`);
  for (let i = 0; i < 60; i++) {
    const iso = d.toISOString().slice(0, 10);
    if (timeSlots(s, iso, minHoursAhead).length) return iso;
    d = new Date(d.getTime() + 86400_000);
  }
  return minDate;
}

/** "9h", "9h30", "18h" */
export const formatHour = (t: string) => {
  const [h, m] = t.split(":");
  return `${Number(h)}h${m && m !== "00" ? m : ""}`;
};

/** Texto da semana, ex.: "Segunda a Sábado, das 9h às 18h". */
export function describeWeekly(weekly: WeeklyHours): string {
  const order = [1, 2, 3, 4, 5, 6, 0];
  const groups: { days: number[]; h: NonNullable<DayHours> }[] = [];
  for (const day of order) {
    const h = weekly[String(day) as keyof WeeklyHours];
    if (!h) continue;
    const last = groups[groups.length - 1];
    const prevDay = last?.days[last.days.length - 1];
    const consecutive = last && order.indexOf(day) === order.indexOf(prevDay!) + 1;
    if (last && consecutive && last.h.open === h.open && last.h.close === h.close) last.days.push(day);
    else groups.push({ days: [day], h });
  }
  if (!groups.length) return "Fechado";
  return groups
    .map(({ days, h }) => {
      const label =
        days.length === 1
          ? WEEKDAYS[days[0]]
          : days.length === 2
            ? `${WEEKDAYS[days[0]]} e ${WEEKDAYS[days[1]]}`
            : `${WEEKDAYS[days[0]]} a ${WEEKDAYS[days[days.length - 1]]}`;
      return `${label}, das ${formatHour(h.open)} às ${formatHour(h.close)}`;
    })
    .join(" · ");
}

/** Datas especiais de hoje até "days" dias à frente (para avisar no site). */
export function upcomingSpecials(special: SpecialDay[], days = 30): SpecialDay[] {
  const today = nowInBrazil().date;
  const limit = nowInBrazil(days * 86400_000).date;
  return [...(special ?? [])].filter((d) => d.date >= today && d.date <= limit).sort((a, b) => a.date.localeCompare(b.date));
}

/** "Dom 14/12 — 9h às 13h" / "Qui 25/12 — fechado" */
export function describeSpecial(d: SpecialDay) {
  const [, mm, dd] = d.date.split("-");
  const day = `${WEEKDAYS_SHORT[weekdayOf(d.date)]} ${dd}/${mm}`;
  const hours = d.closed || !d.open || !d.close ? "fechado" : `${formatHour(d.open)} às ${formatHour(d.close)}`;
  return `${day} — ${hours}${d.note ? ` (${d.note})` : ""}`;
}

/** Hoje em Brasília, "AAAA-MM-DD". */
export const todayInBrazil = () => nowInBrazil().date;
