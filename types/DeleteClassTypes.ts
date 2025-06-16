import { User } from "firebase/auth";

export interface ClassData {
  id: string;
  name: string;
  memberCount?: number;
}

export interface DeleteClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  classData: ClassData;
  user: User | null;
  onDeleteSuccess?: () => void;
}
