// ฟังก์ชันสร้างสรุปการเข้าเรียน
export const createAttendanceSummary = (users: any[]) => {
    const userAttendance: { [key: string]: any } = {};
    
    users.forEach(user => {
      if (userAttendance[user.uid]) {
        userAttendance[user.uid].count += 1;
      } else {
        userAttendance[user.uid] = {
          uid: user.uid,
          name: user.name,
          studentId: user.studentId,
          count: 1
        };
      }
    });
  
    return Object.values(userAttendance).sort((a: any, b: any) => b.count - a.count);
  };