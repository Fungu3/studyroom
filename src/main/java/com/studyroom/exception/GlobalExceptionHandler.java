package com.studyroom.exception;

import com.studyroom.common.Result;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(RoomNotFoundException.class)
    public Result<Void> handleRoomNotFound(RoomNotFoundException ex) {
        return Result.error(404, ex.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public Result<Void> handleValidation(MethodArgumentNotValidException ex) {
        String message = "invalid payload";
        FieldError first = ex.getBindingResult().getFieldErrors().stream().findFirst().orElse(null);
        if (first != null) {
            message = first.getField() + ": " + first.getDefaultMessage();
        }
        return Result.error(400, message);
    }

    @ExceptionHandler(Exception.class)
    public Result<Void> handleGeneric(Exception ex) {
        return Result.error(500, ex.getMessage() == null ? "internal error" : ex.getMessage());
    }
}

