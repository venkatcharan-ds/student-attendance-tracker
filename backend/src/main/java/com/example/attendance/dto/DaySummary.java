package com.example.attendance.dto;

import java.time.LocalDate;

/**
 * Present / absent totals for one date that has saved attendance.
 */
public record DaySummary(LocalDate date, long presentCount, long absentCount) {
}
