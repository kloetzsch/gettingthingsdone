using Backend.Domain;
using Microsoft.EntityFrameworkCore;

namespace Backend.Data;

/// <summary>
/// Nur für lokale Entwicklung: befüllt eine leere Datenbank mit Beispieldaten.
/// Wird in Program.cs ausschließlich unter app.Environment.IsDevelopment() aufgerufen
/// und bricht selbst zusätzlich ab, falls bereits Daten vorhanden sind.
/// </summary>
public static class DevSeeder
{
    private static readonly int[] EffortOptions = [5, 10, 30, 60, 240, 420];

    private static readonly GtdStatus[] OpenStatuses =
    [
        GtdStatus.Inbox, GtdStatus.NextAction, GtdStatus.WaitingFor, GtdStatus.SomedayMaybe,
    ];

    private static readonly Dictionary<string, string[]> TitlesByCategory = new()
    {
        ["Haushalt"] =
        [
            "Wäsche waschen", "Bad putzen", "Einkaufsliste schreiben", "Kühlschrank ausmisten",
            "Glühbirne im Flur wechseln", "Rauchmelder testen", "Fenster putzen", "Pflanzen gießen",
            "Wäsche zusammenlegen", "Staub wischen", "Müll rausbringen", "Bettwäsche wechseln",
        ],
        ["Finanzen"] =
        [
            "Kontoauszug prüfen", "Rechnung bezahlen", "Versicherung vergleichen", "Daueraufträge prüfen",
            "Depot-Übersicht checken", "Kreditkartenabrechnung kontrollieren", "Nebenkostenabrechnung prüfen",
            "Rücklagen umschichten", "Spendenquittungen sammeln", "Steuerbelege sortieren",
        ],
        ["Arbeit"] =
        [
            "E-Mails aufräumen", "Wochenbericht schreiben", "Meeting vorbereiten", "Präsentation überarbeiten",
            "Kalender für nächste Woche planen", "Feedback-Gespräch vorbereiten", "Projektstatus aktualisieren",
            "Rechnung an Kunden stellen", "Notizen aus dem Meeting nachbereiten", "Onboarding-Doku aktualisieren",
        ],
        ["Gesundheit"] =
        [
            "Zahnarzttermin vereinbaren", "Laufschuhe kaufen", "Vorsorgeuntersuchung buchen",
            "Rezept abholen", "Wasserflasche auffüllen gehen", "Yoga-Video raussuchen",
            "Ergonomie am Schreibtisch prüfen", "Schlafrhythmus-Notizen führen",
        ],
    };

    public static async Task SeedIfEmptyAsync(AppDbContext db)
    {
        if (await db.Projects.AnyAsync() || await db.Categories.AnyAsync() || await db.Tasks.AnyAsync())
        {
            return;
        }

        var now = DateTimeOffset.UtcNow;
        var random = new Random(42);

        var categories = TitlesByCategory.Keys
            .Select(name => new Category { Id = Guid.NewGuid(), Name = name, CreatedAt = now })
            .ToArray();
        db.Categories.AddRange(categories);

        var projects = new[]
        {
            new Project
            {
                Id = Guid.NewGuid(), Name = "Umzug organisieren",
                Outcome = "In der neuen Wohnung eingerichtet sein", Status = ProjectStatus.Active, CreatedAt = now,
            },
            new Project
            {
                Id = Guid.NewGuid(), Name = "Jahressteuererklärung",
                Outcome = "Steuererklärung fristgerecht eingereicht", Status = ProjectStatus.Active, CreatedAt = now,
            },
            new Project
            {
                Id = Guid.NewGuid(), Name = "Home-Office einrichten",
                Outcome = "Voll ausgestatteter Arbeitsplatz zu Hause", Status = ProjectStatus.OnHold, CreatedAt = now,
            },
        };
        db.Projects.AddRange(projects);

        var tasks = new List<TaskItem>();

        for (var i = 0; i < 100; i++)
        {
            var categoryName = categories[random.Next(categories.Length)].Name;
            var titlePool = TitlesByCategory[categoryName];
            var title = titlePool[random.Next(titlePool.Length)];

            var createdAt = now.AddMinutes(-random.Next(0, 7 * 24 * 60));

            var isDone = random.NextDouble() < 0.4;
            var status = isDone ? GtdStatus.Done : OpenStatuses[random.Next(OpenStatuses.Length)];

            DateTimeOffset? completedAt = null;
            if (isDone)
            {
                var elapsedSinceCreation = now - createdAt;
                completedAt = createdAt + (elapsedSinceCreation * random.NextDouble());
            }

            var projectId = random.NextDouble() < 0.65
                ? projects[random.Next(projects.Length)].Id
                : (Guid?)null;

            tasks.Add(new TaskItem
            {
                Id = Guid.NewGuid(),
                Title = title,
                Notes = null,
                Status = status,
                Category = categoryName,
                EstimatedMinutes = EffortOptions[random.Next(EffortOptions.Length)],
                DueDate = null,
                CreatedAt = createdAt,
                CompletedAt = completedAt,
                ProjectId = projectId,
            });
        }

        // Garantiert mindestens eine heute abgeschlossene Aufgabe.
        var completedToday = tasks.First(t => t.Status != GtdStatus.Done);
        completedToday.Status = GtdStatus.Done;
        completedToday.CompletedAt = now;

        db.Tasks.AddRange(tasks);

        await db.SaveChangesAsync();
    }
}
