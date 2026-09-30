package co.edu.eci.blueprints.persistence;



import co.edu.eci.blueprints.model.Blueprint;
import co.edu.eci.blueprints.persistence.expt.BlueprintNotFoundException;
import co.edu.eci.blueprints.persistence.expt.BlueprintPersistenceException;

import java.util.Set;

public interface BlueprintPersistence {

    void saveBlueprint(Blueprint bp) throws BlueprintPersistenceException;

    Blueprint getBlueprint(String author, String name) throws BlueprintNotFoundException;

    Set<Blueprint> getBlueprintsByAuthor(String author) throws BlueprintNotFoundException;

    Set<Blueprint> getAllBlueprints();

    void addPoint(String author, String name, int x, int y) throws BlueprintNotFoundException;

    Blueprint updateBlueprint(String author, String name, Blueprint blueprint)
            throws BlueprintNotFoundException;

    void deleteBlueprint(String author, String name) throws BlueprintNotFoundException;
}
