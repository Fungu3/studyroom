package com.studyroom;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig {

  @Bean
  public WebMvcConfigurer corsConfigurer() {
    return new WebMvcConfigurer() {
      @Override
      public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
          .allowedOriginPatterns(
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://192.168.*.*:5173",
            "http://10.*.*.*:5173",
            "http://172.*.*.*:5173",
            "https://studyroom-kappa.vercel.app"
          )
            .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
            .allowedHeaders("*")
            .allowCredentials(false);
      }
    };
  }
}
