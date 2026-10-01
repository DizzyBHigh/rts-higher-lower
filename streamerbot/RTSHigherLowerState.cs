using Newtonsoft.Json.Linq;

public class CPHInline
{
    private const string Key = "rts-higher-lower";
    private const string Players = "HLG Players";
    private const string Higher = "HLG Higher";
    private const string Lower = "HLG Lower";
    private const string Voted = "HLG Voted";
    private const string NoVote = "HLG NoVote";

    public bool Execute()
    {
        if (!CPH.TryGetArg("rtsOverlayData", out string raw))
            return false;

        var configuration = ReadConfiguration();
        var game = configuration["game"] as JObject ?? new JObject();
        var result = JObject.Parse(raw);

        EliminateNoVoters();
        ApplyResult(game, result);
        ClearRoundGroups();

        CPH.SetArgument("rtsHigherLowerOperation", "save");
        CPH.SetArgument(
            "rtsHigherLowerConfiguration",
            configuration.ToString(Newtonsoft.Json.Formatting.None));
        CPH.RunAction("RTS - Higher Lower - Sync", true);
        return true;
    }

    private void ApplyResult(JObject game, JObject result)
    {
        int bonus = CPH.TryGetArg(
            "rtsHigherLowerBonusPotDelta", out int delta) ? delta : 0;
        int currentBonus = game.Value<int?>("bonusPot") ?? 0;

        game["bonusPot"] = currentBonus + bonus;
        game["round"] = result.Value<int?>("round") ?? 0;
        game["currentCard"] = result["currentCard"] ?? game["currentCard"];
        game["players"] = ReadPlayers();
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

    private void EliminateNoVoters()
    {
        foreach (var user in CPH.UsersInGroup(NoVote))
        {
            CPH.RemoveUserIdFromGroup(user.Id, Platform.Twitch, NoVote);
            CPH.RemoveUserIdFromGroup(user.Id, Platform.Twitch, Players);
        }
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

    private JObject ReadConfiguration()
    {
        var raw = CPH.GetGlobalVar<string>(Key, true);
        if (string.IsNullOrWhiteSpace(raw))
            return new JObject();
        try { return JObject.Parse(raw); }
        catch { return new JObject(); }
    }

    private int GetVar(string id, string name)
    {
        return CPH.GetTwitchUserVarById<int>(id, name, true);
    }
}
