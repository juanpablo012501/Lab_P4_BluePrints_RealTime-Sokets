package co.edu.eci.blueprints.persistence.impl;


import co.edu.eci.blueprints.model.Blueprint;
import co.edu.eci.blueprints.model.BlueprintId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Set;

public interface BlueprintRepository extends JpaRepository<Blueprint, BlueprintId> {

    Set<Blueprint> findByAuthor(String author);
}
