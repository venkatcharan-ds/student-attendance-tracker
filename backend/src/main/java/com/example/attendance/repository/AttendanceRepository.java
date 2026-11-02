package com.example.attendance.repository;

import com.example.attendance.entity.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface AttendanceRepository extends JpaRepository<Attendance, Long> {

    // Loads the student in the same query so the response can show name and roll number
    @Query("select a from Attendance a join fetch a.student s where a.date = :date order by s.rollNumber")
    List<Attendance> findByDateWithStudent(@Param("date") LocalDate date);

    Optional<Attendance> findByStudentIdAndDate(Long studentId, LocalDate date);

    // Present / absent totals per date in a range, used by the calendar
    @Query("select new com.example.attendance.dto.DaySummary(a.date, "
            + "sum(case when a.status = com.example.attendance.entity.AttendanceStatus.PRESENT then 1 else 0 end), "
            + "sum(case when a.status = com.example.attendance.entity.AttendanceStatus.ABSENT then 1 else 0 end)) "
            + "from Attendance a where a.date between :from and :to group by a.date order by a.date")
    List<com.example.attendance.dto.DaySummary> summarizeDays(@Param("from") LocalDate from, @Param("to") LocalDate to);

    void deleteByStudentId(Long studentId);
}
