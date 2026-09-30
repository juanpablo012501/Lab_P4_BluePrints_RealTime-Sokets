package co.edu.eci.blueprints.realtime;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessageDeliveryException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

/**
 * Valida el JWT en el frame STOMP CONNECT (header nativo "Authorization: Bearer ...").
 * El handshake HTTP del WebSocket no puede llevar headers desde el navegador, por eso
 * la autenticación se hace a nivel de STOMP y no en el filtro HTTP.
 */
public class StompAuthInterceptor implements ChannelInterceptor {

    private static final Logger log = LoggerFactory.getLogger(StompAuthInterceptor.class);

    private final JwtDecoder jwtDecoder;

    public StompAuthInterceptor(JwtDecoder jwtDecoder) {
        this.jwtDecoder = jwtDecoder;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            String header = accessor.getFirstNativeHeader("Authorization");
            if (header == null || !header.startsWith("Bearer ")) {
                log.warn("[rt] STOMP CONNECT rechazado: falta token");
                throw new MessageDeliveryException("Missing bearer token");
            }
            try {
                Jwt jwt = jwtDecoder.decode(header.substring(7));
                accessor.setUser(new JwtAuthenticationToken(jwt));
                log.info("[rt] STOMP CONNECT ok: {}", jwt.getSubject());
            } catch (JwtException e) {
                log.warn("[rt] STOMP CONNECT rechazado: token inválido ({})", e.getMessage());
                throw new MessageDeliveryException("Invalid bearer token");
            }
        }
        return message;
    }
}
