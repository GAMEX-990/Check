import { CheckedInUser } from "@/types/classDetailTypes";

export const fetchCheckedInUsersByDate = async (
    classData: any,
    currentUid: string | undefined
  ) => {
    try {
      const isOwner = classData.created_by === currentUid;
      const dailyRecord = classData.dailyCheckedInRecord;
  
      if (!dailyRecord || !currentUid) return [];
  
      const result: { date: string; users: CheckedInUser[] }[] = [];
  
      for (const [dateKey, record] of Object.entries(dailyRecord)) {
        const usersMap = record as Record<string, any>;
  
        const userEntries = Object.entries(usersMap)
          .filter(([uid]) => isOwner || uid === currentUid) // ✅ ถ้าไม่ใช่เจ้าของ ➤ เห็นแค่ตัวเอง
          .map(([uid, data]: [string, any]) => ({
            ...data,
            uid,
            timestamp: data.timestamp.toDate(),
          }));
  
        if (userEntries.length > 0) {
          result.push({ date: dateKey, users: userEntries });
        }
      }
  
      result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      return result;
    } catch (error) {
      console.error("Error fetching daily records:", error);
      return [];
    }
  };
  