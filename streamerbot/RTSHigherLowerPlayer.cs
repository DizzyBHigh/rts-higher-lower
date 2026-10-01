using System;
using Newtonsoft.Json.Linq;

public class CPHInline
{
    private const string Key = "rts-higher-lower";

    public bool Execute()
    {
        if (!CPH.TryGetArg("rtsHigherLowerOperation", out string operation) ||
            !CPH.TryGetArg("userId", out string id) ||
            !CPH.TryGetArg("userType", out string type) ||
            !Enum.TryParse(type, true, out Platform platform))
            return false;

        var configuration = ReadConfiguration();
        var game = configuration["game"] as JObject ?? new JObject();

        if (operation == "join")
            return Join(configuration, game, id, platform);
        if (operation == "vote")
            return Vote(configuration, game, id, platform);
        if (operation == "bank")
            return Bank(configuration, game, id, platform);

        return false;
    }

    private bool Join(JObject configuration, JObject game, string id, Platform platform)
    {
        if (game.Value<bool?>("active") == true)
            return false;

        var players = game["players"] as JArray ?? new JArray();
        if (Find(players, id, platform) != null)
            return true;

        string name = CPH.TryGetArg("userName", out string userName)
            ? userName
            : id;

        players.Add(new JObject
        {
            ["id"] = id,
            ["platform"] = platform.ToString().ToLowerInvariant(),
            ["name"] = name,
            ["vote"] = null,
            ["bet"] = 0,
            ["pot"] = 0
        });

        game["players"] = players;
        Save(configuration);
        return true;
    }

    private bool Vote(JObject configuration, JObject game, string id, Platform platform)
    {
        if (game.Value<bool?>("active") != true)
            return false;

        var players = game["players"] as JArray ?? new JArray();
        var player = Find(players, id, platform);
        if (player == null || player["vote"]?.Type != JTokenType.Null)
            return false;

        int points = GetPoints(id, platform);
        string raw = CPH.TryGetArg("rawInput", out string input)
            ? input.Trim()
            : "";
        string direction = CPH.TryGetArg(
            "rtsHigherLowerVote", out string vote) ? vote : "";

        if (direction != "Higher" && direction != "Lower")
            return false;

        int amount = 0;
        if (points > 0)
        {
            if (!int.TryParse(raw, out amount) || amount <= 0 || amount > points)
                return false;
            SetPoints(id, platform, points - amount);
        }
        else if (!string.IsNullOrWhiteSpace(raw) &&
                 (!int.TryParse(raw, out amount) || amount != 0))
        {
            return false;
        }

        player["vote"] = direction;
        player["bet"] = amount;
        Save(configuration);
        return true;
    }

    private bool Bank(JObject configuration, JObject game, string id, Platform platform)
    {
        if (game.Value<bool?>("active") != true)
            return false;

        var players = game["players"] as JArray ?? new JArray();
        var player = Find(players, id, platform);
        if (player == null || player["vote"]?.Type != JTokenType.Null)
            return false;

        int pot = player.Value<int?>("pot") ?? 0;
        SetPoints(id, platform, GetPoints(id, platform) + pot);
        Increment(id, platform, "pointsBanked", pot);
        players.Remove(player);
        game["players"] = players;
        Save(configuration);
        return true;
    }

    private JObject Find(JArray players, string id, Platform platform)
    {
        string platformName = platform.ToString().ToLowerInvariant();
        foreach (JObject player in players)
        {
            if (player.Value<string>("id") != id)
                continue;

            string storedPlatform = player.Value<string>("platform");
            if (storedPlatform == platformName ||
                (string.IsNullOrWhiteSpace(storedPlatform) &&
                 platform == Platform.Twitch))
            {
                player["platform"] = platformName;
                return player;
            }
        }
        return null;
    }

    private void Increment(string id, Platform platform, string name, int amount)
    {
        switch (platform)
        {
            case Platform.YouTube:
                CPH.SetYouTubeUserVarById(
                    id, name,
                    (CPH.GetYouTubeUserVarById<int?>(id, name, true) ?? 0) + amount,
                    true);
                break;
            case Platform.Kick:
                CPH.SetKickUserVarById(
                    id, name,
                    (CPH.GetKickUserVarById<int?>(id, name, true) ?? 0) + amount,
                    true);
                break;
            default:
                CPH.SetTwitchUserVarById(
                    id, name,
                    (CPH.GetTwitchUserVarById<int?>(id, name, true) ?? 0) + amount,
                    true);
                break;
        }
    }

    private JObject ReadConfiguration()
    {
        var raw = CPH.GetGlobalVar<string>(Key, true);
        try { return string.IsNullOrWhiteSpace(raw) ? new JObject() : JObject.Parse(raw); }
        catch { return new JObject(); }
    }

    private void Save(JObject configuration)
    {
        CPH.SetArgument("rtsHigherLowerOperation", "save");
        CPH.SetArgument(
            "rtsHigherLowerConfiguration",
            configuration.ToString(Newtonsoft.Json.Formatting.None));
        CPH.RunAction("RTS - Higher Lower - Sync", true);
    }
}
