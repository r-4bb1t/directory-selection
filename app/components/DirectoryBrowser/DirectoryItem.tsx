interface DirectoryItemProps {
  child: { id: ID; name: string };
  checkboxState: { checked: boolean; indeterminate: boolean };
  onCheckboxChange: (child: { id: ID; name: string }, checked: boolean) => void;
  onNavigate: (childId: ID) => void;
}

export const DirectoryItem = ({ child, checkboxState, onCheckboxChange, onNavigate }: DirectoryItemProps) => {
  return (
    <div className="flex items-center gap-2">
      <input
        type="checkbox"
        className="checkbox checkbox-primary"
        checked={checkboxState.checked}
        ref={(el) => {
          if (el) {
            el.indeterminate = checkboxState.indeterminate;
          }
        }}
        onChange={(e) => onCheckboxChange(child, e.target.checked)}
      />
      <button
        className="btn text-left justify-start btn-primary btn-soft w-full shrink"
        onClick={() => onNavigate(child.id)}
      >
        {child.name}
      </button>
    </div>
  );
};
