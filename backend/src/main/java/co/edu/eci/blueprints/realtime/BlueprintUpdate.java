package co.edu.eci.blueprints.realtime;

import co.edu.eci.blueprints.model.Point;

import java.util.List;

/**
 * Mensaje que se difunde a /topic/blueprints.{author}.{name}.
 * Mismo contrato que el backend Socket.IO: {@code points} trae solo el/los puntos nuevos.
 */
public record BlueprintUpdate(String author, String name, List<Point> points, String clientId) {}
