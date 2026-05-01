import { redirect } from "next/navigation"
import { getSessionUser } from "@/lib/blog/auth"
import ControlLoginForm from "./ControlLoginForm"

export default async function ControlLoginPage() {
  const user = await getSessionUser()
  if (user?.role === "admin") {
    redirect("/control/dashboard")
  }

  return <ControlLoginForm />
}
