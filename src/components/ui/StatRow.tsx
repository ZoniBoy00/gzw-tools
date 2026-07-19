interface Props {
  label: string;
  value: string;
  highlight?: boolean;
  mono?: boolean;
  icon?: string;
}

export default function StatRow({ label, value, highlight, mono, icon }: Props) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-text-muted">
        {icon && <i className={`${icon} text-accent/60 mr-1.5`} />}
        {label}
      </span>
      <span className={`font-medium ${mono ? 'font-mono' : ''} ${highlight ? 'text-accent' : 'text-text'}`}>
        {value}
      </span>
    </div>
  );
}
