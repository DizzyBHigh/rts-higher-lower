using System;
using System.Collections.Generic;
using Newtonsoft.Json;

public class CPHInline
{
    public bool Execute()
    {
        var players = new List<Dictionary<string, object>>
        {
            new Dictionary<string, object>
            {
                ["name"] = "DuhBuhHuh",
                ["vote"] = "Higher",
                ["bet"] = 5000
            },
            new Dictionary<string, object>
            {
                ["name"] = "Johnny",
                ["vote"] = "Lower",
                ["bet"] = 1000
            },
            new Dictionary<string, object>
            {
                ["name"] = "Dawn",
                ["vote"] = "Lower",
                ["status"] = "BANK",
                ["bet"] = 0
            },
            new Dictionary<string, object>
            {
                ["name"] = "JayGeeX",
                ["vote"] = "Higher",
                ["bet"] = 2000
            },
            new Dictionary<string, object>
            {
                ["name"] = "Bobby",
                ["vote"] = "Higher",
                ["bet"] = 2000
            }
        };

        var data = new Dictionary<string, object>
        {
            ["round"] = 4,
            ["players"] = players,
            ["roundTotal"] = 10000,
            ["potTotal"] = 28000
        };

        string json = JsonConvert.SerializeObject(data);

        CPH.SetArgument("rtsOverlayExtension", "rts-higher-lower");
        CPH.SetArgument("rtsOverlayCommand", "state");
        CPH.SetArgument("rtsOverlayData", json);

        CPH.RunAction("RTS - Overlay - Extension Command", true);
        return true;
    }
}
