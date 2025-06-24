interface DirectoryHeaderProps {
  dir: Dir;
  parentCheckboxState: { checked: boolean; indeterminate: boolean };
  onParentCheckboxChange: (checked: boolean) => void;
  onNavigate: (id: ID) => void;
}

export const DirectoryHeader = ({
  dir,
  parentCheckboxState,
  onParentCheckboxChange,
  onNavigate,
}: DirectoryHeaderProps) => {
  return (
    <div className="flex items-center gap-2">
      <input
        type="checkbox"
        className="checkbox checkbox-primary"
        checked={parentCheckboxState.checked}
        ref={(el) => {
          if (el) {
            el.indeterminate = parentCheckboxState.indeterminate;
          }
        }}
        onChange={(e) => onParentCheckboxChange(e.target.checked)}
      />
      {dir.ancestors.map((ancestor) => (
        <button key={ancestor.id} className="btn btn-primary btn-soft btn-sm" onClick={() => onNavigate(ancestor.id)}>
          {ancestor.name}
        </button>
      ))}
      <span className="btn btn-primary btn-dash btn-sm">{dir.name}</span>
    </div>
  );
};
