using Newtonsoft.Json.Linq;

public class CPHInline
{
    private const string Key = "rts-higher-lower";

    public bool Execute()
    {
        if (!CPH.TryGetArg("rtsOverlayData", out string raw))
            return false;

        var result = JObject.Parse(raw);
        string outcome = result.Value<string>("result");
        if (outcome != "higher" && outcome != "lower" && outcome != "equal")
            return false;

        var configuration = ReadConfiguration();
        var game = configuration["game"] as JObject ?? new JObject();
        var players = game["players"] as JArray ?? new JArray();
        int bonusDelta = 0;

        for (int i = players.Count - 1; i >= 0; i--)
        {
            var player = (JObject)players[i];
            string vote = player.Value<string>("vote");

            if (string.IsNullOrWhiteSpace(vote))
            {
                players.RemoveAt(i);
                continue;
            }

            bool wins = outcome == "equal" || vote.ToLowerInvariant() == outcome;
            int bet = player.Value<int?>("bet") ?? 0;
            int pot = player.Value<int?>("pot") ?? 0;
            string id = player.Value<string>("id");
            string platformName = player.Value<string>("platform") ?? "twitch";
            Platform platform = ParsePlatform(platformName);

            if (wins)
            {
                player["pot"] = pot + (bet * 2);
                player["bet"] = 0;
                Increment(id, platform, "correct");
                Increment(id, platform, "pointsWon", bet * 2);
            }
            else
            {
                bonusDelta += bet + pot;
                Increment(id, platform, "wrong");
                Increment(id, platform, "pointsLost", bet + pot);
                players.RemoveAt(i);
            }
        }

        game["players"] = players;
        game["bonusPot"] =
            (game.Value<int?>("bonusPot") ?? 0) + bonusDelta;
        game["round"] = result.Value<int?>("round") ?? game.Value<int?>("round") ?? 0;
        game["currentCard"] = result["currentCard"] ?? game["currentCard"];

        CPH.SetArgument("rtsHigherLowerBonusPotDelta", bonusDelta);
        CPH.SetArgument("rtsOverlayData", raw);
        CPH.SetArgument("rtsHigherLowerOperation", "save");
        CPH.SetArgument(
            "rtsHigherLowerConfiguration",
            configuration.ToString(Newtonsoft.Json.Formatting.None));
        CPH.RunAction("RTS - Higher Lower - Sync", true);
        return true;
    }

    private Platform ParsePlatform(string value)
    {
        return System.Enum.TryParse(value, true, out Platform platform)
            ? platform
            : Platform.Twitch;
    }

    private void Increment(string id, Platform platform, string name, int amount = 1)
    {
        SetVar(id, platform, name, GetVar(id, platform, name) + amount);
    }

    private int GetVar(string id, Platform platform, string name)
    {
        switch (platform)
        {
            case Platform.YouTube:
                return CPH.GetYouTubeUserVarById<int?>(id, name, true) ?? 0;
            case Platform.Kick:
                return CPH.GetKickUserVarById<int?>(id, name, true) ?? 0;
            default:
                return CPH.GetTwitchUserVarById<int?>(id, name, true) ?? 0;
        }
    }

    private void SetVar(string id, Platform platform, string name, int value)
    {
        switch (platform)
        {
            case Platform.YouTube:
                CPH.SetYouTubeUserVarById(id, name, value, true);
                break;
            case Platform.Kick:
                CPH.SetKickUserVarById(id, name, value, true);
                break;
            default:
                CPH.SetTwitchUserVarById(id, name, value, true);
                break;
        }
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
