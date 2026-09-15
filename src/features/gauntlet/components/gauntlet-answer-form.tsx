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
}: {
  actions: GauntletActions;
  id: string;
  label: string;
  placeholder: string;
  valueSource?: "province" | "plate";
  inputMode?: HTMLAttributes<HTMLInputElement>["inputMode"];
  pattern?: string;
  maxLength?: number;
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
    <form onSubmit={actions.submitAnswer}>
      <label htmlFor={id}>{label}</label>
      <input
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
      <button type="submit" disabled={!value.trim()}>提交答案</button>
    </form>
  );
}
