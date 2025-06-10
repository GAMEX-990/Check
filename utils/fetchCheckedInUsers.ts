// fetchCheckedInUsers.ts
export const fetchCheckedInUsers = async (classData: any, currentUid: string | undefined) => {
    try {
      if (!classData.checkedInRecord || !currentUid) return [];
  
      const isOwner = classData.created_by === currentUid;
  
      let usersList;
  
      if (isOwner) {
        // ✅ แสดงทุกคน
        usersList = Object.values(classData.checkedInRecord).map((user: any) => ({
          ...user,
          timestamp: user.timestamp.toDate(),
        }));
      } else {
        // ✅ แสดงเฉพาะคนเดียว
        const user = classData.checkedInRecord[currentUid];
        if (!user) return [];
  
        usersList = [{
          ...user,
          timestamp: user.timestamp.toDate(),
        }];
      }
  
      // ✅ เรียงตามเวลา
      usersList.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  
      return usersList;
    } catch (error) {
      console.error("Error fetching check-in users:", error);
      return [];
    }
  };