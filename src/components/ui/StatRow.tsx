interface Props {
  label: string;
  value: string;
  highlight?: boolean;
  mono?: boolean;
}

export default function StatRow({ label, value, highlight, mono }: Props) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-slate/50">{label}</span>
      <span className={`font-medium ${mono ? 'font-mono' : ''} ${highlight ? 'text-amber' : 'text-white'}`}>
        {value}
      </span>
    </div>
  );
}
