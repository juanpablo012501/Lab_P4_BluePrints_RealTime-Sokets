package co.edu.eci.blueprints.model;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Objects;

@Entity
@Table(name = "blueprints")
@IdClass(BlueprintId.class)
public class Blueprint {

    @Id
    private String author;
    @Id
    private String name;
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "blueprint_points")
    private final List<Point> points = new ArrayList<>();

    public Blueprint() {}

    public Blueprint(String author, String name, List<Point> pts) {
        this.author = author;
        this.name = name;
        if (pts != null) points.addAll(pts);
    }

    public String getAuthor() { return author; }
    public String getName() { return name; }
    public List<Point> getPoints() { return Collections.unmodifiableList(points); }

    public void addPoint(Point p) { points.add(p); }

    public void replacePoints(List<Point> replacement) {
        points.clear();
        if (replacement != null) points.addAll(replacement);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Blueprint bp)) return false;
        return Objects.equals(author, bp.author) && Objects.equals(name, bp.name);
    }

    @Override
    public int hashCode() {
        return Objects.hash(author, name);
    }
}
