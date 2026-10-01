using Newtonsoft.Json.Linq;

public class CPHInline
{
    private const string Higher = "HLG Higher";
    private const string Lower = "HLG Lower";
    private const string Players = "HLG Players";

    public bool Execute()
    {
        if (!CPH.TryGetArg("rtsOverlayData", out string raw))
            return false;

        var result = JObject.Parse(raw);
        var outcome = result.Value<string>("result");
        if (outcome != "higher" && outcome != "lower" && outcome != "equal")
            return false;

        int bonusDelta = 0;

        if (outcome == "higher")
        {
            SettleWinners(Higher);
            SettleLosers(Lower, ref bonusDelta);
        }
        else if (outcome == "lower")
        {
            SettleWinners(Lower);
            SettleLosers(Higher, ref bonusDelta);
        }
        else
        {
            SettleWinners(Higher);
            SettleWinners(Lower);
        }

        CPH.SetArgument("rtsHigherLowerBonusPotDelta", bonusDelta);
        CPH.SetArgument("rtsOverlayData", raw);
        CPH.RunAction("RTS - Higher Lower - State", true);
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

    private void SettleLosers(string group, ref int bonusDelta)
    {
        foreach (var user in CPH.UsersInGroup(group))
        {
            int bet = GetVar(user.Id, "hlgBetAmount");
            int pot = GetVar(user.Id, "hlgPotAmount");

            bonusDelta += bet + pot;
            SetVar(user.Id, "hlgPotAmount", 0);
            SetVar(user.Id, "hlgBetAmount", 0);
            Increment(user.Id, "wrong");
            Increment(user.Id, "pointsLost", bet + pot);
            CPH.RemoveUserIdFromGroup(user.Id, Platform.Twitch, Players);
        }
    }

    private int GetVar(string id, string name)
    {
        return CPH.GetTwitchUserVarById<int>(id, name, true);
    }

    private void SetVar(string id, string name, int value)
    {
        CPH.SetTwitchUserVarById(id, name, value, true);
    }

    private void Increment(string id, string name)
    {
        SetVar(id, name, GetVar(id, name) + 1);
    }
}
