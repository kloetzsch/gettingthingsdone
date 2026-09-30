using System.Reflection;
using System.Text.Json.Serialization;
using Backend.Data;
using Backend.Endpoints;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi(options =>
{
    // .NET's OpenAPI-Generator gibt int-Properties fälschlich als
    // ["integer", "string"] mit Zusatz-Pattern aus (siehe
    // https://github.com/dotnet/aspnetcore/issues/61038). Ein C# int wird von
    // System.Text.Json aber immer als reine JSON-Zahl serialisiert/erwartet -
    // die String-Alternative ist irreführend für generierte Clients.
    options.AddSchemaTransformer((schema, context, cancellationToken) =>
    {
        if (schema.Type is { } type && type.HasFlag(JsonSchemaType.Integer) && type.HasFlag(JsonSchemaType.String))
        {
            schema.Type = JsonSchemaType.Integer;
            schema.Pattern = null;
        }

        return Task.CompletedTask;
    });
});

builder.Services.ConfigureHttpJsonOptions(options =>
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter()));

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("Default")));

var app = builder.Build();

// Build-time OpenAPI-Dokumentgenerierung (Microsoft.Extensions.ApiDescription.Server)
// bootet die App mit einem Mock-Server über "GetDocument.Insider" - dabei darf keine
// echte Startup-Logik laufen, die eine Datenbankverbindung braucht (z. B. beim
// Docker-Build, wo Postgres noch gar nicht existiert).
if (Assembly.GetEntryAssembly()?.GetName().Name != "GetDocument.Insider")
{
    using (var scope = app.Services.CreateScope())
    {
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        if (db.Database.IsRelational())
        {
            db.Database.Migrate();

            // Beispieldaten nur auf ausdrücklichen Wunsch (SeedDemoData=true), damit eine
            // bewusst geleerte Datenbank mit echten Daten nicht wieder befüllt wird.
            if (app.Environment.IsDevelopment() && app.Configuration.GetValue<bool>("SeedDemoData"))
            {
                await DevSeeder.SeedIfEmptyAsync(db);
            }
        }
    }
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();

    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/openapi/v1.json", "Backend API v1");
        options.RoutePrefix = "openapi";
    });
}

app.UseHttpsRedirection();

app.MapGet("/health", () => Results.Ok(new { status = "healthy" }))
    .WithName("GetHealth")
    .WithSummary("Health-Check")
    .WithDescription("Prüft, ob die API läuft. Wird u. a. von Container-Healthchecks genutzt.")
    .Produces(StatusCodes.Status200OK);

app.MapTaskEndpoints();
app.MapProjectEndpoints();
app.MapCategoryEndpoints();

app.Run();

public partial class Program;
