interface ParentDirectoryButtonProps {
  dir: Dir | undefined;
  isLoading: boolean;
  onNavigate: (parentId: ID) => void;
}

export const ParentDirectoryButton = ({ dir, isLoading, onNavigate }: ParentDirectoryButtonProps) => {
  const handleClick = () => {
    if (dir?.parent) {
      onNavigate(dir.parent);
    }
  };

  return (
    <div className="p-2">
      <button
        className="btn text-left justify-start btn-primary btn-soft w-full shrink"
        onClick={handleClick}
        disabled={dir?.parent === null || isLoading}
      >
        상위 폴더로 가기
      </button>
    </div>
  );
};
