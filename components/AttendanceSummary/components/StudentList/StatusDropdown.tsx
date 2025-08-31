// components/AttendanceSummary/components/StudentList/StatusDropdown.tsx
import * as React from "react";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import type { DailyCheckedInUser } from "../../types";

type Status = "present" | "late";

type Props = {
  classId: string;
  uid?: string;
  studentId: string;      // ใช้ resolve uid ที่ถูกต้องจาก dailyCheckedInRecord[dateKey]
  dateKey: string;        // YYYY-MM-DD
  initialStatus?: Status; // optional
  onUpdated?: (newStatus: Status) => void;
  isOwner?: boolean;
};

const norm = (v: unknown): string =>
  String(v ?? "").trim().replace(/\s+/g, "");

export default function StatusDropdown({
  classId,
  uid,
  studentId,
  dateKey,
  initialStatus,
  onUpdated,
  isOwner = false,
}: Props) {
  const [value, setValue] = React.useState<Status>(initialStatus ?? "present");
  const [loading, setLoading] = React.useState(false);
  const [targetUid, setTargetUid] = React.useState<string | null>(uid ?? null);

  // 🔁 ฟัง realtime แล้ว resolve uid + sync status โดยไม่ใช้ any
  React.useEffect(() => {
    const ref = doc(db, "classes", classId);
    const unsub = onSnapshot(ref, (snap) => {
      const day =
        (snap.get(
          `dailyCheckedInRecord.${dateKey}`
        ) as Record<string, DailyCheckedInUser> | undefined) ?? {};

      if (!targetUid) {
        // หา uid ของนักเรียนคนนี้จาก studentId
        for (const [k, rec] of Object.entries(day)) {
          if (norm(rec?.studentId) === norm(studentId)) {
            setTargetUid(k);
            if (rec?.status && rec.status !== value) {
              const st = rec.status === "late" ? "late" : "present";
              setValue(st);
            }
            break;
          }
        }
      } else {
        // รู้ uid แล้ว -> sync status ต่อเนื่อง
        const rec = day[targetUid];
        const dbStatus =
          rec?.status === "late" ? "late" : rec?.status === "present" ? "present" : undefined;
        if (dbStatus && dbStatus !== value) setValue(dbStatus);
      }
    });

    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId, dateKey, studentId, targetUid]);

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!isOwner) {
      toast.error("เฉพาะเจ้าของคลาสเท่านั้นที่แก้ไขสถานะได้");
      return;
    }
    const newStatus = e.target.value as Status;
    if (newStatus === value || !targetUid) return;

    const ref = doc(db, "classes", classId);
    const prev = value;
    setValue(newStatus);
    setLoading(true);
    try {
      await updateDoc(ref, {
        [`dailyCheckedInRecord.${dateKey}.${targetUid}.status`]: newStatus,
        [`dailyCheckedInRecord.${dateKey}.${targetUid}.isLate`]:
          newStatus === "late",
        [`checkedInRecord.${targetUid}.status`]: newStatus,
        [`checkedInRecord.${targetUid}.isLate`]: newStatus === "late",
      });
      toast.success(
        `อัปเดตสถานะเป็น ${newStatus === "late" ? "late (สาย)" : "present (ตรงเวลา)"}`
      );
      onUpdated?.(newStatus);
    } catch (err: unknown) {
      setValue(prev); // rollback
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`อัปเดตไม่สำเร็จ: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="inline-flex items-center gap-2">
      {isOwner && (
        <select
          className="rounded-md border px-2 py-1 text-sm disabled:opacity-60"
          value={value}
          onChange={handleChange}
          disabled={loading || !targetUid || !isOwner}
        >
          <option value="present">present (ตรงเวลา)</option>
          <option value="late">late (สาย)</option>
        </select>
      )}
    </div>
  );
}
