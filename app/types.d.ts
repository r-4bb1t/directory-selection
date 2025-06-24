type ID = number | bigint;

interface DirModel {
  id: ID;
  name: string;
  parent: ID | null;
  ancestors: string;
}

interface Dir {
  id: ID;
  name: string;
  parent: ID | null;
  ancestors: {
    id: ID;
    name: string;
  }[];
  children: {
    id: ID;
    name: string;
  }[];
}

interface SelectedDir {
  id: ID;
  name: string;
  ancestors: {
    id: ID;
    name: string;
  }[];
}
