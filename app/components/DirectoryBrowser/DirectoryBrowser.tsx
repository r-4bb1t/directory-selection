"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { DirectoryList } from "./DirectoryList";
import { Skeleton } from "./Skeleton";
import { useDirectorySelection } from "./useDirectorySelection";
import React from "react";

interface DirectoryBrowserProps {
  onSelectionChange?: (included: SelectedDir[], excluded: SelectedDir[]) => void;
}

export const DirectoryBrowser = ({ onSelectionChange }: DirectoryBrowserProps) => {
  const [selected, setSelected] = useState<ID>(1);

  const { data: dir, isLoading } = useSWR<Dir>([`/api/dir`, selected], ([url, selected]) =>
    fetch(`${url}/${selected}`).then((res) => res.json())
  );

  const {
    included,
    excluded,
    getCheckboxState,
    getParentIndeterminateState,
    handleChildCheckboxChange,
    handleParentCheckboxChange,
  } = useDirectorySelection(dir);

  useEffect(() => {
    onSelectionChange?.(included, excluded);
  }, [included, excluded, onSelectionChange]);

  const handleNavigate = (id: ID) => {
    setSelected(id);
  };

  return (
    <div className="flex flex-col gap-2 w-full max-w-xl p-4 rounded">
      {isLoading ? (
        <Skeleton num={10} />
      ) : (
        dir && (
          <DirectoryList
            dir={dir}
            getCheckboxState={getCheckboxState}
            parentCheckboxState={getParentIndeterminateState}
            onChildCheckboxChange={handleChildCheckboxChange}
            onParentCheckboxChange={handleParentCheckboxChange}
            onNavigate={handleNavigate}
          />
        )
      )}
    </div>
  );
};
