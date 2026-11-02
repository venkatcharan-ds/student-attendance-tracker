package com.example.attendance.controller;

import com.example.attendance.dto.AttendanceRequest;
import com.example.attendance.dto.AttendanceSummary;
import com.example.attendance.dto.DaySummary;
import com.example.attendance.service.AttendanceService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {

    private final AttendanceService attendanceService;

    public AttendanceController(AttendanceService attendanceService) {
        this.attendanceService = attendanceService;
    }

    // GET /api/attendance?date=2026-11-02 - saved records and totals for that date
    @GetMapping
    public AttendanceSummary getByDate(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return attendanceService.findByDate(date);
    }

    // GET /api/attendance/days?from=2026-11-01&to=2026-11-30 - dates that have saved attendance, with totals
    @GetMapping("/days")
    public List<DaySummary> getDays(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                                    @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return attendanceService.summarizeDays(from, to);
    }

    // POST /api/attendance - create or update marks for a date
    @PostMapping
    public AttendanceSummary save(@Valid @RequestBody AttendanceRequest request) {
        return attendanceService.save(request);
    }
}
