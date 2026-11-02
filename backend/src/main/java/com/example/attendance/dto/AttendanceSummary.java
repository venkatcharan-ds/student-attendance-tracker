package com.example.attendance.dto;

import com.example.attendance.entity.Attendance;
import com.example.attendance.entity.AttendanceStatus;

import java.time.LocalDate;
import java.util.List;

/**
 * Saved attendance for one date plus the present / absent totals.
 */
public record AttendanceSummary(
        LocalDate date,
        List<Record> records,
        long presentCount,
        long absentCount,
        long totalStudents) {

    public record Record(Long id, Long studentId, String name, String rollNumber, AttendanceStatus status) {

        public static Record from(Attendance attendance) {
            return new Record(
                    attendance.getId(),
                    attendance.getStudent().getId(),
                    attendance.getStudent().getName(),
                    attendance.getStudent().getRollNumber(),
                    attendance.getStatus());
        }
    }
}
