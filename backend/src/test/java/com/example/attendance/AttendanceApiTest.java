package com.example.attendance;

import com.example.attendance.repository.AttendanceRepository;
import com.example.attendance.repository.StudentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = "spring.datasource.url=jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1")
@AutoConfigureMockMvc
class AttendanceApiTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private AttendanceRepository attendanceRepository;

    @BeforeEach
    void clean() {
        attendanceRepository.deleteAll();
        studentRepository.deleteAll();
    }

    private long addStudent(String name, String roll) throws Exception {
        String body = mvc.perform(post("/api/students").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"" + name + "\",\"rollNumber\":\"" + roll + "\"}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return Long.parseLong(body.replaceAll(".*\"id\":(\\d+).*", "$1"));
    }

    private void mark(String date, long studentId, String status) throws Exception {
        mvc.perform(post("/api/attendance").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"date\":\"" + date + "\",\"records\":[{\"studentId\":" + studentId
                                + ",\"status\":\"" + status + "\"}]}"))
                .andExpect(status().isOk());
    }

    @Test
    void savingTwiceForSameDateUpdatesInsteadOfDuplicating() throws Exception {
        long anu = addStudent("Anu", "R01");
        long ravi = addStudent("Ravi", "R02");

        mark("2026-01-10", anu, "PRESENT");
        mark("2026-01-10", ravi, "PRESENT");
        mark("2026-01-10", anu, "ABSENT");

        mvc.perform(get("/api/attendance").param("date", "2026-01-10"))
                .andExpect(jsonPath("$.records.length()").value(2))
                .andExpect(jsonPath("$.presentCount").value(1))
                .andExpect(jsonPath("$.absentCount").value(1))
                .andExpect(jsonPath("$.records[0].status").value("ABSENT"));
    }

    @Test
    void recordsAreSeparatedByDate() throws Exception {
        long anu = addStudent("Anu", "R01");
        mark("2026-01-10", anu, "PRESENT");

        mvc.perform(get("/api/attendance").param("date", "2026-01-11"))
                .andExpect(jsonPath("$.records.length()").value(0))
                .andExpect(jsonPath("$.totalStudents").value(1));
    }

    @Test
    void daysEndpointSummarizesEachDate() throws Exception {
        long anu = addStudent("Anu", "R01");
        long ravi = addStudent("Ravi", "R02");
        mark("2026-01-10", anu, "PRESENT");
        mark("2026-01-10", ravi, "ABSENT");
        mark("2026-01-12", anu, "PRESENT");

        mvc.perform(get("/api/attendance/days").param("from", "2026-01-01").param("to", "2026-01-31"))
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].date").value("2026-01-10"))
                .andExpect(jsonPath("$[0].presentCount").value(1))
                .andExpect(jsonPath("$[0].absentCount").value(1))
                .andExpect(jsonPath("$[1].date").value("2026-01-12"));
    }

    @Test
    void duplicateRollNumberIsRejected() throws Exception {
        addStudent("Anu", "R01");
        mvc.perform(post("/api/students").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Other\",\"rollNumber\":\"r01\"}"))
                .andExpect(status().isConflict());
    }

    @Test
    void invalidInputIsRejected() throws Exception {
        mvc.perform(post("/api/students").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"\",\"rollNumber\":\"R9\"}"))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/attendance").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"date\":\"2026-01-10\",\"records\":[{\"studentId\":999,\"status\":\"PRESENT\"}]}"))
                .andExpect(status().isNotFound());
        mvc.perform(post("/api/attendance").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"date\":\"2026-01-10\",\"records\":[{\"studentId\":1,\"status\":\"LATE\"}]}"))
                .andExpect(status().isBadRequest());
    }
}
