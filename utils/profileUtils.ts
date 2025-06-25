// เอาไว้เช็คว่า กรอกข้อมูลกรอกยัง
import { UserData } from "@/utils/getcurrentuser";

export function isProfileComplete(userData: UserData | null): boolean {
  if (!userData) return false;
  if (!userData.name || !userData.role || !userData.institution) return false;

  if (userData.role === "student" && !userData.studentId) return false;

  return true;
}
