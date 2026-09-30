package co.edu.eci.blueprints.controllers;

public record RestResponse<T>(int code, String message, T data) {
}
