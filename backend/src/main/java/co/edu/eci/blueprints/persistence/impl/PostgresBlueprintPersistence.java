package co.edu.eci.blueprints.persistence.impl;


import co.edu.eci.blueprints.model.Blueprint;
import co.edu.eci.blueprints.model.BlueprintId;
import co.edu.eci.blueprints.model.Point;
import co.edu.eci.blueprints.persistence.BlueprintPersistence;
import co.edu.eci.blueprints.persistence.expt.BlueprintNotFoundException;
import co.edu.eci.blueprints.persistence.expt.BlueprintPersistenceException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;

@Repository
@Primary
public class PostgresBlueprintPersistence implements BlueprintPersistence {

    @Autowired
    private BlueprintRepository repo;

    @Override
    public void saveBlueprint(Blueprint bp) throws BlueprintPersistenceException {
        repo.save(bp);
    }

    @Transactional
    @Override
    public Blueprint getBlueprint(String author, String name) throws BlueprintNotFoundException {
        Blueprint bp = repo.findById(new BlueprintId(author, name))
                .orElseThrow(() -> new BlueprintNotFoundException(author + ":" + name));
        bp.getPoints().size();
        return bp;
    }

    @Override
    public Set<Blueprint> getBlueprintsByAuthor(String author) throws BlueprintNotFoundException {
        Set<Blueprint> result = repo.findByAuthor(author);
        if (result.isEmpty()) throw new BlueprintNotFoundException(author);
        return result;
    }

    @Override
    public Set<Blueprint> getAllBlueprints() {
        return new HashSet<>(repo.findAll());
    }

    @Override
    public void addPoint(String author, String name, int x, int y) throws BlueprintNotFoundException {
        Blueprint bp = repo.findById(new BlueprintId(author, name))
                .orElseThrow(() -> new BlueprintNotFoundException(author + ":" + name));
        bp.addPoint(new Point(x, y));
        repo.save(bp);
    }

    @Transactional
    @Override
    public Blueprint updateBlueprint(String author, String name, Blueprint replacement)
            throws BlueprintNotFoundException {
        Blueprint existing = getBlueprint(author, name);
        existing.replacePoints(replacement.getPoints());
        return repo.save(existing);
    }

    @Override
    public void deleteBlueprint(String author, String name) throws BlueprintNotFoundException {
        Blueprint existing = getBlueprint(author, name);
        repo.delete(existing);
    }
}
