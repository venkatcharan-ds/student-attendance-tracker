package com.example.attendance.repository;

import com.example.attendance.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StudentRepository extends JpaRepository<Student, Long> {

    boolean existsByRollNumberIgnoreCase(String rollNumber);

    List<Student> findAllByOrderByRollNumberAsc();
}
