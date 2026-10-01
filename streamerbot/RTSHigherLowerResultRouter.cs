using System;

public class CPHInline
{
    private const string Extension = "rts-higher-lower";
    private const string EventName = "higher-lower-result";
    private const string SettlementAction = "RTS - Higher Lower - Game";

    public bool Execute()
    {
        if (!CPH.TryGetArg("rtsOverlayExtension", out string extension) ||
            extension != Extension)
            return false;

        if (!CPH.TryGetArg("rtsOverlayEvent", out string eventName) ||
            eventName != EventName)
            return false;

        CPH.SetArgument("rtsHigherLowerOperation", "result");
        return CPH.RunAction(SettlementAction, true);
    }
}
