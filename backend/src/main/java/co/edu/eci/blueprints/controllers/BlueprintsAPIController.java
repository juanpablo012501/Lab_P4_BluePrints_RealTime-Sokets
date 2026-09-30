package co.edu.eci.blueprints.controllers;


import co.edu.eci.blueprints.model.Blueprint;
import co.edu.eci.blueprints.model.Point;
import co.edu.eci.blueprints.persistence.expt.BlueprintNotFoundException;
import co.edu.eci.blueprints.persistence.expt.BlueprintPersistenceException;
import co.edu.eci.blueprints.services.BlueprintsServices;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;

import org.springframework.security.access.prepost.PreAuthorize;

import java.util.Set;

@RestController
@RequestMapping("/api/v1/blueprints")
public class BlueprintsAPIController {

    private final BlueprintsServices services;

    public BlueprintsAPIController(BlueprintsServices services) { this.services = services; }

    // GET /api/v1/blueprints -> 200
    @Operation(summary = "Obtener todos los blueprints")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Lista de blueprints")
    })
    @GetMapping
    @PreAuthorize("hasAuthority('SCOPE_blueprints.read')")
    public ResponseEntity<RestResponse<Set<Blueprint>>> getAll() {
        return ResponseEntity.status(HttpStatus.OK)
                .body(new RestResponse<>(200, "execute ok", services.getAllBlueprints()));
    }

    // GET /api/v1/blueprints/{author} -> 200/404
    @Operation(summary = "Obtener los blueprints de un autor")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Blueprints del autor"),
            @ApiResponse(responseCode =  "404", description = "Autor no encontrado")
    })
    @GetMapping("/{author}")
    @PreAuthorize("hasAuthority('SCOPE_blueprints.read')")
    public ResponseEntity<?> byAuthor(@PathVariable String author) {
        try {
            return ResponseEntity.status(HttpStatus.OK)
                    .body(new RestResponse<>(200, "execute ok", services.getBlueprintsByAuthor(author)));
        } catch (BlueprintNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new RestResponse<>(404, e.getMessage(), null));
        }
    }

    // GET /api/v1/blueprints/{author}/{bpname} -> 200/404
    @Operation(summary = "Obtener blueprint con nombre y autor")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "blueprint encontrado"),
            @ApiResponse(responseCode = "404", description = "blueprint no encontrado")
    })
    @GetMapping("/{author}/{bpname}")
    @PreAuthorize("hasAuthority('SCOPE_blueprints.read')")
    public ResponseEntity<?> byAuthorAndName(@PathVariable String author, @PathVariable String bpname) {
        try {
            return ResponseEntity.status(HttpStatus.OK)
                    .body(new RestResponse<>(200, "execute ok", services.getBlueprint(author, bpname)));
        } catch (BlueprintNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new RestResponse<>(404, e.getMessage(), null));
        }
    }

    // POST /api/v1/blueprints -> 201/400
    @Operation(summary = "Crear un nuevo blueprint")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "blueprint creado"),
            @ApiResponse(responseCode = "400", description = "datos inválidos")
    })
    @PostMapping
    @PreAuthorize("hasAuthority('SCOPE_blueprints.write')")
    public ResponseEntity<?> add(@Valid @RequestBody NewBlueprintRequest req) {
        try {
            Blueprint bp = new Blueprint(req.author(), req.name(), req.points());
            services.addNewBlueprint(bp);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(new RestResponse<>(201, "created", bp));
        } catch (BlueprintPersistenceException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new RestResponse<>(400, e.getMessage(), null));
        }
    }

    // PUT /api/v1/blueprints/{author}/{bpname}/points -> 202/404
    @Operation(summary = "agregar un nuevo punto en un blueprint")
    @ApiResponses({
            @ApiResponse(responseCode = "202", description = "punto agregado"),
            @ApiResponse(responseCode = "404", description = "blueprint no encontrado")
    })
    @PutMapping("/{author}/{bpname}/points")
    @PreAuthorize("hasAuthority('SCOPE_blueprints.write')")
    public ResponseEntity<?> addPoint(@PathVariable String author, @PathVariable String bpname,
                                      @RequestBody Point p) {
        try {
            services.addPoint(author, bpname, p.getX(), p.getY());
            return ResponseEntity.status(HttpStatus.ACCEPTED)
                    .body(new RestResponse<>(202, "accepted", null));
        } catch (BlueprintNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new RestResponse<>(404, e.getMessage(), null));
        }
    }

    @PutMapping("/{author}/{bpname}")
    @PreAuthorize("hasAuthority('SCOPE_blueprints.write')")
    public ResponseEntity<?> update(@PathVariable String author, @PathVariable String bpname,
                                    @Valid @RequestBody UpdateBlueprintRequest req) {
        try {
            Blueprint updated = services.updateBlueprint(author, bpname,
                    new Blueprint(author, bpname, req.points()));
            return ResponseEntity.ok(new RestResponse<>(200, "updated", updated));
        } catch (BlueprintNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new RestResponse<>(404, e.getMessage(), null));
        }
    }

    @DeleteMapping("/{author}/{bpname}")
    @PreAuthorize("hasAuthority('SCOPE_blueprints.write')")
    public ResponseEntity<?> delete(@PathVariable String author, @PathVariable String bpname) {
        try {
            services.deleteBlueprint(author, bpname);
            return ResponseEntity.ok(new RestResponse<>(200, "deleted", null));
        } catch (BlueprintNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new RestResponse<>(404, e.getMessage(), null));
        }
    }

    public record NewBlueprintRequest(
            @NotBlank String author,
            @NotBlank String name,
            @Valid java.util.List<Point> points
    ) { }

    public record UpdateBlueprintRequest(@Valid java.util.List<Point> points) { }
}
