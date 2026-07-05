type InputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
};

export default function Input({
  value,
  onChange,
  placeholder,
  type = "text",
}: InputProps) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-2xl border border-[#eadfce] bg-white px-5 py-4 text-lg outline-none focus:border-[#064b42]"
    />
  );
}