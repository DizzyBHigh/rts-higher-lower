using System;
using Newtonsoft.Json.Linq;

public class CPHInline
{
    private const string ConfigurationKey = "rts-higher-lower";
    private const string EventName = "RTS - Higher Lower - Configuration";

    public bool Execute()
    {
        var operation = "get";

        if (CPH.TryGetArg("rtsHigherLowerOperation", out string requestedOperation) &&
            !string.IsNullOrWhiteSpace(requestedOperation))
            operation = requestedOperation;

        if (string.Equals(operation, "save", StringComparison.OrdinalIgnoreCase))
            return SaveConfiguration();

        return GetConfiguration();
    }

    public bool GetConfiguration()
    {
        var configuration = ReadConfiguration();
        CPH.SetArgument(
            "rtsHigherLowerConfiguration",
            configuration.ToString(Newtonsoft.Json.Formatting.None));
        CPH.TriggerEvent(EventName, true);
        return true;
    }

    public bool SaveConfiguration()
    {
        if (!CPH.TryGetArg("rtsHigherLowerConfiguration", out string raw) ||
            string.IsNullOrWhiteSpace(raw))
            return false;

        try
        {
            var configuration = JObject.Parse(raw);
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
                "RTS Higher Lower: configuration save failed: " + ex.Message);
            return false;
        }
    }

    private JObject ReadConfiguration()
    {
        var raw = CPH.GetGlobalVar<string>(ConfigurationKey, true);

        if (string.IsNullOrWhiteSpace(raw))
            return CreateDefaults();

        try
        {
            return JObject.Parse(raw);
        }
        catch
        {
            CPH.LogWarn(
                "RTS Higher Lower: stored configuration was invalid; using defaults.");
            return CreateDefaults();
        }
    }

    private JObject CreateDefaults()
    {
        return new JObject
        {
            ["settings"] = new JObject
            {
                ["defaultRounds"] = 10,
                ["roundLength"] = 60000
            },
            ["layout"] = new JObject(),
            ["game"] = new JObject()
        };
    }
}
