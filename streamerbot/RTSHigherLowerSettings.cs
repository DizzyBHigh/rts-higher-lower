using System;
using Newtonsoft.Json.Linq;

public class CPHInline
{
    public bool Execute()
    {
        CPH.TryGetArg("rtsHigherLowerSettingsOperation", out string operation);

        if (string.Equals(operation, "save", StringComparison.OrdinalIgnoreCase))
            Save();
        else
            Send();

        return true;
    }

    private void Save()
    {
        CPH.TryGetArg("rtsHigherLowerSettings", out string json);
        if (string.IsNullOrWhiteSpace(json))
            throw new ArgumentException("Higher Lower settings are missing.");

        var data = JObject.Parse(json);
        int rounds = (int?)data["noOfRounds"] ?? 10;
        int roundLength = (int?)data["roundLength"] ?? 60000;

        if (rounds < 1)
            throw new ArgumentException("Default rounds must be at least 1.");

        if (roundLength != 30000 && roundLength != 60000)
            throw new ArgumentException("Round length must be 30000 or 60000 milliseconds.");

        CPH.SetGlobalVar("hlgNoOfRounds", rounds, true);
        CPH.SetGlobalVar("hlgRoundLength", roundLength, true);
        Send();
    }

    private void Send()
    {
        int rounds = CPH.GetGlobalVar<int?>("hlgNoOfRounds", true) ?? 10;
        int roundLength = CPH.GetGlobalVar<int?>("hlgRoundLength", true) ?? 60000;

        CPH.SetArgument("rtsOverlayExtension", "rts-higher-lower");
        CPH.SetArgument("rtsOverlayCommand", "settings");
        CPH.SetArgument(
            "rtsOverlayData",
            $"{{\"noOfRounds\":{rounds},\"roundLength\":{roundLength}}}");
        CPH.RunAction("RTS - Overlay - Extension Command", true);
    }
}
