using System;
using Newtonsoft.Json.Linq;

public class CPHInline
{
    private const string Key = "rts-higher-lower";
    private const string EventName = "RTS - Higher Lower - Configuration";
    private const string Players = "HLG Players";
    private const string Voted = "HLG Voted";
    private const string Higher = "HLG Higher";
    private const string Lower = "HLG Lower";
    private const string NoVote = "HLG NoVote";
    private const string Banked = "HLG Banked";

    public bool Execute()
    {
        if (!CPH.TryGetArg("rtsHigherLowerOperation", out string operation))
            return false;
        if (!CPH.TryGetArg("userId", out string userId) ||
            !CPH.TryGetArg("user", out string userName))
            return false;

        var configuration = ReadConfiguration();
        var game = configuration["game"] as JObject ?? new JObject();

        if (operation == "join")
            return Join(configuration, game, userId, userName);
        if (operation == "vote")
            return Vote(configuration, game, userId, userName);
        if (operation == "bank")
            return Bank(configuration, game, userId, userName);

        return false;
    }

    private bool Join(JObject configuration, JObject game, string id, string name)
    {
        if (game.Value<bool?>("active") == true)
            return false;

        var players = game["players"] as JArray ?? new JArray();
        if (Find(players, id) != null)
            return true;

        players.Add(new JObject
        {
            ["id"] = id,
            ["name"] = name,
            ["vote"] = null,
            ["bet"] = 0,
            ["pot"] = 0
        });

        game["players"] = players;
        Save(configuration);
        CPH.AddUserIdToGroup(id, Platform.Twitch, Players);
        CPH.SetTwitchUserVarById(id, "hlgPotAmount", 0, true);
        CPH.SetTwitchUserVarById(id, "hlgBetAmount", 0, true);
        CPH.RemoveUserIdFromGroup(id, Platform.Twitch, Banked);
        return true;
    }

    private bool Vote(JObject configuration, JObject game, string id, string name)
    {
        if (game.Value<bool?>("active") != true)
            return false;

        var players = game["players"] as JArray ?? new JArray();
        var player = Find(players, id);
        if (player == null ||
            CPH.UserIdInGroup(id, Platform.Twitch, Voted))
            return false;

        int points = CPH.GetTwitchUserVarById<int?>(id, "points", true) ?? 0;
        string raw = CPH.TryGetArg("rawInput", out string input)
            ? input.Trim()
            : "";
        int amount = 0;

        if (points > 0)
        {
            if (!int.TryParse(raw, out amount) || amount <= 0 || amount > points)
                return false;
            CPH.SetTwitchUserVarById(id, "points", points - amount, true);
        }

        string direction = CPH.TryGetArg(
            "rtsHigherLowerVote", out string vote) ? vote : "";
        if (direction != "Higher" && direction != "Lower")
            return false;

        player["vote"] = direction;
        player["bet"] = amount;
        CPH.SetTwitchUserVarById(id, "hlgBetAmount", amount, true);
        CPH.AddUserIdToGroup(id, Platform.Twitch, Voted);
        CPH.AddUserIdToGroup(
            id,
            Platform.Twitch,
            direction == "Higher" ? Higher : Lower);
        CPH.RemoveUserIdFromGroup(id, Platform.Twitch, NoVote);
        Save(configuration);
        PushBoard(game);
        return true;
    }

    private bool Bank(
        JObject configuration,
        JObject game,
        string id,
        string name)
    {
        if (game.Value<bool?>("active") != true ||
            CPH.UserIdInGroup(id, Platform.Twitch, Voted))
            return false;

        var players = game["players"] as JArray ?? new JArray();
        var player = Find(players, id);
        if (player == null)
            return false;

        int pot = CPH.GetTwitchUserVarById<int>(id, "hlgPotAmount", true);
        int points = CPH.GetTwitchUserVarById<int?>(id, "points", true) ?? 0;

        CPH.SetTwitchUserVarById(id, "points", points + pot, true);
        CPH.SetTwitchUserVarById(id, "hlgPotAmount", 0, true);
        CPH.SetTwitchUserVarById(id, "hlgBetAmount", 0, true);
        players.Remove(player);
        Save(configuration);
        CPH.RemoveUserIdFromGroup(id, Platform.Twitch, Players);
        CPH.RemoveUserIdFromGroup(id, Platform.Twitch, NoVote);
        CPH.AddUserIdToGroup(id, Platform.Twitch, Banked);
        PushBoard(game);
        return true;
    }

    private JObject Find(JArray players, string id)
    {
        foreach (JObject player in players)
            if (player.Value<string>("id") == id)
                return player;
        return null;
    }

    private JObject ReadConfiguration()
    {
        var raw = CPH.GetGlobalVar<string>(Key, true);
        if (string.IsNullOrWhiteSpace(raw))
            return new JObject();
        try { return JObject.Parse(raw); }
        catch { return new JObject(); }
    }

    private void Save(JObject configuration)
    {
        string raw = configuration.ToString(Newtonsoft.Json.Formatting.None);
        CPH.SetGlobalVar(Key, raw, true);
        CPH.SetArgument("rtsHigherLowerConfiguration", raw);
        CPH.TriggerEvent(EventName, true);
    }

    private void PushBoard(JObject game)
    {
        var data = new JObject
        {
            ["round"] = game.Value<int?>("round") ?? 0,
            ["players"] = game["players"] ?? new JArray()
        };

        CPH.SetArgument("rtsOverlayExtension", "rts-higher-lower");
        CPH.SetArgument("rtsOverlayCommand", "state");
        CPH.SetArgument(
            "rtsOverlayData",
            data.ToString(Newtonsoft.Json.Formatting.None));
        CPH.RunAction(
            "RTS - Overlay - Extension Command",
            true);
    }
}
