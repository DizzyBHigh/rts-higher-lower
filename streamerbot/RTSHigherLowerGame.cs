using System;
using Newtonsoft.Json.Linq;

public class CPHInline
{
    private const string Key = "rts-higher-lower";
    private const string SyncAction = "RTS - Higher Lower - Sync";
    private const string EventName = "RTS - Higher Lower - Configuration";

    public bool Execute()
    {
        if (!CPH.TryGetArg("rtsHigherLowerOperation", out string operation))
            return false;

        switch (operation.ToLowerInvariant())
        {
            case "join": return Join();
            case "vote": return Vote();
            case "bank": return Bank();
            case "savegame": return SaveGame();
            case "result": return Result();
            default: return false;
        }
    }

    private bool Join()
    {
        if (!ReadUser(out string id, out Platform platform))
            return false;

        var configuration = ReadConfiguration();
        var game = GetGame(configuration);
        if (game.Value<bool?>("active") == true)
            return false;

        var players = GetPlayers(game);
        if (Find(players, id, platform) != null)
            return true;

        string name = CPH.TryGetArg("userName", out string userName)
            ? userName : id;

        players.Add(new JObject
        {
            ["id"] = id,
            ["platform"] = PlatformName(platform),
            ["name"] = name,
            ["vote"] = null,
            ["bet"] = 0,
            ["pot"] = 0
        });

        game["players"] = players;
        Save(configuration);
        return true;
    }

    private bool Vote()
    {
        if (!ReadUser(out string id, out Platform platform))
            return false;

        var configuration = ReadConfiguration();
        var game = GetGame(configuration);
        if (game.Value<bool?>("active") != true)
            return false;

        var player = Find(GetPlayers(game), id, platform);
        if (player == null || player["vote"]?.Type != JTokenType.Null)
            return false;

        string direction = CPH.TryGetArg(
            "rtsHigherLowerVote", out string vote) ? vote : "";
        if (direction != "Higher" && direction != "Lower")
            return false;

        int points = GetVar(id, platform, "points");
        string raw = CPH.TryGetArg("rawInput", out string input)
            ? input.Trim() : "";
        int amount = 0;

        if (points > 0)
        {
            if (!int.TryParse(raw, out amount) ||
                amount <= 0 || amount > points)
                return false;
            SetVar(id, platform, "points", points - amount);
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

    private bool Bank()
    {
        if (!ReadUser(out string id, out Platform platform))
            return false;

        var configuration = ReadConfiguration();
        var game = GetGame(configuration);
        if (game.Value<bool?>("active") != true)
            return false;

        var players = GetPlayers(game);
        var player = Find(players, id, platform);
        if (player == null || player["vote"]?.Type != JTokenType.Null)
            return false;

        int pot = player.Value<int?>("pot") ?? 0;
        AddPoints(id, platform, pot);
        Increment(id, platform, "pointsBanked", pot);
        players.Remove(player);
        game["players"] = players;
        Save(configuration);
        return true;
    }

    private bool SaveGame()
    {
        if (!CPH.TryGetArg("rtsHigherLowerGame", out string raw) ||
            string.IsNullOrWhiteSpace(raw))
            return false;

        try
        {
            var game = JObject.Parse(raw);
            var configuration = ReadConfiguration();
            configuration["game"] =
                game.Value<bool?>("active") == true ? game : new JObject();

            Save(configuration);
            return true;
        }
        catch (Exception ex)
        {
            CPH.LogWarn(
                "RTS Higher Lower: game state save failed: " + ex.Message);
            return false;
        }
    }

    private bool Result()
    {
        if (!CPH.TryGetArg("rtsOverlayData", out string raw))
            return false;

        var result = JObject.Parse(raw);
        string outcome = result.Value<string>("result");
        if (outcome != "higher" && outcome != "lower" && outcome != "equal")
            return false;

        var configuration = ReadConfiguration();
        var game = GetGame(configuration);
        var players = GetPlayers(game);
        int bonusDelta = 0;

        for (int i = players.Count - 1; i >= 0; i--)
        {
            var player = (JObject)players[i];
            string vote = player.Value<string>("vote");

            if (string.IsNullOrWhiteSpace(vote))
            {
                int forfeitedPot = player.Value<int?>("pot") ?? 0;
                var identity = Identity(player);
                bonusDelta += forfeitedPot;
                if (forfeitedPot > 0)
                    Increment(
                        identity.id,
                        identity.platform,
                        "pointsLost",
                        forfeitedPot);
                players.RemoveAt(i);
                continue;
            }

            bool wins = outcome == "equal" ||
                vote.ToLowerInvariant() == outcome;
            int bet = player.Value<int?>("bet") ?? 0;
            int pot = player.Value<int?>("pot") ?? 0;
            var user = Identity(player);

            if (wins)
            {
                player["pot"] = pot + (bet * 2);
                player["bet"] = 0;
                Increment(user.id, user.platform, "correct");
                Increment(user.id, user.platform, "pointsWon", bet * 2);
            }
            else
            {
                bonusDelta += bet + pot;
                Increment(user.id, user.platform, "wrong");
                Increment(
                    user.id, user.platform, "pointsLost", bet + pot);
                players.RemoveAt(i);
            }
        }

        game["players"] = players;
        game["bonusPot"] =
            (game.Value<int?>("bonusPot") ?? 0) + bonusDelta;
        game["round"] =
            result.Value<int?>("round") ??
            game.Value<int?>("round") ?? 0;
        game["currentCard"] =
            result["currentCard"] ?? game["currentCard"];

        int rounds = game.Value<int?>("rounds") ?? 10;
        if ((game.Value<int?>("round") ?? 0) >= rounds)
            Complete(game, players);

        CPH.SetArgument("rtsHigherLowerBonusPotDelta", bonusDelta);
        CPH.SetArgument("rtsOverlayData", raw);
        Save(configuration);
        return true;
    }

    private void Complete(JObject game, JArray players)
    {
        int bonusPot = game.Value<int?>("bonusPot") ?? 0;
        int share = players.Count > 0 ? bonusPot / players.Count : 0;

        foreach (JObject player in players)
        {
            int pot = player.Value<int?>("pot") ?? 0;
            var user = Identity(player);
            int payout = pot + share;

            if (payout > 0)
                AddPoints(user.id, user.platform, payout);
            if (share > 0)
                Increment(user.id, user.platform, "pointsWon", share);

            Increment(user.id, user.platform, "fullSweeps");
        }

        game["bonusPot"] =
            players.Count > 0 ? bonusPot % players.Count : bonusPot;
        game["active"] = false;
        game["players"] = new JArray();
    }

    private void Save(JObject configuration)
    {
        CPH.SetArgument("rtsHigherLowerOperation", "save");
        CPH.SetArgument(
            "rtsHigherLowerConfiguration",
            configuration.ToString(Newtonsoft.Json.Formatting.None));
        CPH.RunAction(SyncAction, true);
    }

    private JObject ReadConfiguration()
    {
        var raw = CPH.GetGlobalVar<string>(Key, true);
        if (string.IsNullOrWhiteSpace(raw))
            return new JObject();

        try { return JObject.Parse(raw); }
        catch { return new JObject(); }
    }

    private JObject GetGame(JObject configuration)
    {
        return configuration["game"] as JObject ?? new JObject();
    }

    private JArray GetPlayers(JObject game)
    {
        return game["players"] as JArray ?? new JArray();
    }

    private bool ReadUser(out string id, out Platform platform)
    {
        id = "";
        platform = Platform.Twitch;

        return CPH.TryGetArg("userId", out id) &&
            CPH.TryGetArg("userType", out string type) &&
            Enum.TryParse(type, true, out platform);
    }

    private JObject Find(JArray players, string id, Platform platform)
    {
        string name = PlatformName(platform);

        foreach (JObject player in players)
        {
            if (player.Value<string>("id") != id)
                continue;

            string stored = player.Value<string>("platform");
            if (stored == name ||
                (string.IsNullOrWhiteSpace(stored) &&
                 platform == Platform.Twitch))
            {
                player["platform"] = name;
                return player;
            }
        }

        return null;
    }

    private (string id, Platform platform) Identity(JObject player)
    {
        string id = player.Value<string>("id");
        string name = player.Value<string>("platform") ?? "twitch";
        Platform platform = Enum.TryParse(
            name, true, out Platform parsed)
            ? parsed : Platform.Twitch;
        return (id, platform);
    }

    private string PlatformName(Platform platform)
    {
        return platform.ToString().ToLowerInvariant();
    }

    private void Increment(
        string id, Platform platform, string name, int amount = 1)
    {
        SetVar(id, platform, name, GetVar(id, platform, name) + amount);
    }

    private void AddPoints(string id, Platform platform, int amount)
    {
        SetVar(
            id, platform, "points",
            GetVar(id, platform, "points") + amount);
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

    private void SetVar(
        string id, Platform platform, string name, int value)
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
}
