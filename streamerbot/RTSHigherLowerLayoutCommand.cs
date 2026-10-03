using System;

public class CPHInline
{
    public bool Execute()
    {
        string layout = CPH.TryGetArg("rawInput", out string value)
            ? value.Trim()
            : "";

        if (string.IsNullOrWhiteSpace(layout))
            return false;

        CPH.SetArgument("rtsOverlayExtension", "rts-higher-lower");
        CPH.SetArgument("rtsOverlayCommand", "layout");
        CPH.SetArgument("rtsOverlayData", layout);

        return CPH.RunAction("RTS - Overlay - Extension Command", true);
    }
}
