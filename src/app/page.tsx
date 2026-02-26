import { redirect } from "next/navigation";

export default function Home() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");

  redirect(`/summary/${year}-${month}`);
}
