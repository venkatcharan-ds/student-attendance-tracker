package com.example.attendance.service;

import com.example.attendance.dto.StudentRequest;
import com.example.attendance.entity.Student;
import com.example.attendance.exception.DuplicateResourceException;
import com.example.attendance.exception.ResourceNotFoundException;
import com.example.attendance.repository.AttendanceRepository;
import com.example.attendance.repository.StudentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class StudentService {

    private final StudentRepository studentRepository;
    private final AttendanceRepository attendanceRepository;

    public StudentService(StudentRepository studentRepository, AttendanceRepository attendanceRepository) {
        this.studentRepository = studentRepository;
        this.attendanceRepository = attendanceRepository;
    }

    @Transactional(readOnly = true)
    public List<Student> findAll() {
        return studentRepository.findAllByOrderByRollNumberAsc();
    }

    @Transactional
    public Student create(StudentRequest request) {
        String name = request.name().trim();
        String rollNumber = request.rollNumber().trim();
        if (studentRepository.existsByRollNumberIgnoreCase(rollNumber)) {
            throw new DuplicateResourceException("Roll number " + rollNumber + " already exists");
        }
        return studentRepository.save(new Student(name, rollNumber));
    }

    // Removes the student and all of their attendance records
    @Transactional
    public void delete(Long id) {
        if (!studentRepository.existsById(id)) {
            throw new ResourceNotFoundException("Student with id " + id + " not found");
        }
        attendanceRepository.deleteByStudentId(id);
        studentRepository.deleteById(id);
    }
}
