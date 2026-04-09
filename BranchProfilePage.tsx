import type { InputHTMLAttributes, TextareaHTMLAttributes, ReactNode, ElementType } from "react";
import { useState } from "react";
import { motion } from "motion/react";
import {
  ArrowLeft, MapPin, Phone, Clock, Users, Package,
  ShoppingCart, Building2, Save, ChevronDown,
  CheckCircle2, AlertTriangle, Edit3, Warehouse,
  User, ChevronRight, ToggleLeft,
} from "lucide-react";
import { t } from "../../lib/tokens";
import { DataTable, type ColumnDef } from "../ui/DataTable";

// ─── Types ────────────────────────────────────────────────────────────────────

interface BranchEmployee {
  id: number;
  firstName: string;
  lastName: string;
  position: string;
  contactNumber: string;
  dateHired: string;
  isActive: boolean;
}

interface BranchFormData {
  name: string;
  address: string;
  city: string;
  contactNumber: string;
  openTime: string;
  closeTime: string;
  ownerUserId: string;
  managerUserId: string;
  status: "active" | "setup";
  notes: string;
}

// ─── Mock data ─────────────────────────────────────────────────────────────────

const INITIAL_FORM: BranchFormData = {
  name: "BGC Taguig",
  address: "26th Street, Bonifacio Global City, Taguig City, Metro Manila",
  city: "Taguig",
  contactNumber: "+63 917 555 0101",
  openTime: "07:00",
  closeTime: "22:00",
  ownerUserId: "owner-1",
  managerUserId: "mgr-3",
  status: "active",
  notes: "Flagship branch. High-traffic area near corporate offices. Peak hours: 7–9 AM and 12–2 PM.",
};

const MOCK_EMPLOYEES: BranchEmployee[] = [
  { id: 1,  firstName: "Maria",    lastName: "Santos",     position: "Shift Supervisor",  contactNumber: "+63 917 100 0001", dateHired: "2020-11-10", isActive: true  },
  { id: 2,  firstName: "Juan",     lastName: "Dela Cruz",  position: "Senior Barista",    contactNumber: "+63 917 100 0002", dateHired: "2021-06-01", isActive: true  },
  { id: 3,  firstName: "Angela",   lastName: "Reyes",      position: "Shift Supervisor",  contactNumber: "+63 917 100 0003", dateHired: "2021-09-15", isActive: true  },
  { id: 4,  firstName: "Kevin",    lastName: "Lim",        position: "Barista",           contactNumber: "+63 917 100 0004", dateHired: "2022-03-20", isActive: true  },
  { id: 5,  firstName: "Carla",    lastName: "Mendoza",    position: "Cashier",           contactNumber: "+63 917 100 0005", dateHired: "2022-08-05", isActive: false },
  { id: 6,  firstName: "Paolo",    lastName: "Villanueva", position: "Barista",           contactNumber: "+63 917 100 0006", dateHired: "2023-05-12", isActive: true  },
  { id: 7,  firstName: "Sophia",   lastName: "Cruz",       position: "Cashier",           contactNumber: "+63 917 100 0007", dateHired: "2023-09-01", isActive: true  },
  { id: 8,  firstName: "Miguel",   lastName: "Torres",     position: "Barista",           contactNumber: "+63 917 100 0008", dateHired: "2024-01-15", isActive: false },
  { id: 9,  firstName: "Isabelle", lastName: "Garcia",     position: "Shift Supervisor",  contactNumber: "+63 917 100 0009", dateHired: "2021-03-20", isActive: true  },
  { id: 10, firstName: "Ryan",     lastName: "Aquino",     position: "Barista",           contactNumber: "+63 917 100 0010", dateHired: "2023-11-08", isActive: true  },
  { id: 11, firstName: "Nina",     lastName: "Pascual",    position: "Cashier",           contactNumber: "+63 917 100 0011", dateHired: "2024-02-28", isActive: true  },
  { id: 12, firstName: "Marcus",   lastName: "Tan",        position: "Barista",           contactNumber: "+63 917 100 0012", dateHired: "2022-07-14", isActive: true  },
];

const OWNER_OPTIONS = [
  { value: "",        label: "Unassigned (Optional)" },
  { value: "owner-1", label: "Rafael Morales" },
  { value: "owner-2", label: "Diana Lim" },
  { value: "owner-3", label: "Bernard Santos" },
];

const MANAGER_OPTIONS = [
  { value: "mgr-1", label: "Angela Reyes" },
  { value: "mgr-2", label: "Paolo Villanueva" },
  { value: "mgr-3", label: "Isabelle Garcia" },
];

const STATUS_OPTIONS = [
  { value: "active", label: "Active (Operational)" },
  { value: "setup",  label: "Setup Pending" },
];

const CITY_OPTIONS = [
  { value: "Taguig",   label: "Taguig" },
  { value: "Makati",   label: "Makati" },
  { value: "BGC",      label: "BGC" },
  { value: "Pasig",    label: "Pasig" },
  { value: "Quezon",   label: "Quezon City" },
  { value: "Manila",   label: "Manila" },
  { value: "Mandaluyong", label: "Mandaluyong" },
];

// ─── Sub-components ────────────────────────────────────────────────────────────

function FormInput({
  label,
  icon: Icon,
  ...props
}: { label: string; icon?: ElementType } & InputHTMLAttributes<HTMLInputElement>) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label
        className="block mb-1.5 ml-0.5 text-[11px] uppercase tracking-widest"
        style={{ color: t.textSecondary, fontWeight: 600 }}
      >
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon
            size={14}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: focused ? t.brown : t.textMuted }}
          />
        )}
        <input
          {...props}
          onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
          className="w-full text-sm rounded-xl outline-none transition-all duration-200"
          style={{
            padding: Icon ? "10px 14px 10px 36px" : "10px 14px",
            border: `1.5px solid ${focused ? t.brown : t.border}`,
            backgroundColor: focused ? t.paper : "#FAFAFA",
            color: t.textPrimary,
            fontWeight: 500,
            boxShadow: focused ? `0 0 0 3px ${t.brownPale}` : "none",
          }}
        />
      </div>
    </div>
  );
}

function FormSelect({
  label,
  options,
  value,
  icon: Icon,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  icon?: ElementType;
  onChange: (val: string) => void;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label
        className="block mb-1.5 ml-0.5 text-[11px] uppercase tracking-widest"
        style={{ color: t.textSecondary, fontWeight: 600 }}
      >
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon
            size={14}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10"
            style={{ color: focused ? t.brown : t.textMuted }}
          />
        )}
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="w-full appearance-none text-sm rounded-xl outline-none transition-all duration-200 cursor-pointer"
          style={{
            padding: Icon ? "10px 36px 10px 36px" : "10px 36px 10px 14px",
            border: `1.5px solid ${focused ? t.brown : t.border}`,
            backgroundColor: focused ? t.paper : "#FAFAFA",
            color: t.textPrimary,
            fontWeight: 500,
            boxShadow: focused ? `0 0 0 3px ${t.brownPale}` : "none",
          }}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <ChevronDown
          size={13}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: t.textMuted }}
        />
      </div>
    </div>
  );
}

function FormTextArea({
  label,
  ...props
}: { label: string } & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label
        className="block mb-1.5 ml-0.5 text-[11px] uppercase tracking-widest"
        style={{ color: t.textSecondary, fontWeight: 600 }}
      >
        {label}
      </label>
      <textarea
        {...props}
        onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
        onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
        className="w-full text-sm rounded-xl outline-none transition-all duration-200 resize-none"
        style={{
          padding: "10px 14px",
          border: `1.5px solid ${focused ? t.brown : t.border}`,
          backgroundColor: focused ? t.paper : "#FAFAFA",
          color: t.textPrimary,
          fontWeight: 500,
          boxShadow: focused ? `0 0 0 3px ${t.brownPale}` : "none",
        }}
      />
    </div>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 mb-5">
      <div className="w-[3px] h-[18px] rounded-full" style={{ backgroundColor: t.brown }} />
      <span className="text-sm" style={{ color: t.textPrimary, fontWeight: 700 }}>
        {children}
      </span>
    </div>
  );
}

function SectionDivider() {
  return <div className="h-px my-7" style={{ backgroundColor: t.border }} />;
}

// ─── Format helpers ────────────────────────────────────────────────────────────

function fmt12(time24: string) {
  const [h, m] = time24.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function formatDate(s: string) {
  return new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function isOpen(openTime: string, closeTime: string) {
  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes();
  const [oh, om] = openTime.split(":").map(Number);
  const [ch, cm] = closeTime.split(":").map(Number);
  return cur >= oh * 60 + om && cur <= ch * 60 + cm;
}

// ─── Staff Table columns ───────────────────────────────────────────────────────

const staffColumns: ColumnDef<BranchEmployee>[] = [
  {
    key: "name",
    label: "Employee",
    width: "28%",
    render: (row) => (
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs flex-shrink-0"
          style={{
            backgroundColor: row.isActive ? t.brownPale : "#F3F4F6",
            color: row.isActive ? t.brown : t.textMuted,
            fontWeight: 700,
          }}
        >
          {row.firstName[0]}{row.lastName[0]}
        </div>
        <div>
          <div className="text-[13px]" style={{ color: t.textPrimary, fontWeight: 600 }}>
            {row.firstName} {row.lastName}
          </div>
        </div>
      </div>
    ),
  },
  {
    key: "position",
    label: "Position",
    width: "22%",
    render: (row) => (
      <span
        className="text-xs px-2.5 py-1 rounded-lg"
        style={{
          backgroundColor: row.position.includes("Supervisor") ? t.brownPale : "#F3F4F6",
          color: row.position.includes("Supervisor") ? t.brown : t.textSecondary,
          fontWeight: 600,
        }}
      >
        {row.position}
      </span>
    ),
  },
  {
    key: "contactNumber",
    label: "Contact",
    width: "22%",
    render: (row) => (
      <span className="text-xs" style={{ color: t.textSecondary, fontWeight: 500 }}>
        {row.contactNumber}
      </span>
    ),
  },
  {
    key: "dateHired",
    label: "Date Hired",
    width: "18%",
    render: (row) => (
      <span className="text-xs" style={{ color: t.textSecondary, fontWeight: 500 }}>
        {formatDate(row.dateHired)}
      </span>
    ),
  },
  {
    key: "isActive",
    label: "Status",
    width: "10%",
    align: "center",
    render: (row) => (
      <span
        className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md"
        style={{
          backgroundColor: row.isActive ? "#DCFCE7" : "#F3F4F6",
          color: row.isActive ? t.success : t.textMuted,
          fontWeight: 700,
        }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: row.isActive ? t.success : t.textMuted }}
        />
        {row.isActive ? "Active" : "Inactive"}
      </span>
    ),
  },
];

// ─── Main Component ────────────────────────────────────────────────────────────

export function BranchProfilePage({ onBack }: { onBack?: () => void }) {
  const [tab, setTab]           = useState(0);
  const [formData, setFormData] = useState<BranchFormData>(INITIAL_FORM);
  const [saved, setSaved]       = useState(false);

  const branchCode    = "BR-00001";
  const activeStaff   = MOCK_EMPLOYEES.filter((e) => e.isActive).length;
  const openNow       = isOpen(formData.openTime, formData.closeTime);

  const update = <K extends keyof BranchFormData>(key: K, val: BranchFormData[K]) =>
    setFormData((prev) => ({ ...prev, [key]: val }));

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const STATS = [
    { icon: Users,      label: "Total Staff",    value: MOCK_EMPLOYEES.length, color: t.brown,   bg: t.brownPale    },
    { icon: CheckCircle2, label: "Active",        value: activeStaff,           color: t.success, bg: "#DCFCE7"      },
    { icon: AlertTriangle, label: "Low Stock",    value: 3,                     color: t.warning, bg: "#FEF3C7"      },
    { icon: ShoppingCart, label: "Orders / Mo.",  value: 247,                   color: t.info,    bg: "#DBEAFE"      },
  ];

  return (
    <div className="pb-10">
      {/* ── Breadcrumb / back ─────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center gap-2 mb-5"
      >
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs rounded-lg px-2.5 py-1.5 transition-all duration-150"
          style={{ color: t.textSecondary, border: `1px solid ${t.border}`, backgroundColor: t.paper }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = t.bg; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = t.paper; }}
        >
          <ArrowLeft size={13} />
          <span style={{ fontWeight: 500 }}>Branches</span>
        </button>

        <ChevronRight size={13} style={{ color: t.textMuted }} />

        <span className="text-xs" style={{ color: t.textPrimary, fontWeight: 600 }}>
          {formData.name}
        </span>

        <span
          className="ml-1 text-[10px] px-2 py-0.5 rounded-full"
          style={{ backgroundColor: t.brownPale, color: t.brown, fontWeight: 700 }}
        >
          {branchCode}
        </span>
      </motion.div>

      {/* ── Hero Card ─────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="overflow-hidden mb-4"
        style={{
          backgroundColor: t.paper,
          borderRadius: t.radiusXl,
          border: `1px solid ${t.border}`,
        }}
      >
        {/* Gradient cover */}
        <div
          className="h-[128px] w-full relative"
          style={{
            background: "linear-gradient(135deg, #1A0F08 0%, #3D2210 30%, #6B4C2A 65%, #C9A84C 100%)",
          }}
        >
          {/* Decorative pattern overlay */}
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, #fff 1px, transparent 0)`,
              backgroundSize: "28px 28px",
            }}
          />

          {/* Operating hours badge top-right */}
          <div className="absolute top-4 right-4">
            <span
              className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-full"
              style={{
                backgroundColor: openNow ? "rgba(22,163,74,0.25)" : "rgba(255,255,255,0.12)",
                color: openNow ? "#86EFAC" : "rgba(255,255,255,0.6)",
                fontWeight: 600,
                border: `1px solid ${openNow ? "rgba(22,163,74,0.4)" : "rgba(255,255,255,0.15)"}`,
                backdropFilter: "blur(8px)",
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ backgroundColor: openNow ? "#4ADE80" : "rgba(255,255,255,0.4)" }}
              />
              {openNow ? "Open Now" : "Closed"}
            </span>
          </div>
        </div>

        {/* Profile info row */}
        <div className="px-6 pb-5">
          <div className="flex items-end justify-between gap-4" style={{ marginTop: -36 }}>
            {/* Avatar + info */}
            <div className="flex items-end gap-4">
              {/* Avatar */}
              <div
                className="w-[72px] h-[72px] rounded-2xl flex items-center justify-center flex-shrink-0 text-white text-2xl relative"
                style={{
                  backgroundColor: t.brownDark,
                  border: `3px solid ${t.paper}`,
                  fontWeight: 800,
                  letterSpacing: "-0.03em",
                  boxShadow: "0 4px 14px rgba(0,0,0,0.18)",
                }}
              >
                {formData.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
              </div>

              {/* Name + meta */}
              <div className="pb-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1
                    className="text-xl"
                    style={{ color: t.textPrimary, fontWeight: 800, letterSpacing: "-0.02em" }}
                  >
                    {formData.name}
                  </h1>
                  <span
                    className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full"
                    style={{
                      backgroundColor: formData.status === "active" ? "#DCFCE7" : "#F3F4F6",
                      color: formData.status === "active" ? t.success : t.textSecondary,
                      fontWeight: 700,
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{
                        backgroundColor: formData.status === "active" ? t.success : t.textMuted,
                      }}
                    />
                    {formData.status === "active" ? "Active" : "Setup Pending"}
                  </span>
                </div>

                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  <span
                    className="flex items-center gap-1 text-xs"
                    style={{ color: t.textSecondary, fontWeight: 500 }}
                  >
                    <MapPin size={12} style={{ color: t.textMuted }} />
                    {formData.city}
                  </span>
                  <span
                    className="flex items-center gap-1 text-xs"
                    style={{ color: t.textSecondary, fontWeight: 500 }}
                  >
                    <Clock size={12} style={{ color: t.textMuted }} />
                    {fmt12(formData.openTime)} – {fmt12(formData.closeTime)}
                  </span>
                  <span
                    className="flex items-center gap-1 text-xs"
                    style={{ color: t.textSecondary, fontWeight: 500 }}
                  >
                    <Phone size={12} style={{ color: t.textMuted }} />
                    {formData.contactNumber}
                  </span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 pb-1 flex-shrink-0">
              <button
                className="flex items-center gap-2 text-xs px-4 py-2.5 rounded-xl transition-all duration-150"
                style={{
                  border: `1.5px solid ${t.border}`,
                  color: t.textSecondary,
                  backgroundColor: t.paper,
                  fontWeight: 600,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = t.brown;
                  (e.currentTarget as HTMLElement).style.color = t.brown;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = t.border;
                  (e.currentTarget as HTMLElement).style.color = t.textSecondary;
                }}
              >
                <Warehouse size={14} />
                View Inventory
              </button>

              <button
                onClick={handleSave}
                className="flex items-center gap-2 text-xs px-4 py-2.5 rounded-xl text-white transition-all duration-150 active:scale-[0.97]"
                style={{
                  backgroundColor: saved ? t.success : t.brown,
                  fontWeight: 600,
                }}
                onMouseEnter={(e) => {
                  if (!saved) (e.currentTarget as HTMLElement).style.backgroundColor = t.brownLight;
                }}
                onMouseLeave={(e) => {
                  if (!saved) (e.currentTarget as HTMLElement).style.backgroundColor = t.brown;
                }}
              >
                {saved ? <CheckCircle2 size={14} /> : <Save size={14} />}
                {saved ? "Saved!" : "Save Changes"}
              </button>
            </div>
          </div>

          {/* ── Stats strip ── */}
          <div className="grid grid-cols-4 gap-3 mt-5 pt-5" style={{ borderTop: `1px solid ${t.border}` }}>
            {STATS.map((s) => (
              <div
                key={s.label}
                className="flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{ backgroundColor: "#FAFAFA", border: `1px solid ${t.border}` }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: s.bg }}
                >
                  <s.icon size={15} style={{ color: s.color }} />
                </div>
                <div>
                  <div className="text-lg" style={{ color: t.textPrimary, fontWeight: 700, lineHeight: 1 }}>
                    {s.value}
                  </div>
                  <div className="text-[11px] mt-0.5" style={{ color: t.textSecondary, fontWeight: 500 }}>
                    {s.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── Tab Panel ─────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.12 }}
        className="overflow-hidden"
        style={{
          backgroundColor: t.paper,
          borderRadius: t.radiusXl,
          border: `1px solid ${t.border}`,
        }}
      >
        {/* Tab bar */}
        <div
          className="flex items-end px-2"
          style={{ borderBottom: `1px solid ${t.border}` }}
        >
          {[
            { label: "Settings",    icon: Edit3  },
            { label: `Staff Roster (${MOCK_EMPLOYEES.length})`, icon: Users },
          ].map((tabItem, i) => {
            const active = tab === i;
            return (
              <button
                key={tabItem.label}
                onClick={() => setTab(i)}
                className="relative flex items-center gap-2 px-4 py-3.5 text-sm transition-colors duration-150"
                style={{
                  color: active ? t.brown : t.textSecondary,
                  fontWeight: active ? 700 : 500,
                }}
              >
                <tabItem.icon size={14} />
                {tabItem.label}
                {active && (
                  <motion.div
                    layoutId="tabIndicator"
                    className="absolute bottom-0 left-0 right-0 h-[2.5px] rounded-t-full"
                    style={{ backgroundColor: t.gold }}
                    transition={{ type: "spring", stiffness: 500, damping: 40 }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* ── Settings Tab ── */}
        {tab === 0 && (
          <motion.div
            key="settings"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="p-7"
          >
            {/* Section 1: Location & Contact */}
            <SectionLabel>Location &amp; Contact</SectionLabel>
            <div className="grid grid-cols-2 gap-5">
              <FormInput
                label="Branch Name"
                icon={Building2}
                value={formData.name}
                onChange={(e) => update("name", e.target.value)}
              />
              <FormSelect
                label="Status"
                icon={ToggleLeft}
                options={STATUS_OPTIONS}
                value={formData.status}
                onChange={(val) => update("status", val as "active" | "setup")}
              />
              <div className="col-span-2">
                <FormInput
                  label="Street Address"
                  icon={MapPin}
                  value={formData.address}
                  onChange={(e) => update("address", e.target.value)}
                />
              </div>
              <FormSelect
                label="City"
                icon={MapPin}
                options={CITY_OPTIONS}
                value={formData.city}
                onChange={(val) => update("city", val)}
              />
              <FormInput
                label="Contact Number"
                icon={Phone}
                value={formData.contactNumber}
                onChange={(e) => update("contactNumber", e.target.value)}
              />
            </div>

            <SectionDivider />

            {/* Section 2: Operating Hours */}
            <SectionLabel>Operating Hours</SectionLabel>

            {/* Visual hours display */}
            <div
              className="flex items-center gap-4 px-5 py-4 rounded-xl mb-5"
              style={{ backgroundColor: t.brownPale, border: `1px solid ${t.brownBorder}` }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: t.brown }}
              >
                <Clock size={16} style={{ color: "#fff" }} />
              </div>
              <div className="flex-1">
                <div className="text-sm" style={{ color: t.brownDark, fontWeight: 700 }}>
                  {fmt12(formData.openTime)} – {fmt12(formData.closeTime)}
                </div>
                <div className="text-xs mt-0.5" style={{ color: t.sidebarTextMuted }}>
                  {(() => {
                    const [oh, om] = formData.openTime.split(":").map(Number);
                    const [ch, cm] = formData.closeTime.split(":").map(Number);
                    const diff = (ch * 60 + cm) - (oh * 60 + om);
                    const hrs = Math.floor(diff / 60);
                    const mins = diff % 60;
                    return `${hrs}h${mins > 0 ? ` ${mins}m` : ""} operating window`;
                  })()}
                </div>
              </div>
              <span
                className="text-[11px] px-2.5 py-1 rounded-full flex-shrink-0"
                style={{
                  backgroundColor: openNow ? "#DCFCE7" : "#F3F4F6",
                  color: openNow ? t.success : t.textSecondary,
                  fontWeight: 700,
                }}
              >
                {openNow ? "Open Now" : "Closed Now"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <FormInput
                label="Opening Time"
                icon={Clock}
                type="time"
                value={formData.openTime}
                onChange={(e) => update("openTime", e.target.value)}
              />
              <FormInput
                label="Closing Time"
                icon={Clock}
                type="time"
                value={formData.closeTime}
                onChange={(e) => update("closeTime", e.target.value)}
              />
            </div>

            <SectionDivider />

            {/* Section 3: Staff Assignment */}
            <SectionLabel>Staff Assignment</SectionLabel>
            <div className="grid grid-cols-2 gap-5">
              <FormSelect
                label="Assigned Owner"
                icon={User}
                options={OWNER_OPTIONS}
                value={formData.ownerUserId}
                onChange={(val) => update("ownerUserId", val)}
              />
              <FormSelect
                label="Branch Manager"
                icon={User}
                options={MANAGER_OPTIONS}
                value={formData.managerUserId}
                onChange={(val) => update("managerUserId", val)}
              />
            </div>

            <SectionDivider />

            {/* Section 4: Notes + Inventory CTA */}
            <SectionLabel>Additional</SectionLabel>
            <div className="grid grid-cols-2 gap-5 mb-6">
              <div className="col-span-2">
                <FormTextArea
                  label="Branch Notes"
                  value={formData.notes}
                  rows={3}
                  onChange={(e) => update("notes", e.target.value)}
                  placeholder="Optional notes about this branch…"
                />
              </div>
            </div>

            {/* Inventory access CTA */}
            <div
              className="flex items-center justify-between gap-4 p-4 rounded-xl"
              style={{
                border: `1.5px dashed ${t.brownBorder}`,
                backgroundColor: t.brownSurface,
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: t.brownPale }}
                >
                  <Package size={16} style={{ color: t.brown }} />
                </div>
                <div>
                  <div className="text-sm" style={{ color: t.textPrimary, fontWeight: 700 }}>
                    Inventory Access
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: t.textSecondary }}>
                    View stock levels, batch details, and low-stock alerts for this branch.
                  </div>
                </div>
              </div>
              <button
                className="flex items-center gap-2 text-xs px-4 py-2.5 rounded-xl flex-shrink-0 transition-all duration-150"
                style={{
                  border: `1.5px solid ${t.brownBorder}`,
                  color: t.brown,
                  backgroundColor: t.paper,
                  fontWeight: 600,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = t.brownPale;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = t.paper;
                }}
              >
                <Warehouse size={14} />
                Open Branch Inventory
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Staff Roster Tab ── */}
        {tab === 1 && (
          <motion.div
            key="staff"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="p-7"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="text-sm" style={{ color: t.textPrimary, fontWeight: 700 }}>
                  Staff Roster
                </h2>
                <p className="text-xs mt-0.5" style={{ color: t.textSecondary }}>
                  Read-only employee records assigned to this branch.
                </p>
              </div>

              {/* Active / inactive summary */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs" style={{ color: t.textSecondary }}>
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: t.success }}
                  />
                  <span style={{ fontWeight: 600 }}>{activeStaff}</span> active
                </div>
                <div className="flex items-center gap-1.5 text-xs" style={{ color: t.textSecondary }}>
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: t.textMuted }}
                  />
                  <span style={{ fontWeight: 600 }}>{MOCK_EMPLOYEES.length - activeStaff}</span> inactive
                </div>
              </div>
            </div>

            <DataTable
              columns={staffColumns}
              data={MOCK_EMPLOYEES}
              keyExtractor={(row) => row.id}
              defaultPageSize={5}
              pageSizes={[5, 10, 25]}
              emptyMessage="No employees assigned to this branch yet."
            />
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}