namespace Backend.Domain;

public static class EffortMinutes
{
    public const int FiveMinutes = 5;
    public const int TenMinutes = 10;
    public const int ThirtyMinutes = 30;
    public const int SixtyMinutes = 60;
    public const int FourHours = 240;
    public const int OneDay = 420;

    public static readonly IReadOnlySet<int> AllowedValues = new HashSet<int>
    {
        FiveMinutes, TenMinutes, ThirtyMinutes, SixtyMinutes, FourHours, OneDay,
    };
}
