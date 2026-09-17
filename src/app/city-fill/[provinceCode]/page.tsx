import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  PROVINCE_BY_CODE,
  PROVINCES,
} from "@/domain/geography/data/provinces";
import GameRoot from "@/features/city-challenge/game-root";

export const dynamicParams = false;

export function generateStaticParams() {
  return PROVINCES.map((province) => ({ provinceCode: province.code }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ provinceCode: string }>;
}): Promise<Metadata> {
  const { provinceCode } = await params;
  const province = PROVINCE_BY_CODE.get(provinceCode);
  return province
    ? {
        title: `${province.shortName}城市填图`,
        description: `完成${province.name}地市或区县地图填充挑战。`,
      }
    : {};
}

export default async function ProvinceChallengePage({
  params,
}: {
  params: Promise<{ provinceCode: string }>;
}) {
  const { provinceCode } = await params;
  if (!PROVINCE_BY_CODE.has(provinceCode)) notFound();
  return <GameRoot initialProvinceCode={provinceCode} />;
}
