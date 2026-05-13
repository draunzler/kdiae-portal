import { Input } from "@/components/ui/input";

export function Field({
  label, value, onChange, placeholder = "", type = "text",
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="text-[11px] font-semibold text-slate-400 uppercase block mb-1">{label}</label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-8 text-[13px] bg-white border-slate-200"
      />
    </div>
  );
}

export function SelectField({
  label, value, options, onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-[11px] font-semibold text-slate-400 uppercase block mb-1">{label}</label>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button
            key={o}
            onClick={() => onChange(o)}
            className={`px-3 py-1 rounded text-[12px] font-medium border-2 transition-all
              ${value === o
                ? "border-[#007BFF] bg-[#007BFF]/10 text-[#007BFF]"
                : "border-slate-200 text-slate-500 hover:border-slate-300"}`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}
