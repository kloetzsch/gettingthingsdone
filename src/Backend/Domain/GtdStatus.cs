namespace Backend.Domain;

public enum GtdStatus
{
    Inbox,
    NextAction,
    WaitingFor,
    SomedayMaybe,
    Done,

    // Verworfene Aufgaben sind abgeschlossen, ohne erledigt worden zu sein -
    // ihr Aufwand zählt daher nicht in Auswertungen. Wird als int gespeichert,
    // neue Werte daher immer hinten anhängen.
    Discarded,
}
