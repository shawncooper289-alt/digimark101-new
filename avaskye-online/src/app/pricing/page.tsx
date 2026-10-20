import { redirect } from "next/navigation"

export default function PricingPage() {
  // Office is private founder access only. Public pricing and checkout live on digimark101.com.
  redirect("/")
}
