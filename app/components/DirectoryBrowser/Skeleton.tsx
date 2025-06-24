interface SkeletonProps {
  num?: number;
}

export const Skeleton = ({ num = 10 }: SkeletonProps) => {
  return (
    <>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 bg-base-200 rounded animate-pulse"></div>
        <div className="h-5 bg-base-200 rounded w-32 animate-pulse"></div>
      </div>
      {[...Array(num)].map((_, index) => (
        <button key={index} className="btn btn-primary btn-soft w-full shrink" disabled />
      ))}
    </>
  );
};
