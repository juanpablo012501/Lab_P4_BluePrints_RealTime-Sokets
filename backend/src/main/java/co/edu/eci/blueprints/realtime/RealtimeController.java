package co.edu.eci.blueprints.realtime;

import co.edu.eci.blueprints.model.Point;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.List;

/**
 * Colaboración en tiempo real vía STOMP.
 * Cliente -> /app/draw  ==>  broadcast a /topic/blueprints.{author}.{name}
 *
 * El tiempo real es efímero: solo retransmite. La persistencia sigue siendo el CRUD REST
 * (botón Save del front -> PUT /api/v1/blueprints/{author}/{name}).
 */
@Controller
public class RealtimeController {

    private static final Logger log = LoggerFactory.getLogger(RealtimeController.class);
    private static final int MAX_FIELD_LENGTH = 100;

    private final SimpMessagingTemplate template;

    public RealtimeController(SimpMessagingTemplate template) {
        this.template = template;
    }

    @MessageMapping("/draw")
    public void onDraw(DrawEvent evt) {
        if (!isValid(evt)) {
            log.warn("[rt] draw descartado por payload inválido: {}", evt);
            return;
        }
        String destination = "/topic/blueprints." + evt.author() + "." + evt.name();
        var update = new BlueprintUpdate(evt.author(), evt.name(), List.of(evt.point()), evt.clientId());
        template.convertAndSend(destination, update);
        log.debug("[rt] {} <- ({}, {})", destination, evt.point().getX(), evt.point().getY());
    }

    private static boolean isValid(DrawEvent evt) {
        if (evt == null || evt.point() == null) return false;
        return validField(evt.author()) && validField(evt.name()) && validPoint(evt.point());
    }

    private static boolean validField(String value) {
        return value != null && !value.isBlank() && value.length() <= MAX_FIELD_LENGTH;
    }

    private static boolean validPoint(Point p) {
        return Math.abs(p.getX()) <= 100_000 && Math.abs(p.getY()) <= 100_000;
    }
}
