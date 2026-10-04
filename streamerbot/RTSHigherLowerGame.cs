using System;
using Newtonsoft.Json.Linq;

public class CPHInline
{
    private const string Key = "rts-higher-lower";
    private const string EventName = "RTS - Higher Lower Game";

    public bool Execute()
    {
        if (!CPH.TryGetArg("rtsHigherLowerOperation", out string operation)) return true;
        switch (operation.ToLowerInvariant())
        {
            case "join": return Join();
            case "create": return CreateGame();
            case "start": return StartGame();
            case "reset": return Reset();
            case "vote": return Vote();
            case "bank": return Bank();
            case "draw": return Draw();
            case "savegame": return SaveGame();
            case "result": return Result();
            case "layout": return Layout();
            case "load": return LoadExtension();
            case "get": return GetConfiguration();
            case "save": return SaveConfiguration();
            default: return false;
        }
    }

    public bool LoadExtension()
    {
        CPH.SetArgument("rtsOverlayExtension", "rts-higher-lower");
        CPH.SetArgument("rtsOverlayManifestUrl", "https://dizzybhigh.github.io/rts-higher-lower/overlay/manifest.json");
        CPH.TriggerEvent("RTS - Overlay - Load Extension", true);
        return true;
    }
    public bool Layout()
    {
        string layout = CPH.TryGetArg("rawInput", out string value) ? value.Trim() : "";
        if (string.IsNullOrWhiteSpace(layout)) return false;
        var configuration = ReadConfiguration();
        if (configuration["layouts"]?[layout] == null) return false;
        CPH.SetArgument("rtsOverlayExtension", "rts-higher-lower");
        CPH.SetArgument("rtsOverlayCommand", "layout");
        CPH.SetArgument("rtsOverlayData", layout);
        return CPH.RunAction("RTS - Higher Lower Game - Connector", true);
    }

    public bool Join()
    {
        if (!ReadUser(out string id, out Platform platform)) return false;
        var configuration = ReadConfiguration();
        var game = GetGame(configuration);
        if (game.Value<string>("state") != "registration") return false;
        var players = GetPlayers(game);
        if (Find(players, id, platform) != null) return true;
        string name = CPH.TryGetArg("userName", out string userName) ? userName : id;
        players.Add(new JObject
        {
            ["id"] = id, ["platform"] = PlatformName(platform), ["name"] = name,
            ["vote"] = null, ["bet"] = 0, ["pot"] = 0
        });
        game["players"] = players;
        Save(configuration);
        return true;
    }

    public bool CreateGame()
    {
        var configuration = ReadConfiguration();
        var existing = GetGame(configuration);
        if (existing.Value<string>("state") == "registration" || existing.Value<string>("state") == "playing") return false;
        int rounds = configuration["settings"]?.Value<int?>("defaultRounds") ?? 10;
        if (rounds < 1) return false;
        var game = new JObject
        {
            ["state"] = "registration",
            ["active"] = false,
            ["rounds"] = rounds,
            ["round"] = 0,
            ["players"] = new JArray(),
            ["bonusPot"] = 0,
            ["registrationStartedAt"] = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
        };
        configuration["game"] = game;
        Save(configuration);
        SetCreateGameCommandEnabled(false);
        SetJoinCommandEnabled(true);
        SetVoteCommandEnabled(false);
        SetBankCommandEnabled(false);
        CPH.SetArgument("rtsOverlayExtension", "rts-higher-lower");
        CPH.SetArgument("rtsOverlayCommand", "create");
        CPH.SetArgument("rtsOverlayData", game.Value<long>("registrationStartedAt"));
        CPH.TriggerEvent(EventName, true);
        return true;
    }

    public bool StartGame()
    {
        var configuration = ReadConfiguration();
        var game = GetGame(configuration);
        if (game.Value<string>("state") != "registration") return false;
        var players = GetPlayers(game);
        if (players.Count == 0)
        {
            configuration["game"] = new JObject();
            Save(configuration);
            SetCreateGameCommandEnabled(true);
            SetJoinCommandEnabled(false);
            SetVoteCommandEnabled(false);
            SetBankCommandEnabled(false);
            ResetOverlay();
            return false;
        }
        game["state"] = "playing";
        game["active"] = true;
        game.Remove("registrationStartedAt");
        SaveSilently(configuration);
        SetCreateGameCommandEnabled(false);
        SetJoinCommandEnabled(false);
        SetVoteCommandEnabled(true);
        SetBankCommandEnabled(true);
        CPH.SetArgument("rtsOverlayExtension", "rts-higher-lower");
        CPH.SetArgument("rtsOverlayCommand", "start");
        CPH.SetArgument("rtsOverlayData", game.Value<int?>("rounds") ?? 10);
        CPH.TriggerEvent(EventName, true);
        return true;
    }

    public bool Reset()
    {
        var configuration = ReadConfiguration();
        configuration["game"] = new JObject();
        Save(configuration);
        SetCreateGameCommandEnabled(true);
        SetJoinCommandEnabled(false);
        SetVoteCommandEnabled(false);
        SetBankCommandEnabled(false);
        ResetOverlay();
        return true;
    }

    private void ResetOverlay()
    {
        CPH.SetArgument("rtsOverlayExtension", "rts-higher-lower");
        CPH.SetArgument("rtsOverlayCommand", "reset");
        CPH.SetArgument("rtsOverlayData", null);
        CPH.RunAction("RTS - Higher Lower Game - Connector", true);
    }

    private bool Draw()
    {
        var configuration = ReadConfiguration();
        if (GetGame(configuration).Value<string>("state") != "playing") return false;
        CPH.SetArgument("rtsOverlayExtension", "rts-higher-lower");
        CPH.SetArgument("rtsOverlayCommand", "draw");
        return CPH.RunAction("RTS - Higher Lower Game - Connector", true);
    }

    public bool Vote()
    {
        if (!ReadUser(out string id, out Platform platform)) return false;
        var configuration = ReadConfiguration();
        var game = GetGame(configuration);
        if (game.Value<string>("state") != "playing") return false;
        var player = Find(GetPlayers(game), id, platform);
        if (player == null || player["vote"]?.Type != JTokenType.Null) return false;
        string raw = CPH.TryGetArg("rawInput", out string input) ? input.Trim() : "";
        string[] parts = raw.Split(new[] { ' ' }, StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length != 2) return false;
        string direction;
        if (parts[0].Equals("higher", StringComparison.OrdinalIgnoreCase)) direction = "Higher";
        else if (parts[0].Equals("lower", StringComparison.OrdinalIgnoreCase)) direction = "Lower";
        else return false;
        if (!int.TryParse(parts[1], out int amount) || amount < 0) return false;
        int points = GetVar(id, platform, "points");
        if (points > 0)
        {
            if (amount <= 0) return false;
            amount = Math.Min(amount, points);
            SetVar(id, platform, "points", points - amount);
        }
        else if (amount != 0) return false;
        player["vote"] = direction;
        player["bet"] = amount;
        Save(configuration);
        return true;
    }

    public bool Bank()
    {
        if (!ReadUser(out string id, out Platform platform)) return false;
        var configuration = ReadConfiguration();
        var game = GetGame(configuration);
        if (game.Value<string>("state") != "playing") return false;
        var players = GetPlayers(game);
        var player = Find(players, id, platform);
        if (player == null || player["vote"]?.Type != JTokenType.Null) return false;
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
        if (!CPH.TryGetArg("rtsHigherLowerGame", out string raw) || string.IsNullOrWhiteSpace(raw)) return false;
        try
        {
            var game = JObject.Parse(raw);
            var configuration = ReadConfiguration();
            if (game.Value<bool?>("active") == true)
            {
                game["state"] = "playing";
                configuration["game"] = game;
                Save(configuration);
            }
            return true;
        }
        catch (Exception ex)
        {
            CPH.LogWarn("RTS Higher Lower: game state save failed: " + ex.Message);
            return false;
        }
    }

    private bool Result()
    {
        if (!CPH.TryGetArg("rtsOverlayData", out string raw)) return false;
        var result = JObject.Parse(raw);
        string outcome = result.Value<string>("result");
        if (outcome != "higher" && outcome != "lower" && outcome != "equal") return false;
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
                if (forfeitedPot > 0) Increment(identity.id, identity.platform, "pointsLost", forfeitedPot);
                players.RemoveAt(i);
                continue;
            }
            bool wins = outcome == "equal" || vote.ToLowerInvariant() == outcome;
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
                Increment(user.id, user.platform, "pointsLost", bet + pot);
                players.RemoveAt(i);
            }
        }
        game["players"] = players;
        game["bonusPot"] = (game.Value<int?>("bonusPot") ?? 0) + bonusDelta;
        game["round"] = result.Value<int?>("round") ?? game.Value<int?>("round") ?? 0;
        game["currentCard"] = result["currentCard"] ?? game["currentCard"];
        int rounds = game.Value<int?>("rounds") ?? 10;
        if ((game.Value<int?>("round") ?? 0) >= rounds) Complete(game, players);
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
            if (payout > 0) AddPoints(user.id, user.platform, payout);
            if (share > 0) Increment(user.id, user.platform, "pointsWon", share);
            Increment(user.id, user.platform, "fullSweeps");
        }
        game["bonusPot"] = players.Count > 0 ? bonusPot % players.Count : bonusPot;
        game["active"] = false;
        game["state"] = "completed";
        game["players"] = new JArray();
        SetCreateGameCommandEnabled(true);
        SetJoinCommandEnabled(false);
        SetVoteCommandEnabled(false);
        SetBankCommandEnabled(false);
    }

    private void SetCommandEnabled(string name, bool enabled)
    {
        foreach (var command in CPH.GetCommands())
        {
            if (!string.Equals(command.Name?.TrimStart('!'), name, StringComparison.OrdinalIgnoreCase)) continue;
            if (enabled) CPH.EnableCommand(command.Id.ToString());
            else CPH.DisableCommand(command.Id.ToString());
        }
    }

    private void SetCreateGameCommandEnabled(bool enabled) => SetCommandEnabled("createGame", enabled);
    private void SetJoinCommandEnabled(bool enabled) => SetCommandEnabled("join", enabled);
    private void SetVoteCommandEnabled(bool enabled) => SetCommandEnabled("vote", enabled);
    private void SetBankCommandEnabled(bool enabled) => SetCommandEnabled("bank", enabled);

    private void Save(JObject configuration) { SaveConfiguration(configuration, false); }

    private void SaveSilently(JObject configuration)
    {
        string raw = configuration.ToString(Newtonsoft.Json.Formatting.None);
        CPH.SetGlobalVar(Key, raw, true);
        CPH.SetArgument("rtsHigherLowerConfiguration", raw);
    }

    private bool GetConfiguration()
    {
        var configuration = ReadConfiguration();
        CPH.SetArgument("rtsHigherLowerConfiguration", configuration.ToString(Newtonsoft.Json.Formatting.None));
        CPH.TriggerEvent(EventName, true);
        return true;
    }

    private bool SaveConfiguration()
    {
        if (!CPH.TryGetArg("rtsHigherLowerConfiguration", out string raw) || string.IsNullOrWhiteSpace(raw)) return false;
        try { SaveConfiguration(JObject.Parse(raw), true); return true; }
        catch (Exception ex) { CPH.LogWarn("RTS Higher Lower: configuration save failed: " + ex.Message); return false; }
    }

    private void SaveConfiguration(JObject configuration, bool layoutSaved)
    {
        string raw = configuration.ToString(Newtonsoft.Json.Formatting.None);
        CPH.SetGlobalVar(Key, raw, true);
        CPH.SetArgument("rtsHigherLowerConfiguration", raw);
        if (layoutSaved) CPH.SetArgument("rtsHigherLowerSaveStatus", "Layout saved");
        CPH.TriggerEvent(EventName, true);
    }

    private JObject ReadConfiguration()
    {
        var raw = CPH.GetGlobalVar<string>(Key, true);
        if (string.IsNullOrWhiteSpace(raw)) return CreateDefaults();
        try { return JObject.Parse(raw); }
        catch { return CreateDefaults(); }
    }

    private JObject CreateDefaults()
    {
        return new JObject
        {
            ["settings"] = new JObject { ["defaultRounds"] = 10, ["roundLength"] = 30000 },
            ["layouts"] = new JObject(),
            ["game"] = new JObject()
        };
    }

    private JObject GetGame(JObject configuration)
    {
        return configuration["game"] as JObject ?? new JObject();
    }

    private JArray GetPlayers(JObject game)
    {
        return game["players"] as JArray ?? new JArray();
    }

    private enum Platform { Twitch, YouTube, Kick, Unknown }

    private string PlatformName(Platform platform)
    {
        switch (platform)
        {
            case Platform.Twitch: return "twitch";
            case Platform.YouTube: return "youtube";
            case Platform.Kick: return "kick";
            default: return "unknown";
        }
    }

    private bool ReadUser(out string id, out Platform platform)
    {
        id = "";
        platform = Platform.Unknown;
        if (!CPH.TryGetArg("userId", out string value) || string.IsNullOrWhiteSpace(value)) return false;
        id = value;
        string source = CPH.TryGetArg("platform", out string raw) ? raw.ToLowerInvariant() : "";
        platform = source switch
        {
            "twitch" => Platform.Twitch,
            "youtube" => Platform.YouTube,
            "kick" => Platform.Kick,
            _ => Platform.Unknown
        };
        return true;
    }

    private JObject Find(JArray players, string id, Platform platform)
    {
        string name = PlatformName(platform);
        foreach (JObject player in players)
            if (player.Value<string>("id") == id && player.Value<string>("platform") == name) return player;
        return null;
    }

    private (string id, Platform platform) Identity(JObject player)
    {
        string id = player.Value<string>("id") ?? "";
        string raw = player.Value<string>("platform") ?? "unknown";
        Platform platform = raw switch
        {
            "twitch" => Platform.Twitch,
            "youtube" => Platform.YouTube,
            "kick" => Platform.Kick,
            _ => Platform.Unknown
        };
        return (id, platform);
    }

    private int GetVar(string id, Platform platform, string name)
    {
        string key = id + ":" + PlatformName(platform) + ":" + name;
        return CPH.GetGlobalVar<int>(key, true);
    }

    private void SetVar(string id, Platform platform, string name, int value)
    {
        string key = id + ":" + PlatformName(platform) + ":" + name;
        CPH.SetGlobalVar(key, value, true);
    }

    private void AddPoints(string id, Platform platform, int value)
    {
        if (value <= 0) return;
        SetVar(id, platform, "points", GetVar(id, platform, "points") + value);
    }

    private void Increment(string id, Platform platform, string name, int amount = 1)
    {
        SetVar(id, platform, name, GetVar(id, platform, name) + amount);
    }
}
