"use client";

import Image from "next/image";
import { getDir } from "./lib/getDir";
import { useState, useMemo, useEffect, useCallback } from "react";
import useSWR from "swr";
import SelectedList from "./SelectedList";

export default function Home() {
  const [selected, setSelected] = useState<ID>(1);
  const [included, setIncluded] = useState<SelectedDir[]>([]);
  const [excluded, setExcluded] = useState<SelectedDir[]>([]);

  const { data: dir, isLoading } = useSWR<Dir>([`/api/dir`, selected], ([url, selected]) =>
    fetch(`${url}/${selected}`).then((res) => res.json())
  );

  const getCheckboxState = useMemo(() => {
    return (child: { id: ID; name: string }) => {
      const isIncluded = included.some((item) => item.id === child.id);
      const isExcluded = excluded.some((item) => item.id === child.id);

      if (isIncluded) {
        const hasExcludedChildren = excluded.some((item) =>
          item.ancestors.some((ancestor) => ancestor.id === child.id)
        );

        if (hasExcludedChildren) {
          return { checked: true, indeterminate: true };
        }
        return { checked: true, indeterminate: false };
      }

      if (isExcluded) {
        return { checked: false, indeterminate: false };
      }

      const childAncestorPath = [...(dir?.ancestors || []), { id: dir?.id, name: dir?.name || "" }];

      let effectiveState: "include" | "exclude" | "none" = "none";

      for (let i = childAncestorPath.length - 1; i >= 0; i--) {
        const ancestor = childAncestorPath[i];
        if (excluded.some((item) => item.id === ancestor.id)) {
          effectiveState = "exclude";
          break;
        }
        if (included.some((item) => item.id === ancestor.id)) {
          effectiveState = "include";
          break;
        }
      }

      if (effectiveState === "exclude") {
        return { checked: false, indeterminate: false };
      } else if (effectiveState === "include") {
        const hasExcludedChildren = excluded.some((item) =>
          item.ancestors.some((ancestor) => ancestor.id === child.id)
        );

        if (hasExcludedChildren) {
          return { checked: true, indeterminate: true };
        }
        return { checked: true, indeterminate: false };
      }

      return { checked: false, indeterminate: false };
    };
  }, [included, excluded, dir]);

  const getParentIndeterminateState = useMemo(() => {
    if (!dir) return { checked: false, indeterminate: false };

    const childStates = dir.children.map((child) => {
      const state = getCheckboxState(child);
      return { checked: state.checked, indeterminate: state.indeterminate };
    });

    const checkedCount = childStates.filter((state) => state.checked && !state.indeterminate).length;
    const indeterminateCount = childStates.filter((state) => state.indeterminate).length;
    const totalCount = childStates.length;

    if (checkedCount === 0 && indeterminateCount === 0) {
      return { checked: false, indeterminate: false };
    } else if (checkedCount === totalCount && indeterminateCount === 0) {
      return { checked: true, indeterminate: false };
    } else {
      return { checked: false, indeterminate: true };
    }
  }, [dir, getCheckboxState]);

  const handleChildCheckboxChange = (child: { id: ID; name: string }, checked: boolean) => {
    const childAncestors = dir ? [...dir.ancestors, { id: dir.id, name: dir.name }] : [];
    const childWithAncestors = { ...child, ancestors: childAncestors };

    if (checked) {
      setIncluded((prev) => {
        const alreadyIncluded = prev.some((item) => item.id === child.id);
        if (alreadyIncluded) return prev;
        return [...prev, childWithAncestors];
      });
      setExcluded((prev) => prev.filter((item) => item.id !== child.id));
    } else {
      setIncluded((prev) => prev.filter((item) => item.id !== child.id));

      const childAncestorPath = [...(dir?.ancestors || []), { id: dir?.id, name: dir?.name || "" }];
      let shouldAddToExcluded = false;

      for (let i = childAncestorPath.length - 1; i >= 0; i--) {
        const ancestor = childAncestorPath[i];
        if (excluded.some((item) => item.id === ancestor.id)) {
          break;
        }
        if (included.some((item) => item.id === ancestor.id)) {
          shouldAddToExcluded = true;
          break;
        }
      }

      if (shouldAddToExcluded) {
        setExcluded((prev) => {
          const alreadyExcluded = prev.some((item) => item.id === child.id);
          if (alreadyExcluded) return prev;
          return [...prev, childWithAncestors];
        });
      }
    }
  };

  const handleParentCheckboxChange = (checked: boolean) => {
    if (!dir) return;

    const parentState = getParentIndeterminateState;
    const isIntermediate = parentState.indeterminate;

    if (isIntermediate) {
      const removeDescendants = (id: ID) => {
        setIncluded((prev) =>
          prev.filter((item) => {
            return item.id !== id && !item.ancestors.some((ancestor) => ancestor.id === id);
          })
        );

        setExcluded((prev) =>
          prev.filter((item) => {
            return item.id !== id && !item.ancestors.some((ancestor) => ancestor.id === id);
          })
        );
      };

      removeDescendants(dir.id);
      return;
    }

    if (checked) {
      setIncluded((prev) => {
        const newIncluded = [...prev];
        dir.children.forEach((child) => {
          const alreadyIncluded = newIncluded.some((item) => item.id === child.id);
          const explicitlyExcluded = excluded.some((item) => item.id === child.id);

          if (!alreadyIncluded && !explicitlyExcluded) {
            const childAncestors = [...dir.ancestors, { id: dir.id, name: dir.name }];
            const childWithAncestors = { ...child, ancestors: childAncestors };
            newIncluded.push(childWithAncestors);
          }
        });
        return newIncluded;
      });
      setExcluded((prev) => prev.filter((item) => !dir.children.some((child) => child.id === item.id)));
    } else {
      setExcluded((prev) => {
        const newExcluded = [...prev];
        dir.children.forEach((child) => {
          const alreadyExcluded = newExcluded.some((item) => item.id === child.id);
          const explicitlyIncluded = included.some((item) => item.id === child.id);

          if (!alreadyExcluded && !explicitlyIncluded) {
            const childAncestors = [...dir.ancestors, { id: dir.id, name: dir.name }];
            const childWithAncestors = { ...child, ancestors: childAncestors };
            newExcluded.push(childWithAncestors);
          }
        });
        return newExcluded;
      });
      setIncluded((prev) => prev.filter((item) => !dir.children.some((child) => child.id === item.id)));
    }
  };

  return (
    <>
      <div className="flex flex-col gap-2 w-full max-w-xl p-4 rounded">
        <div className="p-2">
          <button
            className="btn text-left justify-start btn-primary btn-soft w-full shrink"
            onClick={() => {
              setSelected(dir?.parent ?? 1);
            }}
            disabled={dir?.parent === null || isLoading}
          >
            상위 폴더로 가기
          </button>
        </div>

        {isLoading ? (
          <Skeleton num={10} />
        ) : (
          <>
            {dir && (
              <div className="flex items-center gap-2 ">
                <input
                  type="checkbox"
                  className="checkbox checkbox-primary"
                  checked={getParentIndeterminateState.checked}
                  ref={(el) => {
                    if (el) {
                      el.indeterminate = getParentIndeterminateState.indeterminate;
                    }
                  }}
                  onChange={(e) => handleParentCheckboxChange(e.target.checked)}
                />
                <span>
                  {dir.ancestors.map((a) => a.name).join(" > ")} {">"} {dir.name}
                </span>
              </div>
            )}

            {dir?.children.map((child) => {
              const checkboxState = getCheckboxState(child);
              return (
                <div key={child.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-primary"
                    checked={checkboxState.checked}
                    ref={(el) => {
                      if (el) {
                        el.indeterminate = checkboxState.indeterminate;
                      }
                    }}
                    onChange={(e) => handleChildCheckboxChange(child, e.target.checked)}
                  />
                  <button
                    className="btn text-left justify-start btn-primary btn-soft w-full shrink"
                    onClick={() => {
                      setSelected(child.id);
                    }}
                  >
                    {child.name}
                  </button>
                </div>
              );
            })}
          </>
        )}
      </div>

      <SelectedList included={included} excluded={excluded} />
    </>
  );
}

const Skeleton = ({ num = 10 }: { num?: number }) => {
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
