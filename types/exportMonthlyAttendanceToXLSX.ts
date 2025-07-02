/* ---------- Types ---------- */
export interface AttendanceRecord {
    [studentId: string]: {
        name: string;
        attendance: {
            [date: string]: { present: boolean; late: boolean };
        };
    };
}

export interface ClassData {
    name: string;
    month: string;
}