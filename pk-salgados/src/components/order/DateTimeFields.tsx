"use client";
// Campos "Data" + "Horário" que só oferecem horários em que a loja está aberta
// (semana geral + datas especiais definidas no painel → aba Horários).
import { useMemo } from "react";
import { Clock } from "lucide-react";
import type { Settings } from "@/lib/types";
import { describeSpecial, describeWeekly, firstOpenDate, timeSlots, todayInBrazil, upcomingSpecials, formatHour } from "@/lib/hours";

export function DateTimeFields({
  settings,
  idPrefix,
  date,
  time,
  onChange,
  minHoursAhead = 0,
  minDate,
  showErrors,
  dateLabel = "Data *",
  timeLabel = "Horário *",
}: {
  settings: Settings;
  idPrefix: string;
  date: string;
  time: string;
  onChange: (v: { date: string; time: string }) => void;
  minHoursAhead?: number;
  minDate?: string; // ex.: bolo com X dias de antecedência
  showErrors?: boolean;
  dateLabel?: string;
  timeLabel?: string;
}) {
  const min = minDate ?? todayInBrazil();
  const slots = useMemo(() => (date ? timeSlots(settings, date, minHoursAhead) : []), [settings, date, minHoursAhead]);
  const suggestion = useMemo(() => firstOpenDate(settings, min, minHoursAhead), [settings, min, minHoursAhead]);
  const specials = upcomingSpecials(settings.special_hours);
  const closedDay = !!date && date >= min && !slots.length;
  const tooEarly = !!date && date < min;

  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor={`${idPrefix}-data`}>{dateLabel}</label>
          <input
            id={`${idPrefix}-data`}
            type="date"
            className="field"
            min={min}
            value={date}
            onChange={(e) => onChange({ date: e.target.value, time: "" })}
            aria-invalid={(showErrors && !date) || closedDay || tooEarly}
          />
        </div>
        <div>
          <label className="label" htmlFor={`${idPrefix}-hora`}>{timeLabel}</label>
          <select
            id={`${idPrefix}-hora`}
            className="field"
            value={time}
            disabled={!slots.length}
            onChange={(e) => onChange({ date, time: e.target.value })}
            aria-invalid={showErrors && !time}
          >
            <option value="">{!date ? "Escolha a data" : slots.length ? "Escolha…" : "Fechado"}</option>
            {slots.map((s) => (
              <option key={s} value={s}>{formatHour(s)}</option>
            ))}
          </select>
        </div>
      </div>

      {tooEarly && <p className="error-text">Escolha uma data a partir de {min.split("-").reverse().join("/")}.</p>}
      {closedDay && (
        <p className="error-text" role="alert">
          A loja não abre nesse dia{minHoursAhead ? " (ou não há mais horários com a antecedência necessária)" : ""}.{" "}
          {suggestion !== date && (
            <button type="button" className="font-semibold underline" onClick={() => onChange({ date: suggestion, time: "" })}>
              Usar {suggestion.split("-").reverse().join("/")}
            </button>
          )}
        </p>
      )}
      {showErrors && !date && <p className="error-text">Escolha a data.</p>}
      {showErrors && date && !closedDay && !tooEarly && !time && <p className="error-text">Escolha o horário.</p>}

      <p className="hint mt-1.5 flex items-start gap-1.5">
        <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
        <span>
          {describeWeekly(settings.weekly_hours)}
          {specials.length > 0 && <> · Especiais: {specials.slice(0, 3).map(describeSpecial).join("; ")}</>}
        </span>
      </p>
    </div>
  );
}
