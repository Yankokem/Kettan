export const planLabels: Record<string, { label: string; color: string; bg: string; price: string }> = {
  starter: { label: "Starter Plan", color: "#6B4C2A", bg: "rgba(107,76,42,0.1)", price: "PHP 2,999/mo" },
  growth: { label: "Growth Plan", color: "#C9A84C", bg: "rgba(201,168,76,0.15)", price: "PHP 7,999/mo" },
  enterprise: { label: "Enterprise Plan", color: "#546B3F", bg: "rgba(84,107,63,0.12)", price: "PHP 14,999/mo" },
};

export function resolvePlan(planId: string | null) {
  const normalized = (planId ?? "growth").toLowerCase();
  return {
    planId: planLabels[normalized] ? normalized : "growth",
    planInfo: planLabels[normalized] ?? planLabels.growth,
  };
}
