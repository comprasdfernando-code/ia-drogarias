interface Props {
  title: string;
  value: string;
  color: string;
}

export default function DashboardCard({
  title,
  value,
  color,
}: Props) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">

      <div
        className={`mb-4 h-2 w-20 rounded-full ${color}`}
      />

      <p className="text-slate-500">
        {title}
      </p>

      <h2 className="mt-3 text-4xl font-bold">
        {value}
      </h2>

    </div>
  );
}