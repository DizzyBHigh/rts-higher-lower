using System;
using Newtonsoft.Json.Linq;

public class CPHInline
{
    private const string ConfigurationKey = "rts-higher-lower";
    private const string ConfigurationEvent = "RTS - Higher Lower - Configuration";
    private const string Players = "HLG Players";
    private const string Higher = "HLG Higher";
    private const string Lower = "HLG Lower";
    private const string Voted = "HLG Voted";
    private const string NoVote = "HLG NoVote";
    private const string OverlayCommand = "RTS - Overlay - Extension Command";

    public bool Execute()
    {
        if (!CPH.TryGetArg("rtsOverlayData", out string raw) ||
            string.IsNullOrWhiteSpace(raw))
            return false;

        var result = JObject.Parse(raw);
        var outcome = result.Value<string>("result");

        if (outcome != "higher" && outcome != "lower" && outcome != "equal")
            return false;

        var configuration = ReadConfiguration();
        var game = configuration["game"] as JObject ?? new JObject();

        if (outcome == "higher")
        {
            SettleWinners(Higher);
            SettleLosers(Lower, game);
        }
        else if (outcome == "lower")
        {
            SettleWinners(Lower);
            SettleLosers(Higher, game);
        }
        else
        {
            SettleWinners(Higher);
            SettleWinners(Lower);
        }

        EliminateNoVoters();
        UpdateGameState(game, result);
        ClearRoundGroups();
        SaveConfiguration(configuration);
        PushBoard(game);
        return true;
    }

    private void SettleWinners(string group)
    {
        foreach (var user in CPH.UsersInGroup(group))
        {
            int bet = GetVar(user.Id, "hlgBetAmount");
            int pot = GetVar(user.Id, "hlgPotAmount");

            SetVar(user.Id, "hlgPotAmount", pot + (bet * 2));
            SetVar(user.Id, "hlgBetAmount", 0);
            Increment(user.Id, "correct");
        }
    }

    private void SettleLosers(string group, JObject game)
    {
        foreach (var user in CPH.UsersInGroup(group))
        {
            int bet = GetVar(user.Id, "hlgBetAmount");
            int pot = GetVar(user.Id, "hlgPotAmount");

            AddBonusPot(game, bet + pot);
            SetVar(user.Id, "hlgPotAmount", 0);
            SetVar(user.Id, "hlgBetAmount", 0);
            Increment(user.Id, "wrong");
            Increment(user.Id, "pointsLost", bet + pot);
            CPH.RemoveUserIdFromGroup(user.Id, Platform.Twitch, Players);
        }
    }

    private void EliminateNoVoters()
    {
        foreach (var user in CPH.UsersInGroup(NoVote))
        {
            CPH.RemoveUserIdFromGroup(user.Id, Platform.Twitch, NoVote);
            CPH.RemoveUserIdFromGroup(user.Id, Platform.Twitch, Players);
        }
    }

    private void UpdateGameState(JObject game, JObject result)
    {
        game["round"] = result.Value<int?>("round") ?? game.Value<int?>("round") ?? 0;
        game["currentCard"] = result["currentCard"] ?? game["currentCard"];
        game["players"] = ReadPlayers();
        game["bonusPot"] = game.Value<int?>("bonusPot") ?? 0;
    }

    private JArray ReadPlayers()
    {
        var players = new JArray();

        foreach (var user in CPH.UsersInGroup(Players))
        {
            string vote = CPH.UserIdInGroup(user.Id, Platform.Twitch, Higher)
                ? "Higher"
                : CPH.UserIdInGroup(user.Id, Platform.Twitch, Lower)
                    ? "Lower"
                    : null;

            players.Add(new JObject
            {
                ["id"] = user.Id,
                ["name"] = user.Username,
                ["vote"] = vote,
                ["bet"] = GetVar(user.Id, "hlgBetAmount"),
                ["pot"] = GetVar(user.Id, "hlgPotAmount")
            });
        }

        return players;
    }

    private void PushBoard(JObject game)
    {
        var players = game["players"] as JArray ?? new JArray();
        int roundTotal = 0;
        int potTotal = 0;

        foreach (JObject player in players)
        {
            roundTotal += player.Value<int?>("bet") ?? 0;
            potTotal += player.Value<int?>("pot") ?? 0;
        }

        var data = new JObject
        {
            ["round"] = game.Value<int?>("round") ?? 0,
            ["players"] = players,
            ["roundTotal"] = roundTotal,
            ["potTotal"] = potTotal
        };

        CPH.SetArgument("rtsOverlayExtension", "rts-higher-lower");
        CPH.SetArgument("rtsOverlayCommand", "state");
        CPH.SetArgument(
            "rtsOverlayData",
            data.ToString(Newtonsoft.Json.Formatting.None));
        CPH.RunAction(OverlayCommand, true);
    }

    private void ClearRoundGroups()
    {
        foreach (var user in CPH.UsersInGroup(Voted))
            CPH.RemoveUserIdFromGroup(user.Id, Platform.Twitch, Voted);
        foreach (var user in CPH.UsersInGroup(Higher))
            CPH.RemoveUserIdFromGroup(user.Id, Platform.Twitch, Higher);
        foreach (var user in CPH.UsersInGroup(Lower))
            CPH.RemoveUserIdFromGroup(user.Id, Platform.Twitch, Lower);
    }

    private void AddBonusPot(JObject game, int amount)
    {
        if (amount <= 0) return;
        int current = game.Value<int?>("bonusPot") ?? 0;
        game["bonusPot"] = current + amount;
    }

    private JObject ReadConfiguration()
    {
        var raw = CPH.GetGlobalVar<string>(ConfigurationKey, true);
        if (string.IsNullOrWhiteSpace(raw)) return new JObject();
        try { return JObject.Parse(raw); }
        catch { return new JObject(); }
    }

    private void SaveConfiguration(JObject configuration)
    {
        string raw = configuration.ToString(Newtonsoft.Json.Formatting.None);
        CPH.SetGlobalVar(ConfigurationKey, raw, true);
        CPH.SetArgument("rtsHigherLowerConfiguration", raw);
        CPH.TriggerEvent(ConfigurationEvent, true);
    }

    private int GetVar(string userId, string name)
    {
        return CPH.GetTwitchUserVarById<int>(userId, name, true);
    }

    private void SetVar(string userId, string name, int value)
    {
        CPH.SetTwitchUserVarById(userId, name, value, true);
    }

    private void Increment(string userId, string name)
    {
        SetVar(userId, name, GetVar(userId, name) + 1);
    }
}
