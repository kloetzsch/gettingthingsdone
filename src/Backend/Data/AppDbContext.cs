using Backend.Domain;
using Microsoft.EntityFrameworkCore;

namespace Backend.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<TaskItem> Tasks => Set<TaskItem>();
    public DbSet<Category> Categories => Set<Category>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Project>(entity =>
        {
            entity.Property(p => p.Name).HasMaxLength(200);
        });

        modelBuilder.Entity<Category>(entity =>
        {
            entity.Property(c => c.Name).HasMaxLength(100);
            entity.HasIndex(c => c.Name).IsUnique();
        });

        modelBuilder.Entity<TaskItem>(entity =>
        {
            entity.Property(t => t.Title).HasMaxLength(200);
            entity.Property(t => t.Category).HasMaxLength(100);

            entity.ToTable(t => t.HasCheckConstraint(
                "CK_TaskItem_EstimatedMinutes",
                $"\"EstimatedMinutes\" IN ({string.Join(",", EffortMinutes.AllowedValues.Order())})"));

            entity.HasOne(t => t.Project)
                .WithMany(p => p.Tasks)
                .HasForeignKey(t => t.ProjectId)
                .OnDelete(DeleteBehavior.SetNull);
        });
    }
}
