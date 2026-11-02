# ---- Build stage: compile the Spring Boot jar with the Maven wrapper ----
FROM eclipse-temurin:21-jdk AS build
WORKDIR /app

# Download dependencies first so they are cached between builds
COPY .mvn .mvn
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw -q -B dependency:go-offline

COPY src src
RUN ./mvnw -q -B package -DskipTests

# ---- Run stage: small JRE image with just the jar ----
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/student-attendance-1.0.0.jar app.jar

# Render (and most hosts) pass the port in $PORT; application.properties reads it
ENV PORT=8080
EXPOSE 8080

# Keep memory within small free-tier instances (512 MB)
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75 -XX:+UseSerialGC -Xss512k"

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
