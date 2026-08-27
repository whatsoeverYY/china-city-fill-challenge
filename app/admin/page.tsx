import type { Metadata } from "next";
import AdminDashboard from "../AdminDashboard";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "管理员后台",
  description: "查看中国城市填充挑战的玩家与游戏进度。",
};

export default function AdminPage() {
  return <AdminDashboard />;
}
