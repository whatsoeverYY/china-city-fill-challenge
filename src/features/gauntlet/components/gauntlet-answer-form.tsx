"use client";

import type { HTMLAttributes } from "react";
import type { GauntletActions } from "@/features/gauntlet/hooks/use-gauntlet-actions";
import { useGauntletSession } from "@/features/gauntlet/model/gauntlet-session-context";

export default function GauntletAnswerForm({
  actions,
  id,
  label,
  placeholder,
  valueSource = "province",
  inputMode,
  pattern,
  maxLength,
  allowEmpty = false,
}: {
  actions: GauntletActions;
  id: string;
  label: string;
  placeholder: string;
  valueSource?: "province" | "plate";
  inputMode?: HTMLAttributes<HTMLInputElement>["inputMode"];
  pattern?: string;
  maxLength?: number;
  allowEmpty?: boolean;
}) {
  const {
    plateAnswer,
    provinceAnswer,
    provinceInputRef,
    setPlateAnswer,
    setProvinceAnswer,
  } = useGauntletSession();
  const value = valueSource === "plate" ? plateAnswer : provinceAnswer;
  const setValue = valueSource === "plate" ? setPlateAnswer : setProvinceAnswer;
  return (
    <form className="grid gap-2" onSubmit={actions.submitAnswer}>
      <label className="text-[10px] font-black text-ink-soft" htmlFor={id}>{label}</label>
      <input
        className="min-h-12 rounded-xl border border-black/20 bg-white px-3 outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/15"
        ref={provinceInputRef}
        id={id}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        pattern={pattern}
        autoComplete="off"
        maxLength={maxLength}
      />
      <button className="min-h-12 cursor-pointer rounded-xl border-0 bg-brand-red px-4 font-black text-white disabled:cursor-not-allowed disabled:opacity-50" type="submit" disabled={!allowEmpty && !value.trim()}>提交答案</button>
    </form>
  );
}
