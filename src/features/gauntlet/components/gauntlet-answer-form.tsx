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
    <form className="grid gap-[9px]" onSubmit={actions.submitAnswer}>
      <label className="mt-2 text-[10px] font-black tracking-[.1em] text-ink-600" htmlFor={id}>{label}</label>
      <input
        className="h-[50px] w-full rounded-[10px] border border-stone-400 bg-paper-100 px-3.5 text-[15px] text-ink outline-none focus:border-city-500 focus:ring-[3px] focus:ring-city-500/15"
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
      <button className="mt-[13px] min-h-[50px] cursor-pointer rounded-[10px] border-0 bg-city-500 px-[18px] text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-40" type="submit" disabled={!allowEmpty && !value.trim()}>提交答案</button>
    </form>
  );
}
