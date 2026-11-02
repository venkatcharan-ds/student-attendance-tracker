package com.example.attendance.service;

import com.example.attendance.dto.AttendanceRequest;
import com.example.attendance.dto.AttendanceSummary;
import com.example.attendance.dto.DaySummary;
import com.example.attendance.entity.Attendance;
import com.example.attendance.entity.AttendanceStatus;
import com.example.attendance.entity.Student;
import com.example.attendance.exception.ResourceNotFoundException;
import com.example.attendance.repository.AttendanceRepository;
import com.example.attendance.repository.StudentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final StudentRepository studentRepository;

    public AttendanceService(AttendanceRepository attendanceRepository, StudentRepository studentRepository) {
        this.attendanceRepository = attendanceRepository;
        this.studentRepository = studentRepository;
    }

    @Transactional(readOnly = true)
    public AttendanceSummary findByDate(LocalDate date) {
        List<AttendanceSummary.Record> records = attendanceRepository.findByDateWithStudent(date).stream()
                .map(AttendanceSummary.Record::from)
                .toList();
        long present = records.stream().filter(r -> r.status() == AttendanceStatus.PRESENT).count();
        long absent = records.size() - present;
        return new AttendanceSummary(date, records, present, absent, studentRepository.count());
    }

    @Transactional(readOnly = true)
    public List<DaySummary> summarizeDays(LocalDate from, LocalDate to) {
        if (from.isAfter(to)) {
            throw new IllegalArgumentException("'from' must not be after 'to'");
        }
        if (from.plusDays(366).isBefore(to)) {
            throw new IllegalArgumentException("Date range must be at most one year");
        }
        return attendanceRepository.summarizeDays(from, to);
    }

    /**
     * Saves marks for a date. If a student already has a record for that date it is updated,
     * otherwise a new one is created - so a student never gets two records for the same date.
     */
    @Transactional
    public AttendanceSummary save(AttendanceRequest request) {
        LocalDate date = request.date();
        if (date.isAfter(LocalDate.now())) {
            throw new IllegalArgumentException("Attendance cannot be marked for a future date");
        }

        Set<Long> seen = new HashSet<>();
        for (AttendanceRequest.Mark mark : request.records()) {
            if (!seen.add(mark.studentId())) {
                throw new IllegalArgumentException("Student id " + mark.studentId() + " is listed more than once");
            }
            Student student = studentRepository.findById(mark.studentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Student with id " + mark.studentId() + " not found"));

            attendanceRepository.findByStudentIdAndDate(student.getId(), date)
                    .ifPresentOrElse(
                            existing -> existing.setStatus(mark.status()),
                            () -> attendanceRepository.save(new Attendance(student, date, mark.status())));
        }
        attendanceRepository.flush();
        return findByDate(date);
    }
}
