package co.edu.eci.blueprints.realtime;

import co.edu.eci.blueprints.model.Point;

/**
 * Mensaje que envía el cliente a /app/draw cuando dibuja un punto.
 * {@code clientId} es opcional: el front lo usa para ignorar su propio eco.
 */
public record DrawEvent(String author, String name, Point point, String clientId) {}
