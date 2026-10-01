using Newtonsoft.Json.Linq;

public class CPHInline
{
    private const string Key = "rts-higher-lower";

    public bool Execute()
    {
        if (!CPH.TryGetArg("rtsOverlayData", out string raw))
            return false;

        var configuration = ReadConfiguration();
        var game = configuration["game"] as JObject ?? new JObject();
        var result = JObject.Parse(raw);

        game["round"] = result.Value<int?>("round") ?? game.Value<int?>("round") ?? 0;
        game["currentCard"] = result["currentCard"] ?? game["currentCard"];

        CPH.SetArgument("rtsHigherLowerOperation", "save");
        CPH.SetArgument(
            "rtsHigherLowerConfiguration",
            configuration.ToString(Newtonsoft.Json.Formatting.None));
        CPH.RunAction("RTS - Higher Lower - Sync", true);
        return true;
    }

    private JObject ReadConfiguration()
    {
        var raw = CPH.GetGlobalVar<string>(Key, true);
        if (string.IsNullOrWhiteSpace(raw))
            return new JObject();
        try { return JObject.Parse(raw); }
        catch { return new JObject(); }
    }
}
