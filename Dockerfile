# ===== build stage =====
FROM maven:3.9.9-eclipse-temurin-17 AS build
WORKDIR /app

# 先拷贝依赖文件，加速缓存
COPY pom.xml ./
COPY .mvn .mvn
COPY mvnw mvnw
COPY mvnw.cmd mvnw.cmd

RUN chmod +x mvnw || true
RUN ./mvnw -q -DskipTests dependency:go-offline

# 再拷贝源码并打包
COPY src src
COPY HELP.md HELP.md
COPY README.md README.md

RUN ./mvnw -DskipTests package

# ===== run stage =====
FROM eclipse-temurin:17-jre
WORKDIR /app

# 拷贝 jar（注意：如果你生成的 jar 名不一样，保留通配符最省事）
COPY --from=build /app/target/*.jar app.jar

# Render 会注入 PORT 环境变量
EXPOSE 8080

# 用 sh -c 才能展开 ${PORT}
CMD ["sh", "-c", "java -Dserver.port=${PORT:-8080} -jar app.jar"]
