// ===== 1. MODELO DE DADOS =====

// Pilot.java
public class Pilot {
    private String name;
    private String category;
    private int championships;
    private String team;
    private boolean active;
    
    // Construtores
    public Pilot() {}
    
    public Pilot(String name, String category, int championships, String team, boolean active) {
        this.name = name;
        this.category = category;
        this.championships = championships;
        this.team = team;
        this.active = active;
    }
    
    // Getters e Setters
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    
    public int getChampionships() { return championships; }
    public void setChampionships(int championships) { this.championships = championships; }
    
    public String getTeam() { return team; }
    public void setTeam(String team) { this.team = team; }
    
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    
    @Override
    public String toString() {
        return String.format("Pilot{name='%s', category='%s', championships=%d, team='%s', active=%s}",
                name, category, championships, team, active);
    }
}

// ===== 2. MENUM PARA CATEGORIAS =====

// PilotCategory.java
public enum PilotCategory {
    ALL("all", "Todos"),
    LEGEND("legend", "Lendas"),
    CURRENT("current", "Atuais"),
    ROOKIE("rookie", "Novatos");
    
    private final String code;
    private final String displayName;
    
    PilotCategory(String code, String displayName) {
        this.code = code;
        this.displayName = displayName;
    }
    
    public String getCode() { return code; }
    public String getDisplayName() { return displayName; }
    
    public static PilotCategory fromCode(String code) {
        for (PilotCategory category : values()) {
            if (category.code.equals(code)) {
                return category;
            }
        }
        return ALL;
    }
}

// ===== 3. INTERFACE DE FILTRO =====

// PilotFilter.java
import java.util.List;
import java.util.function.Predicate;

@FunctionalInterface
public interface PilotFilter extends Predicate<Pilot> {
    
    // Métodos estáticos para filtros comuns
    static PilotFilter byCategory(PilotCategory category) {
        if (category == PilotCategory.ALL) {
            return pilot -> true;
        }
        return pilot -> category.getCode().equals(pilot.getCategory());
    }
    
    static PilotFilter byActiveStatus(boolean active) {
        return pilot -> pilot.isActive() == active;
    }
    
    static PilotFilter byMinimumChampionships(int minChampionships) {
        return pilot -> pilot.getChampionships() >= minChampionships;
    }
    
    static PilotFilter byTeam(String team) {
        return pilot -> pilot.getTeam().equalsIgnoreCase(team);
    }
    
    // Método para combinar filtros
    default PilotFilter and(PilotFilter other) {
        return pilot -> this.test(pilot) && other.test(pilot);
    }
    
    default PilotFilter or(PilotFilter other) {
        return pilot -> this.test(pilot) || other.test(pilot);
    }
}

// ===== 4. SERVIÇO DE FILTROS =====

// PilotFilterService.java
import java.util.*;
import java.util.stream.Collectors;

public class PilotFilterService {
    private List<Pilot> pilots;
    private List<PilotFilterListener> listeners;
    
    public PilotFilterService() {
        this.pilots = new ArrayList<>();
        this.listeners = new ArrayList<>();
    }
    
    public PilotFilterService(List<Pilot> pilots) {
        this.pilots = new ArrayList<>(pilots);
        this.listeners = new ArrayList<>();
    }
    
    // Métodos de filtro principais
    public List<Pilot> filterAll() {
        List<Pilot> result = new ArrayList<>(pilots);
        notifyFiltered(PilotCategory.ALL, result);
        return result;
    }
    
    public List<Pilot> filterLegends() {
        List<Pilot> result = pilots.stream()
                .filter(PilotFilter.byCategory(PilotCategory.LEGEND))
                .collect(Collectors.toList());
        notifyFiltered(PilotCategory.LEGEND, result);
        return result;
    }
    
    public List<Pilot> filterCurrent() {
        List<Pilot> result = pilots.stream()
                .filter(PilotFilter.byCategory(PilotCategory.CURRENT))
                .collect(Collectors.toList());
        notifyFiltered(PilotCategory.CURRENT, result);
        return result;
    }
    
    // Método genérico de filtro
    public List<Pilot> filter(PilotFilter filter) {
        return pilots.stream()
                .filter(filter)
                .collect(Collectors.toList());
    }
    
    // Método de filtro por categoria
    public List<Pilot> filterByCategory(PilotCategory category) {
        switch (category) {
            case ALL: return filterAll();
            case LEGEND: return filterLegends();
            case CURRENT: return filterCurrent();
            default: return filterAll();
        }
    }
    
    // Filtros avançados
    public List<Pilot> filterByMultipleCriteria(PilotCategory category, 
                                              boolean activeOnly, 
                                              int minChampionships) {
        PilotFilter combinedFilter = PilotFilter.byCategory(category)
                .and(PilotFilter.byActiveStatus(activeOnly))
                .and(PilotFilter.byMinimumChampionships(minChampionships));
        
        return filter(combinedFilter);
    }
    
    // Gerenciamento de dados
    public void addPilot(Pilot pilot) {
        pilots.add(pilot);
    }
    
    public void addPilots(List<Pilot> pilots) {
        this.pilots.addAll(pilots);
    }
    
    public List<Pilot> getAllPilots() {
        return new ArrayList<>(pilots);
    }
    
    public void clearPilots() {
        pilots.clear();
    }

    public void addFilterListener(PilotFilterListener listener) {
        listeners.add(listener);
    }
    
    public void removeFilterListener(PilotFilterListener listener) {
        listeners.remove(listener);
    }
    
    private void notifyFiltered(PilotCategory category, List<Pilot> results) {
        listeners.forEach(listener -> listener.onPilotsFiltered(category, results));
    }
    
    public interface PilotFilterListener {
        void onPilotsFiltered(PilotCategory category, List<Pilot> pilots);
    }
}

import java.util.*;

public class PilotController {
    private PilotFilterService filterService;
    private PilotCategory activeCategory;
    private List<PilotControllerListener> listeners;
    
    public PilotController() {
        this.filterService = new PilotFilterService();
        this.activeCategory = PilotCategory.ALL;
        this.listeners = new ArrayList<>();
        
        filterService.addFilterListener(this::onCategoryChanged);
    }
    
    public PilotController(List<Pilot> pilots) {
        this();
        filterService.addPilots(pilots);
    }
    public List<Pilot> showAll() {
        return filterService.filterAll();
    }
    
    public List<Pilot> showLegends() {
        return filterService.filterLegends();
    }
    
    public List<Pilot> showCurrent() {
        return filterService.filterCurrent();
    }
    
    public List<Pilot> showByCategory(PilotCategory category) {
        return filterService.filterByCategory(category);
    }
    
    public PilotCategory getActiveCategory() {
        return activeCategory;
    }
    
    public List<Pilot> getAllPilots() {
        return filterService.getAllPilots();
    }
    
    public void addPilot(Pilot pilot) {
        filterService.addPilot(pilot);
        notifyDataChanged();
    }
    
    public void addPilots(List<Pilot> pilots) {
        filterService.addPilots(pilots);
        notifyDataChanged();
    }
    
    public void addListener(PilotControllerListener listener) {
        listeners.add(listener);
    }
    
    public void removeListener(PilotControllerListener listener) {
        listeners.remove(listener);
    }
    
    private void onCategoryChanged(PilotCategory category, List<Pilot> pilots) {
        this.activeCategory = category;
        notifyFilterChanged(category, pilots);
    }
    
    private void notifyFilterChanged(PilotCategory category, List<Pilot> pilots) {
        listeners.forEach(listener -> listener.onFilterChanged(category, pilots));
    }
    
    private void notifyDataChanged() {
        listeners.forEach(PilotControllerListener::onDataChanged);
    }
    public interface PilotControllerListener {
        default void onFilterChanged(PilotCategory category, List<Pilot> pilots) {}
        default void onDataChanged() {}
    }
}
import java.util.*;

public class Main {
    public static void main(String[] args) {
        List<Pilot> pilots = createSamplePilots();
        PilotController controller = new PilotController(pilots);
        controller.addListener(new PilotController.PilotControllerListener() {
            @Override
            public void onFilterChanged(PilotCategory category, List<Pilot> pilots) {
                System.out.println("\n=== Filtro: " + category.getDisplayName() + " ===");
                pilots.forEach(System.out::println);
                System.out.println("Total: " + pilots.size() + " pilotos");
            }
        });
        
        System.out.println("Demonstração do Sistema de Filtros");
        
        controller.showAll();
        controller.showLegends();
        controller.showCurrent();
        
        System.out.println("\n=== Filtro Personalizado: Lendas Ativas com 3+ Campeonatos ===");
        List<Pilot> customFilter = controller.filterService.filterByMultipleCriteria(
            PilotCategory.LEGEND, true, 3);
        customFilter.forEach(System.out::println);
    }
    
    private static List<Pilot> createSamplePilots() {
        return Arrays.asList(
            new Pilot("Lewis Hamilton", "current", 7, "Mercedes", true),
            new Pilot("Max Verstappen", "current", 3, "Red Bull", true),
            new Pilot("Ayrton Senna", "legend", 3, "McLaren", false),
            new Pilot("Michael Schumacher", "legend", 7, "Ferrari", false),
            new Pilot("Sebastian Vettel", "current", 4, "Aston Martin", true),
            new Pilot("Fernando Alonso", "current", 2, "Aston Martin", true),
            new Pilot("Oscar Piastri", "rookie", 0, "McLaren", true)
        );
    }
}