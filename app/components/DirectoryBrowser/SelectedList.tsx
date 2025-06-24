export default function SelectedList({
  included,
  excluded,
}: {
  included: { id: ID; name: string; ancestors: { id: ID; name: string }[] }[];
  excluded: { id: ID; name: string; ancestors: { id: ID; name: string }[] }[];
}) {
  return (
    <div className="flex flex-col w-full max-w-xl h-full">
      <div className="mt-4 w-full flex flex-col gap-2 h-full p-4 bg-success/5 rounded overflow-hidden">
        <h3 className="font-semibold mb-2">포함된 항목들</h3>
        <div className="flex flex-col gap-2 overflow-y-auto h-full shrink">
          {included.map((c) => (
            <div key={c.id} className="text-success">
              {c.ancestors.map((ancestor) => ancestor.name).join(" > ")} {">"} {c.name}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 w-full flex flex-col gap-2 h-full p-4 bg-error/5 rounded overflow-hidden">
        <h3 className="font-semibold mb-2">제외된 항목들</h3>
        <div className="flex flex-col gap-2 overflow-y-auto h-full shrink">
          {excluded.map((c) => (
            <div key={c.id} className="text-error">
              {c.ancestors.map((ancestor) => ancestor.name).join(" > ")} {">"} {c.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
