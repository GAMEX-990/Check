import type { UserAttendance, UserData } from "types/SummaryTypes";

export const createAttendanceSummary = (users: UserData[]): UserAttendance[] => {
  const userAttendance: Record<string, UserAttendance> = {};

  users.forEach(user => {
    if (userAttendance[user.uid]) {
      userAttendance[user.uid].count += 1;
    } else {
      userAttendance[user.uid] = {
        uid: user.uid,
        name: user.name,
        studentId: user.studentId,
        count: 1,
      };
    }
  });

  return Object.values(userAttendance).sort((a, b) => b.count - a.count);
};
