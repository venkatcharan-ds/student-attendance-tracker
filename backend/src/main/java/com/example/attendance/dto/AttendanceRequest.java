package com.example.attendance.dto;

import com.example.attendance.entity.AttendanceStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.List;

/**
 * Saves the attendance of one or more students for a single date, e.g.
 * { "date": "2026-11-02", "records": [ { "studentId": 1, "status": "PRESENT" } ] }
 */
public record AttendanceRequest(
        @NotNull(message = "Date is required")
        LocalDate date,

        @NotEmpty(message = "Mark at least one student")
        List<@Valid Mark> records) {

    public record Mark(
            @NotNull(message = "Student id is required")
            Long studentId,

            @NotNull(message = "Status must be PRESENT or ABSENT")
            AttendanceStatus status) {
    }
}
