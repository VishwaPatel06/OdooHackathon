import { NextResponse } from "next/server"

export async function GET() {
  // Threshold is an advisory soft limit for warnings
  const categories = [
    { id: "Meals", name: "Meals", threshold: 100 },
    { id: "Travel", name: "Travel", threshold: 500 },
    { id: "Lodging", name: "Lodging", threshold: 300 },
    { id: "Software", name: "Software", threshold: 100 },
    { id: "Office", name: "Office", threshold: 80 },
  ]
  return NextResponse.json(categories)
}
