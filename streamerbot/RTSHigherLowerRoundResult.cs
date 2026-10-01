using System;
using Newtonsoft.Json.Linq;

public class CPHInline
{
    private const string Players = "HLG Players";
    private const string Higher = "HLG Higher";
    private const string Lower = "HLG Lower";
    private const string Voted = "HLG Voted";
    private const string NoVote = "HLG NoVote";
    private const string BonusPot = "hlgBonusPot";

    public bool Execute()
    {
        if (!CPH.TryGetArg("rtsOverlayData", out string raw) ||
            string.IsNullOrWhiteSpace(raw))
            return false;

        var result = JObject.Parse(raw);
        var outcome = result.Value<string>("result");

        if (outcome != "higher" && outcome != "lower" && outcome != "equal")
            return false;

        if (outcome == "higher")
        {
            SettleWinners(Higher);
            SettleLosers(Lower);
        }
        else if (outcome == "lower")
        {
            SettleWinners(Lower);
            SettleLosers(Higher);
        }
        else
        {
            SettleWinners(Higher);
            SettleWinners(Lower);
        }

        EliminateNoVoters();
        ClearRoundGroups();
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

    private void SettleLosers(string group)
    {
        foreach (var user in CPH.UsersInGroup(group))
        {
            int bet = GetVar(user.Id, "hlgBetAmount");
            int pot = GetVar(user.Id, "hlgPotAmount");

            AddBonusPot(bet + pot);
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

    private void ClearRoundGroups()
    {
        foreach (var user in CPH.UsersInGroup(Voted))
            CPH.RemoveUserIdFromGroup(user.Id, Platform.Twitch, Voted);

        foreach (var user in CPH.UsersInGroup(Higher))
            CPH.RemoveUserIdFromGroup(user.Id, Platform.Twitch, Higher);

        foreach (var user in CPH.UsersInGroup(Lower))
            CPH.RemoveUserIdFromGroup(user.Id, Platform.Twitch, Lower);
    }

    private void AddBonusPot(int amount)
    {
        if (amount <= 0)
            return;

        int current = CPH.GetGlobalVar<int>(BonusPot);
        CPH.SetGlobalVar(BonusPot, current + amount, true);
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