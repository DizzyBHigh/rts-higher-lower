using System;
using Newtonsoft.Json.Linq;

public class CPHInline
{
    private const string ConfigurationKey = "rts-higher-lower";
    private const string EventName = "RTS - Higher Lower - Configuration";

    public bool Execute()
    {
        if (!CPH.TryGetArg("rtsHigherLowerGame", out string raw) ||
            string.IsNullOrWhiteSpace(raw))
            return false;

        try
        {
            var game = JObject.Parse(raw);
            var configuration = ReadConfiguration();
            configuration["game"] = game;

            CPH.SetGlobalVar(
                ConfigurationKey,
                configuration.ToString(Newtonsoft.Json.Formatting.None),
                true);

            CPH.SetArgument(
                "rtsHigherLowerConfiguration",
                configuration.ToString(Newtonsoft.Json.Formatting.None));

            CPH.TriggerEvent(EventName, true);
            return true;
        }
        catch (Exception ex)
        {
            CPH.LogWarn(
                "RTS Higher Lower: game state save failed: " + ex.Message);
            return false;
        }
    }

    private JObject ReadConfiguration()
    {
        var raw = CPH.GetGlobalVar<string>(ConfigurationKey, true);

        if (string.IsNullOrWhiteSpace(raw))
            return new JObject();

        try
        {
            return JObject.Parse(raw);
        }
        catch
        {
            return new JObject();
        }
    }
}
