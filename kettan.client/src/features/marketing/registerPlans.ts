export const planLabels: Record<string, { label: string; color: string; bg: string; price: string }> = {
  starter: { label: "Starter Plan", color: "#6B4C2A", bg: "#F0E6D3", price: "PHP 2,999/mo" },
  growth: { label: "Growth Plan", color: "#6B4C2A", bg: "#F0E6D3", price: "PHP 7,999/mo" },
  enterprise: { label: "Enterprise Plan", color: "#C9A84C", bg: "#2C1A0E", price: "PHP 14,999/mo" },
};

export function resolvePlan(planId: string | null) {
  const normalized = (planId ?? "growth").toLowerCase();
  return {
    planId: planLabels[normalized] ? normalized : "growth",
    planInfo: planLabels[normalized] ?? planLabels.growth,
  };
}
